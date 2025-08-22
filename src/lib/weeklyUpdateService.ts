import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where
} from 'firebase/firestore'
import { db } from './firebase'
import { GameweekPointsService, GameweekPointsData } from './gameweekPointsService'
import { RankingService } from './rankingService'
import { LeaderboardService } from './leaderboardService'

// Types for weekly update
export interface SquadPlayer {
  id: string;
  name?: string; 
  position?: 'GKP' | 'DEF' | 'MID' | 'FWD';
  club?: string;
  price?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isStarting?: boolean;
  benchPosition?: number | null;
  points?: number;
}

export interface ChipsUsed {
  wildcard?: { used: boolean; gameweek: number | null; isActive: boolean };
  freeHit?: { used: boolean; gameweek: number | null; isActive: boolean };
  benchBoost?: { used: boolean; gameweek: number | null; isActive: boolean };
  tripleCaptain?: { used: boolean; gameweek: number | null; isActive: boolean };
}

export interface TransferState {
  savedFreeTransfers?: number;
  transfersMadeThisWeek?: number;
  pointsDeductedThisWeek?: number;
  lastGameweekProcessed?: number;
  wildcardActive?: boolean;
  freeHitActive?: boolean;
}

export interface UserSquadData {
  userId: string;
  formation: string;
  startingXI: SquadPlayer[];
  bench: SquadPlayer[];
  captain: string | null;
  viceCaptain: string | null;
  chipsUsed: ChipsUsed;
  transferState: TransferState;
  isValid: boolean;
  lastUpdated: Date;
}

export interface GameweekResults {
  gameweekNumber: number
  usersProcessed: number
  pointsCalculated: number
  rankingsUpdated: boolean
  leaderboardGenerated: boolean
  errors: string[]
}

export class WeeklyUpdateService {
  
  /**
   * Process gameweek results for all users
   * This should be called after a gameweek deadline has passed
   */
  static async processGameweekResults(
    gameweekNumber: number,
    playerPoints: Record<string, number> = {} // playerId -> points mapping
  ): Promise<GameweekResults> {
    console.log(`🏁 Processing GW${gameweekNumber} results...`)
    
    const results: GameweekResults = {
      gameweekNumber,
      usersProcessed: 0,
      pointsCalculated: 0,
      rankingsUpdated: false,
      leaderboardGenerated: false,
      errors: []
    }

    try {
      // Get all users
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      console.log(`📊 Found ${usersSnapshot.docs.length} users to process`)

      // Process each user's squad for this gameweek
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        const userData = userDoc.data()
        
        try {
          // Get user's squad for this gameweek (or last saved squad)
          const squadData = await this.getUserSquadForGameweek(userId, gameweekNumber)
          
          if (squadData) {
            // Calculate points for this squad
            const pointsData = await this.calculateGameweekPoints(
              squadData, 
              gameweekNumber, 
              playerPoints
            )
            
            // Save gameweek points
            const saveResult = await GameweekPointsService.saveGameweekPoints(
              userId, 
              gameweekNumber, 
              pointsData
            )
            
            if (saveResult.success) {
              results.usersProcessed++
              results.pointsCalculated += pointsData.points
              console.log(`✅ Processed user ${userId}: ${pointsData.points} points`)
            } else {
              results.errors.push(`Failed to save points for user ${userId}: ${saveResult.message}`)
            }
          } else {
            // User didn't save a squad - use previous gameweek or default
            const previousSquad = await this.getLastSavedSquad(userId, gameweekNumber - 1)
            
            if (previousSquad) {
              console.log(`📋 Using previous squad for user ${userId} in GW${gameweekNumber}`)
              
              const pointsData = await this.calculateGameweekPoints(
                previousSquad, 
                gameweekNumber, 
                playerPoints
              )
              
              // Save with note that it's from previous gameweek
              pointsData.transfersMade = 0 // No transfers if using previous squad
              pointsData.transferCost = 0
              
              const saveResult = await GameweekPointsService.saveGameweekPoints(
                userId, 
                gameweekNumber, 
                pointsData
              )
              
              if (saveResult.success) {
                results.usersProcessed++
                results.pointsCalculated += pointsData.points
                console.log(`✅ Processed user ${userId} (previous squad): ${pointsData.points} points`)
              }
            } else {
              results.errors.push(`No squad found for user ${userId} in GW${gameweekNumber}`)
            }
          }
        } catch (error) {
          results.errors.push(`Error processing user ${userId}: ${error}`)
          console.error(`❌ Error processing user ${userId}:`, error)
        }
      }

      // Update all rankings
      console.log('🏆 Updating rankings...')
      const rankingResult = await RankingService.calculateAndUpdateAllRankings()
      results.rankingsUpdated = rankingResult.success
      
      if (!rankingResult.success) {
        results.errors.push(`Failed to update rankings: ${rankingResult.message}`)
      }

      // Generate leaderboards
      console.log('📊 Generating leaderboards...')
      const leaderboardResult = await LeaderboardService.generateGameweekLeaderboard(gameweekNumber)
      const overallLeaderboardResult = await LeaderboardService.generateOverallLeaderboard()
      
      results.leaderboardGenerated = leaderboardResult.success && overallLeaderboardResult.success
      
      if (!leaderboardResult.success) {
        results.errors.push(`Failed to generate GW${gameweekNumber} leaderboard: ${leaderboardResult.message}`)
      }
      
      if (!overallLeaderboardResult.success) {
        results.errors.push(`Failed to generate overall leaderboard: ${overallLeaderboardResult.message}`)
      }

      console.log(`✅ GW${gameweekNumber} processing complete:`, results)
      return results

    } catch (error) {
      console.error(`❌ Error processing GW${gameweekNumber} results:`, error)
      results.errors.push(`Fatal error: ${error}`)
      return results
    }
  }

  /**
   * Get user's squad for a specific gameweek
   */
  private static async getUserSquadForGameweek(
    userId: string, 
    gameweekNumber: number
  ): Promise<UserSquadData | null> {
    try {
      const gwId = `gw${gameweekNumber}`
      const squadRef = doc(db, 'users', userId, 'squads', gwId)
      const squadDoc = await getDoc(squadRef)
      
      if (squadDoc.exists()) {
        const data = squadDoc.data()
        return {
          userId,
          formation: data.formation || '4-3-3',
          startingXI: data.startingXI || [],
          bench: data.bench || [],
          captain: data.captainId || null,
          viceCaptain: data.viceCaptainId || null,
          chipsUsed: data.chipsUsed || {},
          transferState: data.transferState || {},
          isValid: data.isValid || false,
          lastUpdated: data.lastUpdated?.toDate() || new Date()
        }
      }
      
      return null
    } catch (error) {
      console.error(`Error getting squad for user ${userId}, GW${gameweekNumber}:`, error)
      return null
    }
  }

  /**
   * Get user's last saved squad (for when they don't save in current GW)
   */
  private static async getLastSavedSquad(
    userId: string, 
    maxGameweek: number
  ): Promise<UserSquadData | null> {
    try {
      // Try to find the most recent saved squad
      for (let gw = maxGameweek; gw >= 1; gw--) {
        const squad = await this.getUserSquadForGameweek(userId, gw)
        if (squad) {
          return squad
        }
      }
      return null
    } catch (error) {
      console.error(`Error getting last saved squad for user ${userId}:`, error)
      return null
    }
  }

  /**
   * Calculate points for a squad in a specific gameweek
   */
  private static async calculateGameweekPoints(
    squadData: UserSquadData,
    gameweekNumber: number,
    playerPoints: Record<string, number>
  ): Promise<GameweekPointsData> {
    try {
      let totalPoints = 0
      let benchPoints = 0
      
      // Calculate starting XI points
      squadData.startingXI.forEach(player => {
        const basePoints = playerPoints[player.id] || 0
        let finalPoints = basePoints
        
        // Apply captain multiplier
        if (player.id === squadData.captain) {
          const isTripleCaptain = squadData.chipsUsed?.tripleCaptain?.isActive || false
          finalPoints = basePoints * (isTripleCaptain ? 3 : 2)
        }
        
        totalPoints += finalPoints
      })
      
      // Calculate bench points
      squadData.bench.forEach(player => {
        const points = playerPoints[player.id] || 0
        benchPoints += points
      })
      
      // Add bench points if Bench Boost is active
      if (squadData.chipsUsed?.benchBoost?.isActive) {
        totalPoints += benchPoints
      }
      
      // Subtract transfer cost
      const transferCost = squadData.transferState?.pointsDeductedThisWeek || 0
      totalPoints -= transferCost
      
      return {
        points: Math.max(0, totalPoints), // Ensure non-negative
        benchPoints,
        captain: squadData.captain,
        viceCaptain: squadData.viceCaptain,
        chipUsed: this.getActiveChip(squadData.chipsUsed),
        transfersMade: squadData.transferState?.transfersMadeThisWeek || 0,
        transferCost,
        formation: squadData.formation,
        playersCount: squadData.startingXI.length + squadData.bench.length,
        isValid: squadData.isValid,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Error calculating gameweek points:', error)
      
      // Return default/safe values on error
      return {
        points: 0,
        benchPoints: 0,
        captain: null,
        viceCaptain: null,
        chipUsed: null,
        transfersMade: 0,
        transferCost: 0,
        formation: '4-3-3',
        playersCount: 15,
        isValid: false,
        lastUpdated: new Date()
      }
    }
  }

  /**
   * Get the active chip name from chips used object
   */
  private static getActiveChip(chipsUsed: ChipsUsed): string | null {
    if (!chipsUsed) return null
    
    if (chipsUsed.tripleCaptain?.isActive) return 'Triple Captain'
    if (chipsUsed.benchBoost?.isActive) return 'Bench Boost'
    if (chipsUsed.wildcard?.isActive) return 'Wildcard'
    if (chipsUsed.freeHit?.isActive) return 'Free Hit'
    
    return null
  }

  /**
   * Trigger weekly update for a specific gameweek
   * This is the main function to call after gameweek deadline
   */
  static async triggerWeeklyUpdate(
    gameweekNumber: number,
    playerPointsData?: Record<string, number>
  ): Promise<GameweekResults> {
    console.log(`🚀 Triggering weekly update for GW${gameweekNumber}`)
    
    // Use mock player points if not provided (for testing)
    const playerPoints = playerPointsData || this.generateMockPlayerPoints()
    
    return await this.processGameweekResults(gameweekNumber, playerPoints)
  }

  /**
   * Generate mock player points for testing
   */
  private static generateMockPlayerPoints(): Record<string, number> {
    const mockPoints: Record<string, number> = {}
    
    // Generate random points for testing (2-15 points per player)
    for (let i = 1; i <= 100; i++) {
      const playerId = `player${i}`
      mockPoints[playerId] = Math.floor(Math.random() * 14) + 2 // 2-15 points
    }
    
    return mockPoints
  }
}
