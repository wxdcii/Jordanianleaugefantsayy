import { getAuth } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { saveUserSquad, getUserSquad, checkGameweekDeadline } from './squadManager'
import { calculateUserGameweekPoints } from './squadManager'

/**
 * Validate squad formation and player positions
 * @param {Object} squadData - Squad data to validate
 * @returns {Object} Validation result
 */
export function validateSquadFormation(squadData) {
  const { formation, startingXI, bench } = squadData

  // Check total players
  if (startingXI.length !== 11 || bench.length !== 4) {
    return {
      isValid: false,
      message: 'Squad must have exactly 11 starting players and 4 bench players'
    }
  }

  // Count positions in starting XI
  const positionCounts = {
    GKP: 0,
    DEF: 0,
    MID: 0,
    FWD: 0
  }

  startingXI.forEach(player => {
    if (positionCounts.hasOwnProperty(player.position)) {
      positionCounts[player.position]++
    }
  })

  // Validate formation requirements
  const formationRules = {
    '3-4-3': { GKP: 1, DEF: 3, MID: 4, FWD: 3 },
    '3-5-2': { GKP: 1, DEF: 3, MID: 5, FWD: 2 },
    '4-3-3': { GKP: 1, DEF: 4, MID: 3, FWD: 3 },
    '4-4-2': { GKP: 1, DEF: 4, MID: 4, FWD: 2 },
    '4-5-1': { GKP: 1, DEF: 4, MID: 5, FWD: 1 },
    '5-3-2': { GKP: 1, DEF: 5, MID: 3, FWD: 2 },
    '5-4-1': { GKP: 1, DEF: 5, MID: 4, FWD: 1 }
  }

  if (!formationRules[formation]) {
    return {
      isValid: false,
      message: 'Invalid formation selected'
    }
  }

  const requiredPositions = formationRules[formation]
  
  for (const [position, required] of Object.entries(requiredPositions)) {
    if (positionCounts[position] !== required) {
      return {
        isValid: false,
        message: `Formation ${formation} requires ${required} ${position} players, but ${positionCounts[position]} selected`
      }
    }
  }

  // Validate bench has at least 1 GKP
  const benchGKP = bench.filter(player => player.position === 'GKP').length
  if (benchGKP < 1) {
    return {
      isValid: false,
      message: 'Bench must include at least 1 goalkeeper'
    }
  }

  return {
    isValid: true,
    message: 'Squad formation is valid'
  }
}

/**
 * Check if user is authenticated and authorized to save squad
 * @param {string} userId - User ID to check against
 * @returns {Object} Authorization result
 */
export function checkUserAuthorization(userId) {
  const auth = getAuth()
  const currentUser = auth.currentUser

  if (!currentUser) {
    return {
      isAuthorized: false,
      message: 'User must be logged in to save squad'
    }
  }

  if (currentUser.uid !== userId) {
    return {
      isAuthorized: false,
      message: 'Users can only save their own squads'
    }
  }

  return {
    isAuthorized: true,
    user: currentUser
  }
}

/**
 * Save squad with full validation and authorization
 * @param {Object} squadData - Complete squad data
 * @param {number} gameweek - Current gameweek
 * @returns {Promise<Object>} Save result
 */
export async function saveSquadWithValidation(squadData, gameweek) {
  try {
    // Get current user
    const auth = getAuth()
    const currentUser = auth.currentUser

    if (!currentUser) {
      return {
        success: false,
        message: 'Please log in to save your squad'
      }
    }

    // Validate squad formation
    const formationValidation = validateSquadFormation(squadData)
    if (!formationValidation.isValid) {
      return {
        success: false,
        message: formationValidation.message
      }
    }

    // Check authorization
    const authCheck = checkUserAuthorization(currentUser.uid)
    if (!authCheck.isAuthorized) {
      return {
        success: false,
        message: authCheck.message
      }
    }

    // Save the squad
    const saveResult = await saveUserSquad(currentUser.uid, gameweek, squadData)
    
    return saveResult

  } catch (error) {
    console.error('Error saving squad with validation:', error)
    return {
      success: false,
      message: 'Failed to save squad',
      error: error.message
    }
  }
}

/**
 * Get current gameweek number
 * @returns {Promise<number>} Current gameweek number
 */
export async function getCurrentGameweek() {
  try {
    // Query gameweeks to find the current one
    const gameweeksRef = collection(db, 'gameweeks')
    const gameweeksSnapshot = await getDocs(gameweeksRef)
    
    let currentGameweek = 1
    const now = new Date()

    gameweeksSnapshot.forEach(doc => {
      const data = doc.data()
      if (data.isCurrent === true) {
        currentGameweek = data.number
      }
    })

    return currentGameweek

  } catch (error) {
    console.error('Error getting current gameweek:', error)
    return 1 // Default to gameweek 1
  }
}

/**
 * Get user's squad with points for display
 * @param {string} userId - User ID
 * @param {number} gameweek - Gameweek number
 * @returns {Promise<Object>} Squad with points data
 */
export async function getUserSquadWithPoints(userId, gameweek) {
  try {
    // Get squad data
    const squad = await getUserSquad(userId, gameweek)
    if (!squad) {
      return null
    }

    // Calculate points
    const pointsResult = await calculateUserGameweekPoints(userId, gameweek)
    
    return {
      ...squad,
      points: pointsResult.success ? pointsResult : null,
      totalPoints: pointsResult.totalPoints || 0
    }

  } catch (error) {
    console.error('Error getting squad with points:', error)
    return null
  }
}

/**
 * Check if squad can be modified (before deadline)
 * @param {number} gameweek - Gameweek number
 * @returns {Promise<Object>} Modification status
 */
export async function canModifySquad(gameweek) {
  try {
    const deadlineCheck = await checkGameweekDeadline(gameweek)
    
    return {
      canModify: deadlineCheck.isValid,
      message: deadlineCheck.message,
      deadline: deadlineCheck.deadline,
      timeRemaining: deadlineCheck.timeRemaining
    }

  } catch (error) {
    console.error('Error checking squad modification status:', error)
    return {
      canModify: false,
      message: 'Error checking deadline'
    }
  }
}

/**
 * Format time remaining until deadline
 * @param {number} milliseconds - Time remaining in milliseconds
 * @returns {string} Formatted time string
 */
export function formatTimeRemaining(milliseconds) {
  if (milliseconds <= 0) {
    return 'Deadline passed'
  }

  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24))
  const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

/**
 * Get squad summary for display
 * @param {Object} squad - Squad data
 * @returns {Object} Squad summary
 */
export function getSquadSummary(squad) {
  if (!squad) return null

  const positionCounts = {
    GKP: 0,
    DEF: 0,
    MID: 0,
    FWD: 0
  }

  // Count starting XI positions
  squad.startingXI.forEach(player => {
    if (positionCounts.hasOwnProperty(player.position)) {
      positionCounts[player.position]++
    }
  })

  // Find captain and vice captain
  const captain = squad.startingXI.find(p => p.playerId === squad.captainId)
  const viceCaptain = squad.startingXI.find(p => p.playerId === squad.viceCaptainId)

  return {
    formation: squad.formation,
    positionCounts,
    totalPlayers: squad.startingXI.length + squad.bench.length,
    captain: captain?.name || 'Not selected',
    viceCaptain: viceCaptain?.name || 'Not selected',
    savedAt: squad.savedAt,
    gameweek: squad.gameweek
  }
}
