import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, updateDoc, collection, addDoc, getDocs } from 'firebase/firestore'
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
    
    // Check if this is a completely new user by looking at both flag and actual squad history
    const hasEverSavedSquadFlag = userData.hasEverSavedSquad
    
    // Additional check: Does user actually have any squads in their subcollection?
    let hasAnySquads = false
    try {
      const squadsRef = collection(db, 'users', userId, 'squads')
      const squadsSnapshot = await getDocs(squadsRef)
      hasAnySquads = !squadsSnapshot.empty
    } catch (error) {
      console.warn('Could not check user squad history:', error)
    }
    
    // User is truly new only if they have NEVER saved a squad AND have no squads in their collection
    const isNewUser = !hasEverSavedSquadFlag && !hasAnySquads
    
    // New users who have never saved a squad get unlimited transfers (9999)
    const shouldHaveUnlimitedTransfers = isNewUser
    
    // Get current transfer state or initialize default
    let currentTransferState: UserTransferState = userData.transferState || getDefaultTransferState(gameweekId, shouldHaveUnlimitedTransfers)
    
    // Force unlimited transfers for new users
    if (isNewUser && currentTransferState.savedFreeTransfers < 9999) {
      currentTransferState.savedFreeTransfers = 9999
    }
    
    console.log('🎯 Current transfer state:', currentTransferState)
    console.log('🔍 Transfer conditions:', {
      hasEverSavedSquadFlag: hasEverSavedSquadFlag,
      hasAnySquads: hasAnySquads,
      isNewUser: isNewUser,
      shouldHaveUnlimitedTransfers: shouldHaveUnlimitedTransfers,
      gameweekId: gameweekId,
      savedFreeTransfers: currentTransferState.savedFreeTransfers
    })

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
    
    // Check if this is a completely new user by looking at both flag and actual squad history
    const hasEverSavedSquadFlag = userData.hasEverSavedSquad
    
    // Additional check: Does user actually have any squads in their subcollection?
    let hasAnySquads = false
    try {
      const squadsRef = collection(db, 'users', userId, 'squads')
      const squadsSnapshot = await getDocs(squadsRef)
      hasAnySquads = !squadsSnapshot.empty
    } catch (error) {
      console.warn('Could not check user squad history:', error)
    }
    
    // User is truly new only if they have NEVER saved a squad AND have no squads in their collection
    const isNewUser = !hasEverSavedSquadFlag && !hasAnySquads
    
    // New users who have never saved a squad get unlimited transfers (9999)
    const shouldHaveUnlimitedTransfers = isNewUser
    
    let transferState: UserTransferState = userData.transferState || getDefaultTransferState(gameweekId, shouldHaveUnlimitedTransfers)

    // Force unlimited transfers for new users
    if (isNewUser && transferState.savedFreeTransfers < 9999) {
      transferState.savedFreeTransfers = 9999
    }

    console.log(`🔍 Transfer API GET - GW${gameweekId}:`, {
      currentTransferState: transferState,
      gameweekRequested: gameweekId,
      hasEverSavedSquadFlag: hasEverSavedSquadFlag,
      hasAnySquads: hasAnySquads,
      isNewUser: isNewUser,
      shouldHaveUnlimitedTransfers: shouldHaveUnlimitedTransfers,
      savedFreeTransfers: transferState.savedFreeTransfers
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
    // Don't process gameweek start for new users - they should keep unlimited transfers
    const processedState = shouldHaveUnlimitedTransfers ? 
      transferState : // Keep current state for new users
      processGameweekStart(transferState, gameweekId)

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
  
  return `Transfer completed! Free transfer used (New users have unlimited transfers).`
}
