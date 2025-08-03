
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'


/**
 * Save user's selected squad to Firestore
 * @param {string} userId - User's UID
 * @param {number} gameweek - Current gameweek number
 * @param {Object} squadData - Squad data object
 * @param {string} squadData.formation - Formation (e.g., "3-4-3")
 * @param {Array} squadData.startingXI - Array of starting players
 * @param {Array} squadData.bench - Array of bench players
 * @param {string} squadData.captainId - Captain player ID
 * @param {string} squadData.viceCaptainId - Vice captain player ID
 * @returns {Promise<Object>} Success/error response
 */
export async function saveUserSquad(userId, gameweek, squadData) {
  try {
    // Validate input
    if (!userId || !gameweek || !squadData) {
      throw new Error('Missing required parameters')
    }

    // Validate squad structure
    const { formation, startingXI, bench, captainId, viceCaptainId } = squadData
    
    if (!formation || !startingXI || !bench || !captainId) {
      throw new Error('Invalid squad data structure')
    }

    if (startingXI.length !== 11) {
      throw new Error('Starting XI must have exactly 11 players')
    }

    if (bench.length !== 4) {
      throw new Error('Bench must have exactly 4 players')
    }

    // Check if deadline has passed
    const deadlineCheck = await checkGameweekDeadline(gameweek)
    if (!deadlineCheck.isValid) {
      throw new Error(deadlineCheck.message)
    }

    // Prepare squad document
    const squadDoc = {
      formation,
      startingXI: startingXI.map(player => ({
        playerId: player.playerId,
        position: player.position,
        name: player.name || '',
        team: player.team || ''
      })),
      bench: bench.map(player => ({
        playerId: player.playerId,
        position: player.position,
        name: player.name || '',
        team: player.team || ''
      })),
      captainId,
      viceCaptainId: viceCaptainId || null,
      gameweek,
      savedAt: new Date(),
      totalPlayers: 15,
      isValid: true
    }

    // Save to Firestore
    const squadRef = doc(db, 'users', userId, 'squads', `gw${gameweek}`)
    await setDoc(squadRef, squadDoc)

    return {
      success: true,
      message: 'Squad saved successfully',
      squadId: `gw${gameweek}`,
      savedAt: squadDoc.savedAt
    }

  } catch (error) {
    console.error('Error saving squad:', error)
    return {
      success: false,
      message: error.message || 'Failed to save squad',
      error: error
    }
  }
}

/**
 * Check if gameweek deadline has passed
 * @param {number} gameweek - Gameweek number
 * @returns {Promise<Object>} Deadline validation result
 */
export async function checkGameweekDeadline(gameweek) {
  try {
    const gameweekRef = doc(db, 'gameweeks', `gw${gameweek}`)
    const gameweekDoc = await getDoc(gameweekRef)

    if (!gameweekDoc.exists()) {
      return {
        isValid: false,
        message: 'Gameweek not found'
      }
    }

    const gameweekData = gameweekDoc.data()
    const deadline = gameweekData.deadline?.toDate() || new Date(gameweekData.deadline)
    const now = new Date()

    if (now > deadline) {
      return {
        isValid: false,
        message: `Deadline has passed. Deadline was ${deadline.toLocaleString()}`
      }
    }

    return {
      isValid: true,
      deadline: deadline,
      timeRemaining: deadline - now
    }

  } catch (error) {
    console.error('Error checking deadline:', error)
    return {
      isValid: false,
      message: 'Error checking deadline'
    }
  }
}

/**
 * Get user's squad for a specific gameweek
 * @param {string} userId - User's UID
 * @param {number} gameweek - Gameweek number
 * @returns {Promise<Object|null>} Squad data or null if not found
 */
export async function getUserSquad(userId, gameweek) {
  try {
    const squadRef = doc(db, 'users', userId, 'squads', `gw${gameweek}`)
    const squadDoc = await getDoc(squadRef)

    if (!squadDoc.exists()) {
      return null
    }

    return {
      id: squadDoc.id,
      ...squadDoc.data()
    }

  } catch (error) {
    console.error('Error getting user squad:', error)
    return null
  }
}

/**
 * Calculate points for a user's squad in a specific gameweek
 * @param {string} userId - User's UID
 * @param {number} gameweek - Gameweek number
 * @returns {Promise<Object>} Points calculation result
 */
export async function calculateUserGameweekPoints(userId, gameweek) {
  try {
    // Get user's squad
    const squad = await getUserSquad(userId, gameweek)
    if (!squad) {
      return {
        success: false,
        message: 'Squad not found for this gameweek',
        points: 0
      }
    }

    let totalPoints = 0
    const playerPoints = []

    // Calculate points for starting XI
    for (const player of squad.startingXI) {
      const points = await getPlayerGameweekPoints(player.playerId, gameweek)
      let finalPoints = points

      // Double points for captain
      if (player.playerId === squad.captainId) {
        finalPoints = points * 2
      }

      totalPoints += finalPoints
      playerPoints.push({
        playerId: player.playerId,
        name: player.name,
        position: player.position,
        points: points,
        finalPoints: finalPoints,
        isCaptain: player.playerId === squad.captainId,
        isViceCaptain: player.playerId === squad.viceCaptainId
      })
    }

    return {
      success: true,
      totalPoints,
      playerPoints,
      gameweek,
      squadId: squad.id
    }

  } catch (error) {
    console.error('Error calculating user points:', error)
    return {
      success: false,
      message: error.message,
      points: 0
    }
  }
}

/**
 * Get player's points for a specific gameweek
 * @param {string} playerId - Player's ID
 * @param {number} gameweek - Gameweek number
 * @returns {Promise<number>} Player's points
 */
export async function getPlayerGameweekPoints(playerId, gameweek) {
  try {
    // Try to get from player's gameweek stats first
    const statsRef = doc(db, 'players', playerId, 'gameweek_stats', `gw${gameweek}`)
    const statsDoc = await getDoc(statsRef)

    if (statsDoc.exists()) {
      return statsDoc.data().points || 0
    }

    // Fallback: get from player's main document
    const playerRef = doc(db, 'players', playerId)
    const playerDoc = await getDoc(playerRef)

    if (playerDoc.exists()) {
      const playerData = playerDoc.data()
      // Return gameweek-specific points if available, otherwise 0
      return playerData.gameweekPoints?.[`gw${gameweek}`] || 0
    }

    return 0

  } catch (error) {
    console.error('Error getting player points:', error)
    return 0
  }
}

// Calculate points for all users in gameweek 27
const result = await calculateAllUserPoints(27)

// Get top 10 users
const topUsers = await getLeaderboard(10)



