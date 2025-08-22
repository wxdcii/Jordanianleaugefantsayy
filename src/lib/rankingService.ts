import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  writeBatch,
  query,
  orderBy,
  limit,
  getDoc
} from 'firebase/firestore'
import { db } from './firebase'
import { GameweekPointsService } from './gameweekPointsService'

// Types for ranking system
export interface UserRankingData {
  userId: string
  displayName: string
  teamName: string
  totalPoints: number
  rank: number
  lastUpdated: Date
}

export interface LeaderboardEntry {
  userId: string
  displayName: string
  teamName: string
  totalPoints: number
  rank: number
  gameweeksPlayed: number
  averagePoints: number
}

export class RankingService {
  
  /**
   * Calculate total points for all users and assign ranks
   */
  static async calculateAndUpdateAllRankings(): Promise<{ success: boolean; message: string; usersUpdated: number }> {
    try {
      console.log('🏆 Starting ranking calculation for all users...')
      
      // Get all users
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      const userRankings: UserRankingData[] = []
      
      // Calculate total points for each user
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        const userData = userDoc.data()
        
        // Get all gameweek points for this user
        const pointsResult = await GameweekPointsService.getAllUserGameweekPoints(userId)
        
        if (pointsResult.success) {
          userRankings.push({
            userId,
            displayName: userData.displayName || 'Unknown User',
            teamName: userData.teamName || 'Unknown Team',
            totalPoints: pointsResult.totalPoints,
            rank: 0, // Will be assigned after sorting
            lastUpdated: new Date()
          })
        }
      }
      
      // Sort users by total points (descending)
      userRankings.sort((a, b) => b.totalPoints - a.totalPoints)
      
      // Assign ranks (handle ties by giving same rank)
      let currentRank = 1
      for (let i = 0; i < userRankings.length; i++) {
        if (i > 0 && userRankings[i].totalPoints < userRankings[i - 1].totalPoints) {
          currentRank = i + 1
        }
        userRankings[i].rank = currentRank
      }
      
      // Update all user documents with new rankings
      const batch = writeBatch(db)
      
      userRankings.forEach((userRanking) => {
        const userRef = doc(db, 'users', userRanking.userId)
        batch.update(userRef, {
          totalPoints: userRanking.totalPoints,
          rank: userRanking.rank,
          lastRankingUpdate: new Date()
        })
      })
      
      await batch.commit()
      
      console.log(`✅ Updated rankings for ${userRankings.length} users`)
      console.log('🏆 Top 5 users:', userRankings.slice(0, 5))
      
      return {
        success: true,
        message: `Rankings updated for ${userRankings.length} users`,
        usersUpdated: userRankings.length
      }
    } catch (error) {
      console.error('❌ Error calculating rankings:', error)
      return {
        success: false,
        message: `Failed to calculate rankings: ${error}`,
        usersUpdated: 0
      }
    }
  }

  /**
   * Get current user ranking and stats
   */
  static async getUserRanking(userId: string): Promise<{ 
    success: boolean
    data: UserRankingData | null
    gameweeksPlayed: number
    averagePoints: number
    message: string 
  }> {
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        return {
          success: false,
          data: null,
          gameweeksPlayed: 0,
          averagePoints: 0,
          message: 'User not found'
        }
      }
      
      const userData = userDoc.data()
      
      // Get gameweek stats
      const pointsResult = await GameweekPointsService.getAllUserGameweekPoints(userId)
      const gameweeksPlayed = pointsResult.data.length
      const averagePoints = gameweeksPlayed > 0 ? pointsResult.totalPoints / gameweeksPlayed : 0
      
      const userRanking: UserRankingData = {
        userId,
        displayName: userData.displayName || 'Unknown User',
        teamName: userData.teamName || 'Unknown Team',
        totalPoints: userData.totalPoints || 0,
        rank: userData.rank || 0,
        lastUpdated: userData.lastRankingUpdate?.toDate() || new Date()
      }
      
      return {
        success: true,
        data: userRanking,
        gameweeksPlayed,
        averagePoints: Math.round(averagePoints * 10) / 10, // Round to 1 decimal
        message: 'User ranking retrieved successfully'
      }
    } catch (error) {
      console.error('❌ Error getting user ranking:', error)
      return {
        success: false,
        data: null,
        gameweeksPlayed: 0,
        averagePoints: 0,
        message: `Failed to get user ranking: ${error}`
      }
    }
  }

  /**
   * Get top N users for leaderboard
   */
  static async getTopUsers(limitCount: number = 100): Promise<{ 
    success: boolean
    data: LeaderboardEntry[]
    message: string 
  }> {
    try {
      const usersRef = collection(db, 'users')
      // Simplified query - only order by totalPoints to avoid composite index requirement
      const usersQuery = query(
        usersRef, 
        orderBy('totalPoints', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(usersQuery)
      const topUsers: LeaderboardEntry[] = []
      
      for (const userDoc of querySnapshot.docs) {
        const userData = userDoc.data()
        const userId = userDoc.id
        
        // Only include users with points (active users)
        if (userData.totalPoints > 0) {
          // Get gameweek stats for additional info
          const pointsResult = await GameweekPointsService.getAllUserGameweekPoints(userId)
          const gameweeksPlayed = pointsResult.data.length
          const averagePoints = gameweeksPlayed > 0 ? userData.totalPoints / gameweeksPlayed : 0
          
          topUsers.push({
            userId,
            displayName: userData.displayName || 'Unknown User',
            teamName: userData.teamName || 'Unknown Team',
            totalPoints: userData.totalPoints || 0,
            rank: userData.rank || 0,
            gameweeksPlayed,
            averagePoints: Math.round(averagePoints * 10) / 10
          })
        }
      }
      
      // Sort by total points (descending) and assign correct ranks
      topUsers.sort((a, b) => b.totalPoints - a.totalPoints)
      topUsers.forEach((user, index) => {
        user.rank = index + 1
      })
      
      return {
        success: true,
        data: topUsers,
        message: `Retrieved top ${topUsers.length} users`
      }
    } catch (error) {
      console.error('❌ Error getting top users:', error)
      return {
        success: false,
        data: [],
        message: `Failed to get top users: ${error}`
      }
    }
  }

  /**
   * Get users around a specific rank (for showing context)
   */
  static async getUsersAroundRank(
    targetRank: number, 
    range: number = 5
  ): Promise<{ success: boolean; data: LeaderboardEntry[]; message: string }> {
    try {
      // Get all users sorted by rank
      const usersRef = collection(db, 'users')
      const usersQuery = query(usersRef, orderBy('rank', 'asc'))
      const querySnapshot = await getDocs(usersQuery)
      
      const allUsers: LeaderboardEntry[] = []
      
      for (const userDoc of querySnapshot.docs) {
        const userData = userDoc.data()
        const userId = userDoc.id
        
        if (userData.rank) {
          const pointsResult = await GameweekPointsService.getAllUserGameweekPoints(userId)
          const gameweeksPlayed = pointsResult.data.length
          const averagePoints = gameweeksPlayed > 0 ? userData.totalPoints / gameweeksPlayed : 0
          
          allUsers.push({
            userId,
            displayName: userData.displayName || 'Unknown User',
            teamName: userData.teamName || 'Unknown Team',
            totalPoints: userData.totalPoints || 0,
            rank: userData.rank,
            gameweeksPlayed,
            averagePoints: Math.round(averagePoints * 10) / 10
          })
        }
      }
      
      // Find users around the target rank
      const startRank = Math.max(1, targetRank - range)
      const endRank = targetRank + range
      
      const usersInRange = allUsers.filter(user => 
        user.rank >= startRank && user.rank <= endRank
      )
      
      return {
        success: true,
        data: usersInRange,
        message: `Retrieved ${usersInRange.length} users around rank ${targetRank}`
      }
    } catch (error) {
      console.error('❌ Error getting users around rank:', error)
      return {
        success: false,
        data: [],
        message: `Failed to get users around rank: ${error}`
      }
    }
  }

  /**
   * Update a single user's total points and recalculate their rank
   */
  static async updateSingleUserRanking(userId: string): Promise<{ 
    success: boolean
    newRank: number
    totalPoints: number
    message: string 
  }> {
    try {
      // Update user's total points
      const pointsResult = await GameweekPointsService.updateUserTotalPoints(userId)
      
      if (!pointsResult.success) {
        return {
          success: false,
          newRank: 0,
          totalPoints: 0,
          message: pointsResult.message
        }
      }
      
      // Recalculate all rankings to get accurate rank
      const rankingResult = await this.calculateAndUpdateAllRankings()
      
      if (!rankingResult.success) {
        return {
          success: false,
          newRank: 0,
          totalPoints: pointsResult.totalPoints,
          message: rankingResult.message
        }
      }
      
      // Get updated user ranking
      const userRankingResult = await this.getUserRanking(userId)
      
      return {
        success: true,
        newRank: userRankingResult.data?.rank || 0,
        totalPoints: pointsResult.totalPoints,
        message: `User ranking updated: Rank ${userRankingResult.data?.rank}, ${pointsResult.totalPoints} points`
      }
    } catch (error) {
      console.error('❌ Error updating single user ranking:', error)
      return {
        success: false,
        newRank: 0,
        totalPoints: 0,
        message: `Failed to update user ranking: ${error}`
      }
    }
  }
}
