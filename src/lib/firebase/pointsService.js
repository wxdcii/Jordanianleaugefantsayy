import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  collection, 
  getDocs,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Points Service - Handle user points storage and retrieval
 */

/**
 * Save gameweek points for a user
 * @param {string} userId - User ID
 * @param {number} gameweek - Gameweek number
 * @param {number} points - Points earned
 * @param {Object} breakdown - Points breakdown
 * @returns {Promise<Object>} Save result
 */
export async function saveGameweekPoints(userId, gameweek, points, breakdown = {}) {
  try {
    const pointsDocRef = doc(db, `users/${userId}/GameweekPoints/gw${gameweek}`)
    
    const pointsData = {
      userId: userId,
      gameweek: gameweek,
      points: points,
      pointsBreakdown: breakdown,
      createdAt: new Date(),
      lastUpdated: new Date()
    }
    
    await setDoc(pointsDocRef, pointsData, { merge: true })
    
    console.log(`✅ Saved ${points} points for user ${userId}, GW${gameweek}`)
    
    return {
      success: true,
      message: `Points saved: ${points}`,
      data: pointsData
    }
    
  } catch (error) {
    console.error('Error saving gameweek points:', error)
    return {
      success: false,
      message: error.message,
      error: error
    }
  }
}

/**
 * Get gameweek points for a user
 * @param {string} userId - User ID
 * @param {number} gameweek - Gameweek number
 * @returns {Promise<Object>} Points data
 */
export async function getGameweekPoints(userId, gameweek) {
  try {
    const pointsDoc = await getDoc(doc(db, `users/${userId}/GameweekPoints/gw${gameweek}`))
    
    if (pointsDoc.exists()) {
      return {
        success: true,
        data: pointsDoc.data(),
        message: 'Points retrieved successfully'
      }
    } else {
      return {
        success: false,
        data: null,
        message: `No points found for user ${userId}, GW${gameweek}`
      }
    }
    
  } catch (error) {
    console.error('Error getting gameweek points:', error)
    return {
      success: false,
      data: null,
      message: error.message,
      error: error
    }
  }
}

/**
 * Get all gameweek points for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} All gameweek points
 */
export async function getAllUserGameweekPoints(userId) {
  try {
    const pointsSnapshot = await getDocs(collection(db, `users/${userId}/GameweekPoints`))
    
    const gameweekPoints = {}
    let totalPoints = 0
    
    pointsSnapshot.forEach(doc => {
      const data = doc.data()
      gameweekPoints[doc.id] = data
      totalPoints += data.points || 0
    })
    
    return {
      success: true,
      data: {
        gameweekPoints: gameweekPoints,
        totalPoints: totalPoints,
        gameweeksPlayed: pointsSnapshot.size
      },
      message: 'All gameweek points retrieved successfully'
    }
    
  } catch (error) {
    console.error('Error getting all user gameweek points:', error)
    return {
      success: false,
      data: null,
      message: error.message,
      error: error
    }
  }
}

/**
 * Get user ranking based on total points
 * @param {string} userId - User ID (optional, if provided returns user's specific ranking)
 * @returns {Promise<Object>} Ranking data
 */
export async function getUserRanking(userId = null) {
  try {
    // Get all users with their total points
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const userRankings = []
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      const userTotalPoints = userData.totalPoints || 0
      
      // Only include users who have points (have played)
      if (userTotalPoints > 0 || userDoc.id === userId) {
        userRankings.push({
          userId: userDoc.id,
          displayName: userData.displayName || userData.email || 'Unknown User',
          totalPoints: userTotalPoints,
          lastPointsUpdate: userData.lastPointsUpdate,
          gameweekBreakdown: userData.gameweekBreakdown || {}
        })
      }
    }
    
    // Sort by total points (descending)
    userRankings.sort((a, b) => b.totalPoints - a.totalPoints)
    
    // Add ranking positions
    userRankings.forEach((user, index) => {
      user.rank = index + 1
    })
    
    if (userId) {
      // Return specific user's ranking
      const userRanking = userRankings.find(user => user.userId === userId)
      return {
        success: true,
        data: {
          userRanking: userRanking,
          totalUsers: userRankings.length
        },
        message: userRanking ? 'User ranking retrieved' : 'User not found in rankings'
      }
    } else {
      // Return all rankings
      return {
        success: true,
        data: {
          rankings: userRankings,
          totalUsers: userRankings.length
        },
        message: 'All rankings retrieved successfully'
      }
    }
    
  } catch (error) {
    console.error('Error getting user ranking:', error)
    return {
      success: false,
      data: null,
      message: error.message,
      error: error
    }
  }
}

/**
 * Get top users leaderboard
 * @param {number} limitCount - Number of top users to return (default: 10)
 * @returns {Promise<Object>} Leaderboard data
 */
export async function getLeaderboard(limitCount = 10) {
  try {
    const rankingsResult = await getUserRanking()
    
    if (!rankingsResult.success) {
      return rankingsResult
    }
    
    const topUsers = rankingsResult.data.rankings.slice(0, limitCount)
    
    return {
      success: true,
      data: {
        leaderboard: topUsers,
        totalUsers: rankingsResult.data.totalUsers
      },
      message: `Top ${limitCount} users retrieved successfully`
    }
    
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    return {
      success: false,
      data: null,
      message: error.message,
      error: error
    }
  }
}

/**
 * Get gameweek leaderboard (points for specific gameweek)
 * @param {number} gameweek - Gameweek number
 * @param {number} limitCount - Number of top users to return (default: 10)
 * @returns {Promise<Object>} Gameweek leaderboard data
 */
export async function getGameweekLeaderboard(gameweek, limitCount = 10) {
  try {
    console.log(`📊 Getting GW${gameweek} leaderboard...`)
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const gameweekRankings = []
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      const userData = userDoc.data()
      
      // Get gameweek points for this user
      const pointsResult = await getGameweekPoints(userId, gameweek)
      
      if (pointsResult.success && pointsResult.data) {
        gameweekRankings.push({
          userId: userId,
          displayName: userData.displayName || userData.email || 'Unknown User',
          gameweekPoints: pointsResult.data.points,
          pointsBreakdown: pointsResult.data.pointsBreakdown,
          totalPoints: userData.totalPoints || 0
        })
      }
    }
    
    // Sort by gameweek points (descending)
    gameweekRankings.sort((a, b) => b.gameweekPoints - a.gameweekPoints)
    
    // Add ranking positions
    gameweekRankings.forEach((user, index) => {
      user.rank = index + 1
    })
    
    const topUsers = gameweekRankings.slice(0, limitCount)
    
    return {
      success: true,
      data: {
        gameweek: gameweek,
        leaderboard: topUsers,
        totalUsers: gameweekRankings.length
      },
      message: `GW${gameweek} top ${limitCount} users retrieved successfully`
    }
    
  } catch (error) {
    console.error('Error getting gameweek leaderboard:', error)
    return {
      success: false,
      data: null,
      message: error.message,
      error: error
    }
  }
}

/**
 * Initialize points for a new user (when they save their first team)
 * @param {string} userId - User ID
 * @param {number} gameweek - Starting gameweek
 * @returns {Promise<Object>} Initialization result
 */
export async function initializeUserPoints(userId, gameweek) {
  try {
    // Set initial points to 0 for the gameweek
    const result = await saveGameweekPoints(userId, gameweek, 0, {
      startingXI: [],
      bench: [],
      captainBonus: 0,
      chipsBonus: 0
    })
    
    // Initialize user's total points
    await updateDoc(doc(db, 'users', userId), {
      totalPoints: 0,
      gameweekBreakdown: { [`gw${gameweek}`]: 0 },
      lastPointsUpdate: new Date(),
      firstGameweek: gameweek
    })
    
    return {
      success: true,
      message: `Points initialized for user ${userId} starting from GW${gameweek}`,
      data: result.data
    }
    
  } catch (error) {
    console.error('Error initializing user points:', error)
    return {
      success: false,
      message: error.message,
      error: error
    }
  }
}
