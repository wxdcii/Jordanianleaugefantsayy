import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  writeBatch,
  query,
  orderBy,
  getDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { calculateUserGameweekPoints, getUserSquad } from './squadManager'

/**
 * Calculate and update points for all users after a gameweek finishes
 * @param {number} gameweek - Gameweek number
 * @returns {Promise<Object>} Calculation results
 */
export async function calculateAllUserPoints(gameweek) {
  try {
    console.log(`Starting points calculation for gameweek ${gameweek}...`)
    
    // Get all users
    const usersRef = collection(db, 'users')
    const usersSnapshot = await getDocs(usersRef)
    
    const userResults = []
    const batch = writeBatch(db)
    let processedUsers = 0

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      const userData = userDoc.data()

      try {
        // Calculate points for this user's gameweek
        const pointsResult = await calculateUserGameweekPoints(userId, gameweek)
        
        if (pointsResult.success) {
          // Get current total points
          const currentTotalPoints = userData.totalPoints || 0
          const newTotalPoints = currentTotalPoints + pointsResult.totalPoints

          // Prepare user result
          const userResult = {
            userId,
            displayName: userData.displayName || 'Unknown User',
            email: userData.email || '',
            gameweekPoints: pointsResult.totalPoints,
            totalPoints: newTotalPoints,
            gameweek
          }

          userResults.push(userResult)

          // Update user's total points in batch
          const userRef = doc(db, 'users', userId)
          batch.update(userRef, {
            totalPoints: newTotalPoints,
            [`gameweekPoints.gw${gameweek}`]: pointsResult.totalPoints,
            lastUpdated: new Date()
          })

          processedUsers++
        } else {
          console.warn(`No squad found for user ${userId} in gameweek ${gameweek}`)
        }

      } catch (error) {
        console.error(`Error processing user ${userId}:`, error)
      }
    }

    // Commit the batch update
    await batch.commit()

    console.log(`Points updated for ${processedUsers} users`)

    // Now calculate and update rankings
    const rankingResult = await updateOverallRankings(userResults)

    return {
      success: true,
      gameweek,
      processedUsers,
      totalUsers: usersSnapshot.size,
      userResults,
      rankingResult
    }

  } catch (error) {
    console.error('Error calculating all user points:', error)
    return {
      success: false,
      message: error.message,
      error
    }
  }
}

/**
 * Update overall rankings for all users
 * @param {Array} userResults - Array of user results with totalPoints
 * @returns {Promise<Object>} Ranking update results
 */
export async function updateOverallRankings(userResults = null) {
  try {
    let usersToRank = userResults

    // If no userResults provided, fetch all users
    if (!usersToRank) {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      usersToRank = usersSnapshot.docs.map(doc => ({
        userId: doc.id,
        totalPoints: doc.data().totalPoints || 0,
        displayName: doc.data().displayName || 'Unknown User'
      }))
    }

    // Sort users by total points (highest first)
    usersToRank.sort((a, b) => b.totalPoints - a.totalPoints)

    // Update rankings in batches
    const batch = writeBatch(db)
    let rank = 1
    let previousPoints = null
    let actualRank = 1

    for (let i = 0; i < usersToRank.length; i++) {
      const user = usersToRank[i]
      
      // Handle tied rankings
      if (previousPoints !== null && user.totalPoints < previousPoints) {
        rank = i + 1
      }
      
      actualRank = rank
      previousPoints = user.totalPoints

      // Update user's rank
      const userRef = doc(db, 'users', user.userId)
      batch.update(userRef, {
        overallRank: actualRank,
        rankUpdatedAt: new Date()
      })

      // Add rank to user result
      user.overallRank = actualRank
    }

    // Commit batch update
    await batch.commit()

    console.log(`Rankings updated for ${usersToRank.length} users`)

    return {
      success: true,
      totalUsers: usersToRank.length,
      topUsers: usersToRank.slice(0, 10), // Top 10 users
      rankingsUpdated: true
    }

  } catch (error) {
    console.error('Error updating rankings:', error)
    return {
      success: false,
      message: error.message,
      error
    }
  }
}

/**
 * Get leaderboard with top users
 * @param {number} limit - Number of top users to return (default: 50)
 * @returns {Promise<Array>} Array of top users
 */
export async function getLeaderboard(limit = 50) {
  try {
    const usersRef = collection(db, 'users')
    const usersSnapshot = await getDocs(usersRef)
    
    const users = []
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data()
      if (userData.totalPoints !== undefined) {
        users.push({
          userId: doc.id,
          displayName: userData.displayName || 'Unknown User',
          totalPoints: userData.totalPoints || 0,
          overallRank: userData.overallRank || 999999,
          email: userData.email || ''
        })
      }
    })

    // Sort by rank (lowest rank number = highest position)
    users.sort((a, b) => a.overallRank - b.overallRank)

    return users.slice(0, limit)

  } catch (error) {
    console.error('Error getting leaderboard:', error)
    return []
  }
}

/**
 * Get user's rank and surrounding users
 * @param {string} userId - User's UID
 * @param {number} range - Number of users above and below to show (default: 5)
 * @returns {Promise<Object>} User's position and surrounding users
 */
export async function getUserRankPosition(userId, range = 5) {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error('User not found')
    }

    const userData = userDoc.data()
    const userRank = userData.overallRank || 999999
    const userPoints = userData.totalPoints || 0

    // Get all users for context
    const leaderboard = await getLeaderboard(1000) // Get more users for context
    
    // Find user's position in leaderboard
    const userIndex = leaderboard.findIndex(user => user.userId === userId)
    
    if (userIndex === -1) {
      return {
        user: {
          userId,
          displayName: userData.displayName,
          totalPoints: userPoints,
          overallRank: userRank
        },
        surrounding: [],
        position: userRank
      }
    }

    // Get surrounding users
    const start = Math.max(0, userIndex - range)
    const end = Math.min(leaderboard.length, userIndex + range + 1)
    const surrounding = leaderboard.slice(start, end)

    return {
      user: leaderboard[userIndex],
      surrounding,
      position: userIndex + 1,
      totalUsers: leaderboard.length
    }

  } catch (error) {
    console.error('Error getting user rank position:', error)
    return null
  }
}

/**
 * Trigger points calculation for a specific gameweek (admin function)
 * @param {number} gameweek - Gameweek number
 * @returns {Promise<Object>} Calculation results
 */
export async function triggerGameweekCalculation(gameweek) {
  try {
    // Check if gameweek is finished
    const gameweekRef = doc(db, 'gameweeks', `gw${gameweek}`)
    const gameweekDoc = await getDoc(gameweekRef)

    if (!gameweekDoc.exists()) {
      throw new Error('Gameweek not found')
    }

    const gameweekData = gameweekDoc.data()
    
    // Optional: Check if gameweek is marked as finished
    if (!gameweekData.isFinished) {
      console.warn(`Gameweek ${gameweek} is not marked as finished, but proceeding with calculation`)
    }

    // Run the calculation
    const result = await calculateAllUserPoints(gameweek)

    // Mark calculation as completed
    await updateDoc(gameweekRef, {
      pointsCalculated: true,
      pointsCalculatedAt: new Date(),
      calculationResult: {
        processedUsers: result.processedUsers,
        totalUsers: result.totalUsers
      }
    })

    return result

  } catch (error) {
    console.error('Error triggering gameweek calculation:', error)
    return {
      success: false,
      message: error.message,
      error
    }
  }
}
