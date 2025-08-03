import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  UserTransferState,
  applyTransfer,
  processGameweekStart,
  getDefaultTransferState,
  autoResetTransferPenalties,
  TransferData
} from '@/lib/fantasyLogic'

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      playerOutId, 
      playerInId, 
      gameweekId 
    } = await request.json()

    if (!userId || !playerOutId || !playerInId || !gameweekId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log(`🔄 Processing transfer for user ${userId} in GW${gameweekId}`)
    console.log(`📤 Player Out: ${playerOutId}`)
    console.log(`📥 Player In: ${playerInId}`)

    // Get user document
    const userDocRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    
    // Get current transfer state or initialize default
    let currentTransferState: UserTransferState = userData.transferState || getDefaultTransferState()
    
    console.log('🎯 Current transfer state:', currentTransferState)

    // Process gameweek start if needed
    const processedState = processGameweekStart(currentTransferState, gameweekId)
    
    if (processedState.lastGameweekProcessed !== currentTransferState.lastGameweekProcessed) {
      console.log(`🔄 Processing gameweek ${gameweekId} start`)
      console.log('📊 Updated transfer state:', processedState)
      currentTransferState = processedState
    }

    // Apply the transfer
    const { newState, summary } = applyTransfer(currentTransferState, gameweekId)
    
    console.log('📋 Transfer summary:', summary)
    console.log('🔄 New transfer state:', newState)

    // Create transfer record
    const transferData: TransferData = {
      playerOut: playerOutId,
      playerIn: playerInId,
      gameweekId,
      transferCost: summary.pointsDeducted,
      timestamp: new Date()
    }

    // Save transfer record to subcollection
    const transfersRef = collection(db, 'users', userId, 'transfers')
    await addDoc(transfersRef, transferData)

    // Update user document with new transfer state
    await updateDoc(userDocRef, {
      transferState: newState,
      lastUpdated: new Date()
    })

    console.log('✅ Transfer processed successfully!')

    return NextResponse.json({
      success: true,
      transferState: newState,
      summary,
      message: getTransferMessage(summary, gameweekId)
    })

  } catch (error) {
    console.error('❌ Error processing transfer:', error)
    return NextResponse.json(
      { error: 'Failed to process transfer' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const gameweekId = parseInt(searchParams.get('gameweekId') || '1')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    // Get user document
    const userDocRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    let transferState: UserTransferState = userData.transferState || getDefaultTransferState()

    console.log(`🔍 Transfer API GET - GW${gameweekId}:`, {
      currentTransferState: transferState,
      gameweekRequested: gameweekId
    });

    // Step 1: Auto-reset transfer penalties if the gameweek where transfers were made is now closed
    const autoResetState = await autoResetTransferPenalties(transferState, gameweekId);
    if (autoResetState !== transferState) {
      console.log(`🔄 Auto-reset applied: Transfer penalties cleared because GW${transferState.lastGameweekProcessed} is now closed`);
      transferState = autoResetState;

      // Save the auto-reset state
      await updateDoc(userDocRef, {
        transferState: autoResetState,
        lastUpdated: new Date()
      });
    }

    // Step 2: Process gameweek start if needed (normal gameweek progression)
    const processedState = processGameweekStart(transferState, gameweekId)

    if (processedState.lastGameweekProcessed !== transferState.lastGameweekProcessed) {
      console.log(`💾 Saving reset transfer state for GW${gameweekId}`);
      transferState = processedState
      // Save the processed state
      await updateDoc(userDocRef, {
        transferState: processedState,
        lastUpdated: new Date()
      })
    } else {
      console.log(`⏭️ No transfer state reset needed for GW${gameweekId}`);
    }

    return NextResponse.json({
      transferState,
      gameweekId
    })

  } catch (error) {
    console.error('❌ Error fetching transfer state:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfer state' },
      { status: 500 }
    )
  }
}

// Helper function to generate transfer messages
interface TransferSummary {
  wildcardUsed?: boolean;
  freeHitUsed?: boolean;
  paidTransfers?: number;
  pointsDeducted?: number;
}

function getTransferMessage(summary: TransferSummary, gameweekId: number): string {
  if (gameweekId === 1) {
    return `Transfer completed! (GW1 - Unlimited free transfers)`
  }
  
  if (summary.wildcardUsed) {
    return `Transfer completed! (Wildcard active - No cost)`
  }
  
  if (summary.freeHitUsed) {
    return `Transfer completed! (Free Hit active - No cost)`
  }
  
  if ((summary.paidTransfers ?? 0) > 0) {
    return `Transfer completed! This will cost ${summary.pointsDeducted ?? 0} points.`
  }
  
  return `Transfer completed! Free transfer used.`
}
