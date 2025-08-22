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
  Timestamp,
  addDoc
} from 'firebase/firestore'
import { db } from './firebase'

// User Squad Interface
export interface UserSquad {
  id: string
  userId: string
  gameweekId: number
  players: {
    playerId: string
    name: string
    position: 'GKP' | 'DEF' | 'MID' | 'FWD'
    club: string
    price: number
    isCaptain: boolean
    isViceCaptain: boolean
    isStarting: boolean
    benchPosition: number | null
    points: number
  }[]
  formation: string
  captainId: string
  viceCaptainId: string
  totalValue: number
  transferCost: number
  chipsUsed: {
    wildcard1: { used: boolean; gameweek: number | null; isActive: boolean }
    wildcard2: { used: boolean; gameweek: number | null; isActive: boolean }
    freeHit: { used: boolean; gameweek: number | null; isActive: boolean }
    benchBoost: { used: boolean; gameweek: number | null; isActive: boolean }
    tripleCaptain: { used: boolean; gameweek: number | null; isActive: boolean }
  }
  transferState: {
    savedFreeTransfers: number
    transfersMadeThisWeek: number
    pointsDeductedThisWeek: number
    lastGameweekProcessed: number
    wildcardActive: boolean
    freeHitActive: boolean
  }
  isValid: boolean
  validationErrors: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
  deadline: string
  isSubmitted: boolean
  submittedAt?: Timestamp
}

// User Squad Service
export class UserSquadService {
  private static readonly COLLECTION_NAME = 'userSquads'

  // Save user squad
  static async saveUserSquad(squadData: Omit<UserSquad, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('🚀 Starting to save user squad:', {
        userId: squadData.userId,
        gameweekId: squadData.gameweekId,
        playersCount: squadData.players?.length,
        collection: this.COLLECTION_NAME
      })

      // Check if Firebase is available
      if (!db) {
        console.error('❌ Firebase database not initialized')
        throw new Error('Firebase database not initialized')
      }

      console.log('✅ Firebase database is available')

      // Try using addDoc first to test collection creation
      const collectionRef = collection(db, this.COLLECTION_NAME)
      console.log('📁 Collection reference created:', collectionRef.path)

      const now = new Date().toISOString() // Use regular timestamp for debugging
      const squadId = `${squadData.userId}_gw${squadData.gameweekId}`

      const fullSquadData = {
        ...squadData,
        id: squadId,
        createdAt: now,
        updatedAt: now
      }

      console.log('📤 About to save squad data to Firestore...')
      console.log('📄 Data preview:', {
        id: fullSquadData.id,
        userId: fullSquadData.userId,
        gameweekId: fullSquadData.gameweekId,
        playersCount: fullSquadData.players.length,
        captainId: fullSquadData.captainId
      })

      // Use addDoc to create the collection if it doesn't exist
      const docRef = await addDoc(collectionRef, fullSquadData)

      console.log('✅ User squad saved successfully to Firestore!')
      console.log('📍 Document ID:', docRef.id)
      console.log('📁 Collection:', this.COLLECTION_NAME)
      console.log('🔗 Full path:', docRef.path)

      return docRef.id
    } 
    
    
    catch (error) {
      console.error('💥 Error saving user squad:', error)
      console.error('📋 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : undefined,
        stack: error instanceof Error ? error.stack : undefined
      })
      throw new Error(`Failed to save user squad: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get user squad for specific gameweek
  static async getUserSquad(userId: string, gameweekId: number): Promise<UserSquad | null> {
    try {
      const squadId = `${userId}_gw${gameweekId}`
      const squadRef = doc(db, this.COLLECTION_NAME, squadId)
      const squadDoc = await getDoc(squadRef)

      if (squadDoc.exists()) {
        return squadDoc.data() as UserSquad
      }
      
      return null
    } catch (error) {
      console.error('Error getting user squad:', error)
      throw new Error('Failed to get user squad')
    }
  }

  // Get all squads for a user
  static async getUserSquads(userId: string): Promise<UserSquad[]> {
    try {
      const squadsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('gameweekId', 'desc')
      )
      
      const querySnapshot = await getDocs(squadsQuery)
      const squads: UserSquad[] = []
      
      querySnapshot.forEach((doc) => {
        squads.push(doc.data() as UserSquad)
      })
      
      return squads
    } catch (error) {
      console.error('Error getting user squads:', error)
      throw new Error('Failed to get user squads')
    }
  }

  // Get all squads for a specific gameweek (admin function)
  static async getGameweekSquads(gameweekId: number): Promise<UserSquad[]> {
    try {
      const squadsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('gameweekId', '==', gameweekId),
        where('isSubmitted', '==', true)
      )
      
      const querySnapshot = await getDocs(squadsQuery)
      const squads: UserSquad[] = []
      
      querySnapshot.forEach((doc) => {
        squads.push(doc.data() as UserSquad)
      })
      
      return squads
    } catch (error) {
      console.error('Error getting gameweek squads:', error)
      throw new Error('Failed to get gameweek squads')
    }
  }

  // Submit squad (final submission before deadline)
  static async submitSquad(userId: string, gameweekId: number): Promise<void> {
    try {
      const squadId = `${userId}_gw${gameweekId}`
      const squadRef = doc(db, this.COLLECTION_NAME, squadId)
      
      await setDoc(squadRef, {
        isSubmitted: true,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      console.log('Squad submitted successfully:', squadId)
    } catch (error) {
      console.error('Error submitting squad:', error)
      throw new Error('Failed to submit squad')
    }
  }

  // Check if user has submitted squad for gameweek
  static async hasSubmittedSquad(userId: string, gameweekId: number): Promise<boolean> {
    try {
      const squad = await this.getUserSquad(userId, gameweekId)
      return squad?.isSubmitted || false
    } catch (error) {
      console.error('Error checking squad submission:', error)
      return false
    }
  }

  // Get squad statistics
  static async getSquadStats(userId: string, gameweekId: number): Promise<{
    totalPoints: number
    captainPoints: number
    benchPoints: number
    transferCost: number
    netPoints: number
  } | null> {
    try {
      const squad = await this.getUserSquad(userId, gameweekId)
      if (!squad) return null

      const totalPoints = squad.players.reduce((sum, player) => {
        const basePoints = player.points
        const multiplier = player.isCaptain ? 
          (squad.chipsUsed.tripleCaptain.isActive ? 3 : 2) : 1
        return sum + (basePoints * multiplier)
      }, 0)

      const captainPoints = squad.players
        .filter(p => p.isCaptain)
        .reduce((sum, p) => sum + p.points, 0) * 
        (squad.chipsUsed.tripleCaptain.isActive ? 3 : 2)

      const benchPoints = squad.players
        .filter(p => !p.isStarting)
        .reduce((sum, p) => sum + p.points, 0)

      const netPoints = totalPoints - (squad.transferState?.pointsDeductedThisWeek || 0) // Get from transferState

      return {
        totalPoints,
        captainPoints,
        benchPoints,
        transferCost: squad.transferState?.pointsDeductedThisWeek || 0, // Get from transferState
        netPoints
      }
    } catch (error) {
      console.error('Error getting squad stats:', error)
      return null
    }
  }

  // Delete squad (for testing/admin purposes)
  static async deleteSquad(userId: string, gameweekId: number): Promise<void> {
    try {
      const squadId = `${userId}_gw${gameweekId}`
      const squadRef = doc(db, this.COLLECTION_NAME, squadId)
      
      // Note: Using setDoc with empty data to effectively delete
      // You might want to use deleteDoc instead depending on your needs
      await setDoc(squadRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true })
      
      console.log('Squad deleted successfully:', squadId)
    } catch (error) {
      console.error('Error deleting squad:', error)
      throw new Error('Failed to delete squad')
    }
  }
}
