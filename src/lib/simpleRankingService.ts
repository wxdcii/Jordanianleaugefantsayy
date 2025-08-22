
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  query,
  updateDoc
} from 'firebase/firestore'
import { db } from './firebase'

// Type definitions for squad and player data
export interface SquadData {
  totalPoints?: number;
  startingXI?: PlayerData[];
  bench?: PlayerData[];
  players?: PlayerData[];
  captainId?: string;
  chipsUsed?: {
    tripleCaptain?: { isActive?: boolean };
    benchBoost?: { isActive?: boolean };
  };
  // transferCost?: number; // REMOVED - now stored in transferState.pointsDeductedThisWeek
  transferState?: {
    pointsDeductedThisWeek?: number;
    transfersMadeThisWeek?: number;
    savedFreeTransfers?: number;
  };
}

export interface PlayerData {
  playerId?: string;
  id?: string;
  name?: string;
  position?: string;
  isStarting?: boolean;
  isCaptain?: boolean;
  points?: number | Record<string, number>;
  gameweekPoints?: Record<number, number>;
  stats?: { points?: number };
  totalPoints?: number;
  price?: number;
}

// Simple types for ranking
export interface UserSquadPoints {
  userId: string
  displayName: string
  teamName: string
  gameweekPoints: Record<string, number> // gw1: 45, gw2: 52, etc.
  totalPoints: number
  gameweeksPlayed: number
  averagePoints: number
}

export interface SimpleRanking {
  userId: string
  displayName: string
  teamName: string
  totalPoints: number
  rank: number
  gameweeksPlayed: number
  averagePoints: number
}

export class SimpleRankingService {
  
  /**
   * Get all users who have saved squads and calculate their total points
   */
  static async getAllUsersWithSquads(): Promise<{ success: boolean; users: UserSquadPoints[]; message: string }> {
    try {
      console.log('🔍 Fetching all users with squads...')
      
      // Get all users
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      const usersWithSquads: UserSquadPoints[] = []
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        const userData = userDoc.data()
        
        console.log(`📊 Processing user: ${userId}`)
        
        // Get user's squads subcollection
        const squadsRef = collection(db, 'users', userId, 'squads')
        const squadsSnapshot = await getDocs(squadsRef)
        
        if (squadsSnapshot.empty) {
          console.log(`⚠️ No squads found for user ${userId}`)
          continue
        }
        
        const gameweekPoints: Record<string, number> = {}
        let totalPoints = 0
        
        // Calculate points for each gameweek
        for (const squadDoc of squadsSnapshot.docs) {
          const gameweekId = squadDoc.id // e.g., "gw1", "gw2"
          const squadData = squadDoc.data()
          
          // Calculate points for this gameweek
          const points = await this.calculateSquadPoints(squadData, gameweekId)
          gameweekPoints[gameweekId] = points
          totalPoints += points
          
          console.log(`📈 ${userId} - ${gameweekId}: ${points} points`)
        }
        
        const gameweeksPlayed = Object.keys(gameweekPoints).length
        const averagePoints = gameweeksPlayed > 0 ? totalPoints / gameweeksPlayed : 0
        
        usersWithSquads.push({
          userId,
          displayName: userData.displayName || 'Unknown User',
          teamName: userData.teamName || 'Unknown Team',
          gameweekPoints,
          totalPoints,
          gameweeksPlayed,
          averagePoints: Math.round(averagePoints * 10) / 10
        })
        
        console.log(`✅ ${userId}: ${totalPoints} total points (${gameweeksPlayed} GWs)`)
      }
      
      // Sort by total points (descending)
      usersWithSquads.sort((a, b) => b.totalPoints - a.totalPoints)
      
      console.log(`🏆 Found ${usersWithSquads.length} users with squads`)
      
      return {
        success: true,
        users: usersWithSquads,
        message: `Found ${usersWithSquads.length} users with squads`
      }
    } catch (error) {
      console.error('❌ Error fetching users with squads:', error)
      return {
        success: false,
        users: [],
        message: `Failed to fetch users: ${error}`
      }
    }
  }

  /**
   * Calculate points for a squad in a specific gameweek
   */

  private static async calculateSquadPoints(squadData: SquadData, gameweekId: string, forceRecalculate: boolean = false): Promise<number> {
    try {
      // Skip stored points if force recalculate is requested
      if (!forceRecalculate && squadData.totalPoints !== undefined && squadData.totalPoints !== null) {
        console.log(`📊 Using stored total points for ${gameweekId}: ${squadData.totalPoints}`)
        return squadData.totalPoints
      }

      // If no stored total points, calculate from player data
      let totalPoints = 0

      // Extract gameweek number from gameweekId (e.g., "gw1" -> 1)
      const gameweekNumber = parseInt(gameweekId.replace('gw', ''))

      console.log(`🔍 Calculating points for ${gameweekId} from player data...`)
      console.log(`📋 Squad data structure:`, {
        hasStartingXI: !!squadData.startingXI,
        hasBench: !!squadData.bench,
        hasPlayers: !!squadData.players,
        captainId: squadData.captainId,
        chipsUsed: squadData.chipsUsed
      })

      // Handle different squad data structures
      let startingPlayers: PlayerData[] = [];
      let benchPlayers: PlayerData[] = [];
      const  captainId = squadData.captainId;

      // Check if using startingXI/bench structure
      if (squadData.startingXI && Array.isArray(squadData.startingXI)) {
        startingPlayers = squadData.startingXI
        benchPlayers = squadData.bench || []
      }
      // Check if using players array structure
      else if (squadData.players && Array.isArray(squadData.players)) {
        startingPlayers = squadData.players.filter(p => p.isStarting)
        benchPlayers = squadData.players.filter(p => !p.isStarting)
      }

      console.log(`👥 Found ${startingPlayers.length} starting players, ${benchPlayers.length} bench players`)

      // Calculate starting XI points
      for (const player of startingPlayers) {
        const basePoints = this.getPlayerPoints(player, gameweekNumber)
        let finalPoints = basePoints

        // Apply captain multiplier
        const isCaptain = player.isCaptain || player.playerId === captainId || player.id === captainId
        if (isCaptain) {
          // Check if triple captain is active
          const isTripleCaptain = squadData.chipsUsed?.tripleCaptain?.isActive || false
          finalPoints = basePoints * (isTripleCaptain ? 3 : 2)
          console.log(`👑 Captain ${player.name}: ${basePoints} x ${isTripleCaptain ? 3 : 2} = ${finalPoints}`)
        }

        totalPoints += finalPoints
        console.log(`⚽ ${player.name}: ${finalPoints} points`)
      }

      // Add bench points if Bench Boost is active
      if (squadData.chipsUsed?.benchBoost?.isActive && benchPlayers.length > 0) {
        console.log(`🚀 Bench Boost active - adding bench points`)
        for (const player of benchPlayers) {
          const points = this.getPlayerPoints(player, gameweekNumber)
          totalPoints += points
          console.log(`🪑 Bench ${player.name}: ${points} points`)
        }
      }

      // Subtract transfer cost
      const transferCost = squadData.transferState?.pointsDeductedThisWeek || 0 // Get from transferState
      if (transferCost > 0) {
        totalPoints -= transferCost
        console.log(`💸 Transfer cost: -${transferCost} points`)
      }

      const finalPoints = Math.max(0, totalPoints)
      console.log(`📊 Final calculated points for ${gameweekId}: ${finalPoints}`)

      return finalPoints
    } catch (error) {
      console.error(`❌ Error calculating squad points for ${gameweekId}:`, error)
      return 0
    }
  }

  /**
   * Get player points for a specific gameweek
   */
  private static getPlayerPoints(player: PlayerData, gameweekNumber: number): number {
    // Check if player has points stored for this gameweek in points object
    if (player.points && typeof player.points === 'object') {
      const gwKey = `gw${gameweekNumber}`
      if (player.points[gwKey] !== undefined && player.points[gwKey] !== null) {
        console.log(`📊 Found stored points for ${player.name} GW${gameweekNumber}: ${player.points[gwKey]}`)
        return player.points[gwKey]
      }
    }

    // Check if player has a direct points property (current gameweek)
    if (player.points !== undefined && typeof player.points === 'number') {
      console.log(`📊 Using direct points for ${player.name}: ${player.points}`)
      return player.points
    }

    // Check if player has gameweek-specific points
    if (player.gameweekPoints && player.gameweekPoints[gameweekNumber] !== undefined) {
      return player.gameweekPoints[gameweekNumber]
    }

    // Check if points are stored in player stats
    if (player.stats && player.stats.points !== undefined) {
      return player.stats.points
    }

    // Check if there's a totalPoints field (for current gameweek)
    if (player.totalPoints !== undefined && typeof player.totalPoints === 'number') {
      return player.totalPoints
    }

    // Generate realistic mock points based on position and price
    // This simulates actual player performance
    const basePoints = this.generateMockPoints(player.position || 'MID', player.price || 5.0)
    console.log(`🎲 Generated mock points for ${player.name} (${player.position}): ${basePoints}`)
    return basePoints
  }

  /**
   * Generate mock points based on player position and price
   */
  private static generateMockPoints(position: string, price: number): number {
    // Use a more realistic points system based on actual fantasy football scoring
    const priceMultiplier = Math.min(price / 8, 1.8) // Higher price = better performance

    // Base points by position (more realistic ranges)
    let basePoints = 2 // Everyone gets at least 2 points for playing

    switch (position) {
      case 'GKP':
        // Goalkeepers: 2-8 points (clean sheet bonus, saves)
        basePoints += Math.floor(Math.random() * 6) * priceMultiplier
        break
      case 'DEF':
        // Defenders: 2-12 points (clean sheet, goals are rare but high value)
        basePoints += Math.floor(Math.random() * 8) * priceMultiplier
        if (Math.random() < 0.1) basePoints += 6 // 10% chance of goal
        break
      case 'MID':
        // Midfielders: 2-15 points (assists, goals, key passes)
        basePoints += Math.floor(Math.random() * 10) * priceMultiplier
        if (Math.random() < 0.15) basePoints += 5 // 15% chance of goal/assist
        break
      case 'FWD':
        // Forwards: 2-18 points (goals are main source)
        basePoints += Math.floor(Math.random() * 8) * priceMultiplier
        if (Math.random() < 0.25) basePoints += 6 // 25% chance of goal
        if (Math.random() < 0.1) basePoints += 6 // 10% chance of second goal
        break
      default:
        basePoints += Math.floor(Math.random() * 6)
    }

    return Math.floor(Math.max(2, basePoints)) // Minimum 2 points
  }

  /**
   * Generate simple rankings from users with squads
   */
  static async generateSimpleRankings(): Promise<{ success: boolean; rankings: SimpleRanking[]; message: string }> {
    try {
      console.log('🏆 Generating simple rankings...')
      
      const usersResult = await this.getAllUsersWithSquads()
      
      if (!usersResult.success) {
        return {
          success: false,
          rankings: [],
          message: usersResult.message
        }
      }
      
      // Convert to rankings with rank assignment
      const rankings: SimpleRanking[] = []
      let currentRank = 1
      
      for (let i = 0; i < usersResult.users.length; i++) {
        const user = usersResult.users[i]
        
        // Assign rank (handle ties)
        if (i > 0 && user.totalPoints < usersResult.users[i - 1].totalPoints) {
          currentRank = i + 1
        }
        
        rankings.push({
          userId: user.userId,
          displayName: user.displayName,
          teamName: user.teamName,
          totalPoints: user.totalPoints,
          rank: currentRank,
          gameweeksPlayed: user.gameweeksPlayed,
          averagePoints: user.averagePoints
        })
      }
      
      console.log(`✅ Generated rankings for ${rankings.length} users`)
      
      return {
        success: true,
        rankings,
        message: `Generated rankings for ${rankings.length} users`
      }
    } catch (error) {
      console.error('❌ Error generating simple rankings:', error)
      return {
        success: false,
        rankings: [],
        message: `Failed to generate rankings: ${error}`
      }
    }
  }

  /**
   * Update user documents with calculated total points and ranks
   */
  static async updateUserRankings(): Promise<{ success: boolean; updated: number; message: string }> {
    try {
      console.log('💾 Updating user rankings in database...')
      
      const rankingsResult = await this.generateSimpleRankings()
      
      if (!rankingsResult.success) {
        return {
          success: false,
          updated: 0,
          message: rankingsResult.message
        }
      }
      
      let updated = 0
      
      // Update each user document
      for (const ranking of rankingsResult.rankings) {
        try {
          const userRef = doc(db, 'users', ranking.userId)
          await updateDoc(userRef, {
            totalPoints: ranking.totalPoints,
            rank: ranking.rank,
            gameweeksPlayed: ranking.gameweeksPlayed,
            averagePoints: ranking.averagePoints,
            lastRankingUpdate: new Date()
          })
          updated++
        } catch (error) {
          console.error(`Failed to update user ${ranking.userId}:`, error)
        }
      }
      
      console.log(`✅ Updated ${updated} user rankings`)
      
      return {
        success: true,
        updated,
        message: `Updated ${updated} user rankings`
      }
    } catch (error) {
      console.error('❌ Error updating user rankings:', error)
      return {
        success: false,
        updated: 0,
        message: `Failed to update rankings: ${error}`
      }
    }
  }

  /**
   * Get user's current ranking
   */
  static async getUserRanking(userId: string): Promise<{ success: boolean; ranking: SimpleRanking | null; message: string }> {
    try {
      const rankingsResult = await this.generateSimpleRankings()
      
      if (!rankingsResult.success) {
        return {
          success: false,
          ranking: null,
          message: rankingsResult.message
        }
      }
      
      const userRanking = rankingsResult.rankings.find(r => r.userId === userId)
      
      if (userRanking) {
        return {
          success: true,
          ranking: userRanking,
          message: 'User ranking found'
        }
      } else {
        return {
          success: false,
          ranking: null,
          message: 'User not found in rankings'
        }
      }
    } catch (error) {
      console.error('❌ Error getting user ranking:', error)
      return {
        success: false,
        ranking: null,
        message: `Failed to get user ranking: ${error}`
      }
    }
  }
}
