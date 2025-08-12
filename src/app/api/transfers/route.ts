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
    
    // Enhanced check: Does user have squads in previous completed gameweeks?
    let hasSquadsInPreviousGameweeks = false
    let hasSquadForCurrentGameweek = false
    
    try {
      const squadsRef = collection(db, 'users', userId, 'squads')
      const squadsSnapshot = await getDocs(squadsRef)
      
      if (!squadsSnapshot.empty) {
        // Check if user has squads for gameweeks before the current one
        const previousGameweeks = []
        for (let gw = 1; gw < gameweekId; gw++) {
          previousGameweeks.push(`gw${gw}`)
        }
        
        const currentGameweekId = `gw${gameweekId}`
        
        console.log(`🔍 POST: Checking for squads in previous gameweeks: ${previousGameweeks.join(', ')}`)
        console.log(`🔍 POST: Checking for squad in current gameweek: ${currentGameweekId}`)
        
        for (const squadDoc of squadsSnapshot.docs) {
          if (previousGameweeks.includes(squadDoc.id)) {
            hasSquadsInPreviousGameweeks = true
            console.log(`✅ POST: Found squad in previous gameweek ${squadDoc.id}`)
          }
          if (squadDoc.id === currentGameweekId) {
            hasSquadForCurrentGameweek = true
            console.log(`✅ POST: Found squad in current gameweek ${squadDoc.id}`)
          }
        }
        
        console.log(`📊 POST: User has squads in previous gameweeks: ${hasSquadsInPreviousGameweeks}`)
        console.log(`📊 POST: User has squad for current gameweek: ${hasSquadForCurrentGameweek}`)
      }
    } catch (error) {
      console.warn('Could not check user squad history:', error)
    }
    
    // User gets 999 transfers ONLY if:
    // 1. They have never saved a squad (flag is false/undefined)
    // 2. They have no squads in previous gameweeks  
    // 3. They don't have a squad for the current gameweek yet
    const isFirstTimeForThisGameweek = !hasEverSavedSquadFlag && !hasSquadsInPreviousGameweeks && !hasSquadForCurrentGameweek
    
    // Only give unlimited transfers for their very first gameweek squad creation
    const shouldHaveUnlimitedTransfers = isFirstTimeForThisGameweek
    
    // Get current transfer state or initialize default
    let currentTransferState: UserTransferState = userData.transferState || getDefaultTransferState(gameweekId, shouldHaveUnlimitedTransfers)
    
    // Force unlimited transfers for first-time users on their first gameweek
    if (isFirstTimeForThisGameweek && currentTransferState.savedFreeTransfers < 9999) {
      currentTransferState.savedFreeTransfers = 9999
    }
    
    console.log('🎯 Current transfer state:', currentTransferState)
    console.log('🔍 Transfer conditions:', {
      hasEverSavedSquadFlag: hasEverSavedSquadFlag,
      hasSquadsInPreviousGameweeks: hasSquadsInPreviousGameweeks,
      hasSquadForCurrentGameweek: hasSquadForCurrentGameweek,
      isFirstTimeForThisGameweek: isFirstTimeForThisGameweek,
      shouldHaveUnlimitedTransfers: shouldHaveUnlimitedTransfers,
      gameweekId: gameweekId,
      savedFreeTransfers: currentTransferState.savedFreeTransfers
    })

    // Safety check for wildcard state - deactivate if gameweek has moved past when it was active
    if (currentTransferState.wildcardActive && currentTransferState.lastGameweekProcessed < gameweekId) {
      console.log(`🃏 POST Safety check: Wildcard was active in GW${currentTransferState.lastGameweekProcessed}, deactivating for GW${gameweekId}`);
      currentTransferState = {
        ...currentTransferState,
        wildcardActive: false,
        savedFreeTransfers: 1, // Transition to normal transfers
        transfersMadeThisWeek: 0,
        pointsDeductedThisWeek: 0,
        lastGameweekProcessed: gameweekId
      };
      console.log(`🔄 POST: Wildcard deactivated, state updated`);
    }

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
    
    // Enhanced check: Does user have squads in previous completed gameweeks?
    let hasSquadsInPreviousGameweeks = false
    let hasSquadForCurrentGameweek = false
    
    try {
      const squadsRef = collection(db, 'users', userId, 'squads')
      const squadsSnapshot = await getDocs(squadsRef)
      
      if (!squadsSnapshot.empty) {
        // Check if user has squads for gameweeks before the current one
        const previousGameweeks = []
        for (let gw = 1; gw < gameweekId; gw++) {
          previousGameweeks.push(`gw${gw}`)
        }
        
        const currentGameweekId = `gw${gameweekId}`
        
        console.log(`🔍 GET: Checking for squads in previous gameweeks: ${previousGameweeks.join(', ')}`)
        console.log(`🔍 GET: Checking for squad in current gameweek: ${currentGameweekId}`)
        
        for (const squadDoc of squadsSnapshot.docs) {
          if (previousGameweeks.includes(squadDoc.id)) {
            hasSquadsInPreviousGameweeks = true
            console.log(`✅ GET: Found squad in previous gameweek ${squadDoc.id}`)
          }
          if (squadDoc.id === currentGameweekId) {
            hasSquadForCurrentGameweek = true
            console.log(`✅ GET: Found squad in current gameweek ${squadDoc.id}`)
          }
        }
        
        console.log(`📊 GET: User has squads in previous gameweeks: ${hasSquadsInPreviousGameweeks}`)
        console.log(`📊 GET: User has squad for current gameweek: ${hasSquadForCurrentGameweek}`)
      }
    } catch (error) {
      console.warn('Could not check user squad history:', error)
    }
    
    // User gets 999 transfers ONLY if:
    // 1. They have never saved a squad (flag is false/undefined)
    // 2. They have no squads in previous gameweeks  
    // 3. They don't have a squad for the current gameweek yet
    const isFirstTimeForThisGameweek = !hasEverSavedSquadFlag && !hasSquadsInPreviousGameweeks && !hasSquadForCurrentGameweek
    
    // Only give unlimited transfers for their very first gameweek squad creation
    const shouldHaveUnlimitedTransfers = isFirstTimeForThisGameweek
    
    let transferState: UserTransferState = userData.transferState || getDefaultTransferState(gameweekId, shouldHaveUnlimitedTransfers)

    // Force unlimited transfers for first-time users on their first gameweek
    if (isFirstTimeForThisGameweek && transferState.savedFreeTransfers < 9999) {
      transferState.savedFreeTransfers = 9999
    }

    console.log(`🔍 Transfer API GET - GW${gameweekId}:`, {
      currentTransferState: transferState,
      gameweekRequested: gameweekId,
      hasEverSavedSquadFlag: hasEverSavedSquadFlag,
      hasSquadsInPreviousGameweeks: hasSquadsInPreviousGameweeks,
      hasSquadForCurrentGameweek: hasSquadForCurrentGameweek,
      isFirstTimeForThisGameweek: isFirstTimeForThisGameweek,
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

    // Step 1.5: Safety check for wildcard state - deactivate if gameweek has moved past when it was active
    if (transferState.wildcardActive && transferState.lastGameweekProcessed < gameweekId) {
      console.log(`🃏 Safety check: Wildcard was active in GW${transferState.lastGameweekProcessed}, deactivating for GW${gameweekId}`);
      transferState = {
        ...transferState,
        wildcardActive: false,
        savedFreeTransfers: 1, // Transition to normal transfers
        transfersMadeThisWeek: 0,
        pointsDeductedThisWeek: 0,
        lastGameweekProcessed: gameweekId
      };
      
      // Save the wildcard deactivation
      await updateDoc(userDocRef, {
        transferState: transferState,
        lastUpdated: new Date()
      });
      
      console.log(`💾 Saved wildcard deactivation for GW${gameweekId}`);
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
