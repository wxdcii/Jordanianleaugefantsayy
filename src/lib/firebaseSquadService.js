// Firebase Squad Service - Pure JavaScript for saving user squads
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Save user squad to Firebase subcollection
 * Structure: users/{userId}/squads/{gameweekId}
 */
export async function saveUserSquadToFirebase(squadData) {
  try {
    console.log('🚀 Saving squad to Firebase subcollection...')
    console.log('📄 Squad data:', {
      userId: squadData.userId,
      gameweekId: squadData.gameweekId,
      playersCount: squadData.players?.length,
      captainId: squadData.captainId,
      formation: squadData.formation
    })

    // Validate required data
    if (!squadData.userId || !squadData.gameweekId || !squadData.players) {
      throw new Error('Missing required squad data: userId, gameweekId, or players')
    }

    if (squadData.players.length !== 15) {
      throw new Error(`Squad must have exactly 15 players, got ${squadData.players.length}`)
    }

    if (!squadData.captainId) {
      throw new Error('Squad must have a captain')
    }

    // Create subcollection reference: users/{userId}/squads/{gameweekId}
    const userSquadsRef = collection(db, 'users', squadData.userId, 'squads')
    const squadDocRef = doc(userSquadsRef, `gw${squadData.gameweekId}`)

    console.log('📁 Saving to path:', squadDocRef.path)

    // Prepare squad data for Firebase
    const firebaseSquadData = {
      // Basic info
      userId: squadData.userId,
      gameweekId: squadData.gameweekId,
      
      // Squad composition
      players: squadData.players.map(player => ({
        playerId: player.playerId || player.id,
        name: player.name,
        position: player.position,
        club: player.club,
        price: player.price,
        isCaptain: player.isCaptain || false,
        isStarting: player.isStarting || false,
        benchPosition: player.benchPosition || null,
        points: player.points || 0
      })),
      
      // Team setup
      formation: squadData.formation,
      captainId: squadData.captainId,
      
      // Financial info
      totalValue: squadData.totalValue || 0,
      // transferCost: squadData.transferCost || 0, // REMOVED - now stored only in transferState
      
      // Chips and transfers
      chipsUsed: squadData.chipsUsed || {
        wildcard1: { used: false, gameweek: null, isActive: false },
        wildcard2: { used: false, gameweek: null, isActive: false },
        freeHit: { used: false, gameweek: null, isActive: false },
        benchBoost: { used: false, gameweek: null, isActive: false },
        tripleCaptain: { used: false, gameweek: null, isActive: false }
      },
      
      transferState: squadData.transferState || {
        savedFreeTransfers: 1,
        transfersMadeThisWeek: 0,
        pointsDeductedThisWeek: 0,
        lastGameweekProcessed: 0,
        wildcardActive: false,
        freeHitActive: false
      },
      
      // Validation and metadata
      isValid: squadData.isValid !== false, // Default to true
      validationErrors: squadData.validationErrors || [],
      deadline: squadData.deadline || '',
      isSubmitted: squadData.isSubmitted || false,
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      savedAt: new Date().toISOString()
    }

    // Save to Firebase
    await setDoc(squadDocRef, firebaseSquadData, { merge: true })

    console.log('✅ Squad saved successfully to Firebase!')
    console.log('📍 Document path:', squadDocRef.path)
    console.log('🎯 Captain:', squadData.captainId)
    console.log('⚽ Formation:', squadData.formation)

    return {
      success: true,
      documentId: `gw${squadData.gameweekId}`,
      path: squadDocRef.path,
      data: firebaseSquadData
    }

  } catch (error) {
    console.error('💥 Error saving squad to Firebase:', error)
    console.error('📋 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    
    throw new Error(`Failed to save squad: ${error.message}`)
  }
}

/**
 * Get user squad from Firebase subcollection
 */
export async function getUserSquadFromFirebase(userId, gameweekId) {
  try {
    console.log(`🔍 Getting squad for user ${userId}, GW ${gameweekId}`)
    
    const squadDocRef = doc(db, 'users', userId, 'squads', `gw${gameweekId}`)
    const squadDoc = await getDoc(squadDocRef)

    if (squadDoc.exists()) {
      const squadData = squadDoc.data()
      console.log('✅ Squad found:', squadData)
      return {
        success: true,
        data: squadData
      }
    } else {
      console.log('❌ Squad not found')
      return {
        success: false,
        error: 'Squad not found'
      }
    }

  } catch (error) {
    console.error('💥 Error getting squad:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get all squads for a user
 */
export async function getAllUserSquadsFromFirebase(userId) {
  try {
    console.log(`🔍 Getting all squads for user ${userId}`)
    
    const userSquadsRef = collection(db, 'users', userId, 'squads')
    const squadsQuery = query(userSquadsRef, orderBy('gameweekId', 'desc'))
    const querySnapshot = await getDocs(squadsQuery)

    const squads = []
    querySnapshot.forEach((doc) => {
      squads.push({
        id: doc.id,
        ...doc.data()
      })
    })

    console.log(`✅ Found ${squads.length} squads`)
    return {
      success: true,
      data: squads,
      count: squads.length
    }

  } catch (error) {
    console.error('💥 Error getting all squads:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Submit squad (mark as final)
 */
export async function submitUserSquadToFirebase(userId, gameweekId) {
  try {
    console.log(`📤 Submitting squad for user ${userId}, GW ${gameweekId}`)
    
    const squadDocRef = doc(db, 'users', userId, 'squads', `gw${gameweekId}`)
    
    await updateDoc(squadDocRef, {
      isSubmitted: true,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    console.log('✅ Squad submitted successfully!')
    return { success: true }

  } catch (error) {
    console.error('💥 Error submitting squad:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Delete squad
 */
export async function deleteUserSquadFromFirebase(userId, gameweekId) {
  try {
    console.log(`🗑️ Deleting squad for user ${userId}, GW ${gameweekId}`)
    
    const squadDocRef = doc(db, 'users', userId, 'squads', `gw${gameweekId}`)
    await deleteDoc(squadDocRef)

    console.log('✅ Squad deleted successfully!')
    return { success: true }

  } catch (error) {
    console.error('💥 Error deleting squad:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Check if squad exists
 */
export async function checkSquadExistsInFirebase(userId, gameweekId) {
  try {
    const squadDocRef = doc(db, 'users', userId, 'squads', `gw${gameweekId}`)
    const squadDoc = await getDoc(squadDocRef)
    
    return {
      success: true,
      exists: squadDoc.exists(),
      isSubmitted: squadDoc.exists() ? squadDoc.data()?.isSubmitted || false : false
    }

  } catch (error) {
    console.error('💥 Error checking squad existence:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get squad statistics
 */
export async function getSquadStatsFromFirebase(userId, gameweekId) {
  try {
    const result = await getUserSquadFromFirebase(userId, gameweekId)
    
    if (!result.success) {
      return result
    }

    const squad = result.data
    const players = squad.players || []
    
    // Calculate stats
    const totalPoints = players.reduce((sum, player) => {
      const basePoints = player.points || 0
      const multiplier = player.isCaptain ? 
        (squad.chipsUsed?.tripleCaptain?.isActive ? 3 : 2) : 1
      return sum + (basePoints * multiplier)
    }, 0)

    const captainPoints = players
      .filter(p => p.isCaptain)
      .reduce((sum, p) => sum + (p.points || 0), 0) * 
      (squad.chipsUsed?.tripleCaptain?.isActive ? 3 : 2)

    const benchPoints = players
      .filter(p => !p.isStarting)
      .reduce((sum, p) => sum + (p.points || 0), 0)

    const netPoints = totalPoints - (squad.transferState?.transferCost || 0) // Get from transferState

    return {
      success: true,
      stats: {
        totalPoints,
        captainPoints,
        benchPoints,
        transferCost: squad.transferState?.transferCost || 0, // Get from transferState instead of top-level
        netPoints
      }
    }

  } catch (error) {
    console.error('💥 Error getting squad stats:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
