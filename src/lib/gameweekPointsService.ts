import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy,
  where,
  writeBatch
} from 'firebase/firestore'
import { db } from './firebase'

// Types for GameweekPoints
export interface GameweekPointsData {
  points: number
  benchPoints: number
  captain: string | null
  viceCaptain: string | null
  chipUsed: string | null
  transfersMade: number
  transferCost: number
  formation: string
  playersCount: number
  isValid: boolean
  lastUpdated: Date
}

export interface UserGameweekPoints extends GameweekPointsData {
  userId: string
  gameweekNumber: number
  gwId: string // e.g., "gw1", "gw2"
}

export class GameweekPointsService {
  
  /**
   * Save or update gameweek points for a user
   */
  static async saveGameweekPoints(
    userId: string, 
    gameweekNumber: number, 
    pointsData: GameweekPointsData
  ): Promise<{ success: boolean; message: string }> {
    try {
      const gwId = `gw${gameweekNumber}`
      const gameweekPointsRef = doc(db, 'users', userId, 'GameweekPoints', gwId)
      
      const dataToSave = {
        ...pointsData,
        gameweekNumber,
        gwId,
        lastUpdated: new Date()
      }

      await setDoc(gameweekPointsRef, dataToSave, { merge: true })
      
      console.log(`✅ Saved gameweek points for user ${userId}, GW${gameweekNumber}:`, dataToSave)
      
      return {
        success: true,
        message: `Gameweek ${gameweekNumber} points saved successfully`
      }
    } catch (error) {
      console.error('❌ Error saving gameweek points:', error)
      return {
        success: false,
        message: `Failed to save gameweek points: ${error}`
      }
    }
  }

  /**
   * Get gameweek points for a specific user and gameweek
   */
  static async getGameweekPoints(
    userId: string, 
    gameweekNumber: number
  ): Promise<{ success: boolean; data: UserGameweekPoints | null; message: string }> {
    try {
      const gwId = `gw${gameweekNumber}`
      const gameweekPointsRef = doc(db, 'users', userId, 'GameweekPoints', gwId)
      const docSnap = await getDoc(gameweekPointsRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserGameweekPoints
        return {
          success: true,
          data: { ...data, userId },
          message: 'Gameweek points retrieved successfully'
        }
      } else {
        return {
          success: false,
          data: null,
          message: `No points data found for GW${gameweekNumber}`
        }
      }
    } catch (error) {
      console.error('❌ Error getting gameweek points:', error)
      return {
        success: false,
        data: null,
        message: `Failed to get gameweek points: ${error}`
      }
    }
  }

  /**
   * Get all gameweek points for a user (for calculating total)
   */
  static async getAllUserGameweekPoints(
    userId: string
  ): Promise<{ success: boolean; data: UserGameweekPoints[]; totalPoints: number; message: string }> {
    try {
      const gameweekPointsRef = collection(db, 'users', userId, 'GameweekPoints')
      const querySnapshot = await getDocs(query(gameweekPointsRef, orderBy('gameweekNumber', 'asc')))
      
      const gameweekPoints: UserGameweekPoints[] = []
      let totalPoints = 0
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as UserGameweekPoints
        gameweekPoints.push({ ...data, userId })
        totalPoints += data.points || 0
      })
      
      return {
        success: true,
        data: gameweekPoints,
        totalPoints,
        message: `Retrieved ${gameweekPoints.length} gameweek records`
      }
    } catch (error) {
      console.error('❌ Error getting all user gameweek points:', error)
      return {
        success: false,
        data: [],
        totalPoints: 0,
        message: `Failed to get user gameweek points: ${error}`
      }
    }
  }

  /**
   * Calculate and update user's total points
   */
  static async updateUserTotalPoints(userId: string): Promise<{ success: boolean; totalPoints: number; message: string }> {
    try {
      const result = await this.getAllUserGameweekPoints(userId)
      
      if (!result.success) {
        return {
          success: false,
          totalPoints: 0,
          message: result.message
        }
      }

      const totalPoints = result.totalPoints
      
      // Update user document with total points
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        totalPoints,
        lastPointsUpdate: new Date()
      })
      
      console.log(`✅ Updated total points for user ${userId}: ${totalPoints}`)
      
      return {
        success: true,
        totalPoints,
        message: `Total points updated: ${totalPoints}`
      }
    } catch (error) {
      console.error('❌ Error updating user total points:', error)
      return {
        success: false,
        totalPoints: 0,
        message: `Failed to update total points: ${error}`
      }
    }
  }

  /**
   * Batch update multiple users' gameweek points
   */
  static async batchSaveGameweekPoints(
    updates: Array<{
      userId: string
      gameweekNumber: number
      pointsData: GameweekPointsData
    }>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const batch = writeBatch(db)
      
      updates.forEach(({ userId, gameweekNumber, pointsData }) => {
        const gwId = `gw${gameweekNumber}`
        const gameweekPointsRef = doc(db, 'users', userId, 'GameweekPoints', gwId)
        
        const dataToSave = {
          ...pointsData,
          gameweekNumber,
          gwId,
          lastUpdated: new Date()
        }
        
        batch.set(gameweekPointsRef, dataToSave, { merge: true })
      })
      
      await batch.commit()
      
      console.log(`✅ Batch saved ${updates.length} gameweek points updates`)
      
      return {
        success: true,
        message: `Batch updated ${updates.length} gameweek points`
      }
    } catch (error) {
      console.error('❌ Error batch saving gameweek points:', error)
      return {
        success: false,
        message: `Failed to batch save gameweek points: ${error}`
      }
    }
  }

  /**
   * Get gameweek points for all users in a specific gameweek
   */
  static async getGameweekPointsForAllUsers(
    gameweekNumber: number
  ): Promise<{ success: boolean; data: UserGameweekPoints[]; message: string }> {
    try {
      // This is a more complex query that requires getting all users first
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      const allGameweekPoints: UserGameweekPoints[] = []
      
      // Get gameweek points for each user
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        const result = await this.getGameweekPoints(userId, gameweekNumber)
        
        if (result.success && result.data) {
          allGameweekPoints.push(result.data)
        }
      }
      
      return {
        success: true,
        data: allGameweekPoints,
        message: `Retrieved gameweek ${gameweekNumber} points for ${allGameweekPoints.length} users`
      }
    } catch (error) {
      console.error('❌ Error getting gameweek points for all users:', error)
      return {
        success: false,
        data: [],
        message: `Failed to get gameweek points for all users: ${error}`
      }
    }
  }
}
