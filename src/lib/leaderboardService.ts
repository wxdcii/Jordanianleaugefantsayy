import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore'
import { db } from './firebase'
import { RankingService, LeaderboardEntry } from './rankingService'

// Types for leaderboard system
export interface GameweekLeaderboard {
  gameweekNumber: number
  topUsers: LeaderboardEntry[]
  totalUsers: number
  lastUpdated: Date
  averagePoints: number
  highestPoints: number
}

export interface OverallLeaderboard {
  season: string // e.g., "2024-25"
  topUsers: LeaderboardEntry[]
  totalUsers: number
  lastUpdated: Date
  gameweeksCompleted: number
}

export class LeaderboardService {
  
  /**
   * Generate and save overall leaderboard
   */
  static async generateOverallLeaderboard(
    season: string = "2024-25",
    topCount: number = 100
  ): Promise<{ success: boolean; message: string; leaderboard: OverallLeaderboard | null }> {
    try {
      console.log(`🏆 Generating overall leaderboard for season ${season}...`)
      
      // Get top users
      const topUsersResult = await RankingService.getTopUsers(topCount)
      
      if (!topUsersResult.success) {
        return {
          success: false,
          message: topUsersResult.message,
          leaderboard: null
        }
      }
      
      // Calculate stats
      const totalUsers = topUsersResult.data.length
      const gameweeksCompleted = Math.max(...topUsersResult.data.map(u => u.gameweeksPlayed), 0)
      
      const leaderboard: OverallLeaderboard = {
        season,
        topUsers: topUsersResult.data,
        totalUsers,
        lastUpdated: new Date(),
        gameweeksCompleted
      }
      
      // Save to Firebase
      const leaderboardRef = doc(db, 'leaderboards', `overall-${season}`)
      await setDoc(leaderboardRef, leaderboard)
      
      console.log(`✅ Overall leaderboard saved with ${totalUsers} users`)
      
      return {
        success: true,
        message: `Overall leaderboard generated with ${totalUsers} users`,
        leaderboard
      }
    } catch (error) {
      console.error('❌ Error generating overall leaderboard:', error)
      return {
        success: false,
        message: `Failed to generate overall leaderboard: ${error}`,
        leaderboard: null
      }
    }
  }

  /**
   * Generate and save gameweek-specific leaderboard
   */
  static async generateGameweekLeaderboard(
    gameweekNumber: number,
    topCount: number = 100
  ): Promise<{ success: boolean; message: string; leaderboard: GameweekLeaderboard | null }> {
    try {
      console.log(`🏆 Generating GW${gameweekNumber} leaderboard...`)
      
      // Get all users and their gameweek points
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      const gameweekUsers: LeaderboardEntry[] = []
      let totalPoints = 0
      let highestPoints = 0
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data()
        const userId = userDoc.id
        
        // Get specific gameweek points
        const gwPointsRef = doc(db, 'users', userId, 'GameweekPoints', `gw${gameweekNumber}`)
        const gwPointsDoc = await getDoc(gwPointsRef)
        
        if (gwPointsDoc.exists()) {
          const gwData = gwPointsDoc.data()
          const points = gwData.points || 0
          
          gameweekUsers.push({
            userId,
            displayName: userData.displayName || 'Unknown User',
            teamName: userData.teamName || 'Unknown Team',
            totalPoints: points, // For gameweek leaderboard, this is just the GW points
            rank: 0, // Will be assigned after sorting
            gameweeksPlayed: 1,
            averagePoints: points
          })
          
          totalPoints += points
          highestPoints = Math.max(highestPoints, points)
        }
      }
      
      // Sort by gameweek points (descending)
      gameweekUsers.sort((a, b) => b.totalPoints - a.totalPoints)
      
      // Assign ranks
      let currentRank = 1
      for (let i = 0; i < gameweekUsers.length; i++) {
        if (i > 0 && gameweekUsers[i].totalPoints < gameweekUsers[i - 1].totalPoints) {
          currentRank = i + 1
        }
        gameweekUsers[i].rank = currentRank
      }
      
      // Take top users
      const topUsers = gameweekUsers.slice(0, topCount)
      const averagePoints = gameweekUsers.length > 0 ? totalPoints / gameweekUsers.length : 0
      
      const leaderboard: GameweekLeaderboard = {
        gameweekNumber,
        topUsers,
        totalUsers: gameweekUsers.length,
        lastUpdated: new Date(),
        averagePoints: Math.round(averagePoints * 10) / 10,
        highestPoints
      }
      
      // Save to Firebase
      const leaderboardRef = doc(db, 'leaderboards', `gw${gameweekNumber}`)
      await setDoc(leaderboardRef, leaderboard)
      
      console.log(`✅ GW${gameweekNumber} leaderboard saved with ${topUsers.length} users`)
      
      return {
        success: true,
        message: `GW${gameweekNumber} leaderboard generated with ${topUsers.length} users`,
        leaderboard
      }
    } catch (error) {
      console.error(`❌ Error generating GW${gameweekNumber} leaderboard:`, error)
      return {
        success: false,
        message: `Failed to generate GW${gameweekNumber} leaderboard: ${error}`,
        leaderboard: null
      }
    }
  }

  /**
   * Get overall leaderboard
   */
  static async getOverallLeaderboard(
    season: string = "2024-25"
  ): Promise<{ success: boolean; data: OverallLeaderboard | null; message: string }> {
    try {
      const leaderboardRef = doc(db, 'leaderboards', `overall-${season}`)
      const leaderboardDoc = await getDoc(leaderboardRef)
      
      if (leaderboardDoc.exists()) {
        const data = leaderboardDoc.data() as OverallLeaderboard
        return {
          success: true,
          data,
          message: 'Overall leaderboard retrieved successfully'
        }
      } else {
        return {
          success: false,
          data: null,
          message: 'Overall leaderboard not found'
        }
      }
    } catch (error) {
      console.error('❌ Error getting overall leaderboard:', error)
      return {
        success: false,
        data: null,
        message: `Failed to get overall leaderboard: ${error}`
      }
    }
  }

  /**
   * Get gameweek leaderboard
   */
  static async getGameweekLeaderboard(
    gameweekNumber: number
  ): Promise<{ success: boolean; data: GameweekLeaderboard | null; message: string }> {
    try {
      const leaderboardRef = doc(db, 'leaderboards', `gw${gameweekNumber}`)
      const leaderboardDoc = await getDoc(leaderboardRef)
      
      if (leaderboardDoc.exists()) {
        const data = leaderboardDoc.data() as GameweekLeaderboard
        return {
          success: true,
          data,
          message: `GW${gameweekNumber} leaderboard retrieved successfully`
        }
      } else {
        return {
          success: false,
          data: null,
          message: `GW${gameweekNumber} leaderboard not found`
        }
      }
    } catch (error) {
      console.error(`❌ Error getting GW${gameweekNumber} leaderboard:`, error)
      return {
        success: false,
        data: null,
        message: `Failed to get GW${gameweekNumber} leaderboard: ${error}`
      }
    }
  }

  /**
   * Get user's position in a specific gameweek leaderboard
   */
  static async getUserGameweekPosition(
    userId: string,
    gameweekNumber: number
  ): Promise<{ success: boolean; rank: number; points: number; totalUsers: number; message: string }> {
    try {
      const leaderboardResult = await this.getGameweekLeaderboard(gameweekNumber)
      
      if (!leaderboardResult.success || !leaderboardResult.data) {
        return {
          success: false,
          rank: 0,
          points: 0,
          totalUsers: 0,
          message: leaderboardResult.message
        }
      }
      
      const userEntry = leaderboardResult.data.topUsers.find(user => user.userId === userId)
      
      if (userEntry) {
        return {
          success: true,
          rank: userEntry.rank,
          points: userEntry.totalPoints,
          totalUsers: leaderboardResult.data.totalUsers,
          message: `User found at rank ${userEntry.rank}`
        }
      } else {
        return {
          success: false,
          rank: 0,
          points: 0,
          totalUsers: leaderboardResult.data.totalUsers,
          message: 'User not found in top users for this gameweek'
        }
      }
    } catch (error) {
      console.error('❌ Error getting user gameweek position:', error)
      return {
        success: false,
        rank: 0,
        points: 0,
        totalUsers: 0,
        message: `Failed to get user gameweek position: ${error}`
      }
    }
  }

  /**
   * Generate all leaderboards (overall + all gameweeks)
   */
  static async generateAllLeaderboards(
    maxGameweek: number = 27,
    season: string = "2024-25"
  ): Promise<{ success: boolean; message: string; generated: string[] }> {
    try {
      console.log('🏆 Generating all leaderboards...')
      
      const generated: string[] = []
      
      // Generate overall leaderboard
      const overallResult = await this.generateOverallLeaderboard(season)
      if (overallResult.success) {
        generated.push(`overall-${season}`)
      }
      
      // Generate gameweek leaderboards
      for (let gw = 1; gw <= maxGameweek; gw++) {
        const gwResult = await this.generateGameweekLeaderboard(gw)
        if (gwResult.success) {
          generated.push(`gw${gw}`)
        }
      }
      
      console.log(`✅ Generated ${generated.length} leaderboards`)
      
      return {
        success: true,
        message: `Generated ${generated.length} leaderboards`,
        generated
      }
    } catch (error) {
      console.error('❌ Error generating all leaderboards:', error)
      return {
        success: false,
        message: `Failed to generate all leaderboards: ${error}`,
        generated: []
      }
    }
  }
}
