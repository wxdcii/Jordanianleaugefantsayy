import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

// Types
export interface Team {
  id: string
  name: string
  nameAr: string
  shortName: string
  logo: string
  primaryColor: string
  secondaryColor: string
  foundedYear?: number
  stadium?: string
  stadiumAr?: string
  city: string
  cityAr: string
  createdAt: Date
  updatedAt: Date
}

export interface Player {
  id: string
  teamId: string
  name: string
  nameAr: string
  position: 'GKP' | 'DEF' | 'MID' | 'FWD'
  shirtNumber?: number
  price: number
  totalPoints: number
  form: number
  selectedByPercent: number
  points: { 
    [key: string]: number | undefined
  }
  goalsScored: number
  assists: number
  cleanSheets: number
  goalsConceded: number
  ownGoals: number
  penaltiesSaved: number
  penaltiesMissed: number
  yellowCards: number
  redCards: number
  saves: number
  bonus: number
  minutes: number
  appearances: number
  isAvailable: boolean
  injuryStatus: string
  chanceOfPlaying: number
  createdAt: Date
  updatedAt: Date
}

export interface Gameweek {
  id: string
  seasonId: string
  number: number
  name: string
  deadline: Date
  isCurrent: boolean
  isFinished: boolean
  isDeadlinePassed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PlayerGameweekStats {
  id: string
  playerId: string
  gameweekId: string
  minutes: number
  goalsScored: number
  assists: number
  cleanSheets: number
  goalsConceded: number
  ownGoals: number
  penaltiesSaved: number
  penaltiesMissed: number
  yellowCards: number
  redCards: number
  saves: number
  bonus: number
  totalPoints: number
  wasHome: boolean
  opponentTeamId?: string
  createdAt: Date
  updatedAt: Date
}

export interface FantasyTeam {
  id: string
  userId: string
  teamName: string
  teamNameAr: string
  totalPoints: number
  budget: number
  freeTransfers: number
  createdAt: Date
  updatedAt: Date
}

export interface FantasyTeamSelection {
  id: string
  fantasyTeamId: string
  playerId: string
  gameweekId: string
  isCaptain: boolean
  isViceCaptain: boolean
  isStarting: boolean
  benchPosition?: number
  createdAt: Date
}

// Team Services
export const teamService = {
  async getAll(): Promise<Team[]> {
    const teamsRef = collection(db, 'teams')
    const snapshot = await getDocs(query(teamsRef, orderBy('name')))
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Team[]
  },

  async getById(id: string): Promise<Team | null> {
    const teamDoc = await getDoc(doc(db, 'teams', id))
    if (!teamDoc.exists()) return null
    return {
      id: teamDoc.id,
      ...teamDoc.data(),
      createdAt: teamDoc.data().createdAt?.toDate(),
      updatedAt: teamDoc.data().updatedAt?.toDate(),
    } as Team
  },

  async create(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const teamRef = doc(collection(db, 'teams'))
    await setDoc(teamRef, {
      ...team,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return teamRef.id
  },

  async update(id: string, updates: Partial<Team>): Promise<void> {
    await updateDoc(doc(db, 'teams', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  }
}

// Player Services
export const playerService = {
  async getAll(filters?: {
    position?: string
    teamId?: string
    available?: boolean
  }): Promise<Player[]> {
    let playersQuery = query(collection(db, 'players'), orderBy('totalPoints', 'desc'))

    if (filters?.position && filters.position !== 'ALL') {
      playersQuery = query(playersQuery, where('position', '==', filters.position))
    }

    if (filters?.teamId) {
      playersQuery = query(playersQuery, where('teamId', '==', filters.teamId))
    }

    if (filters?.available !== undefined) {
      playersQuery = query(playersQuery, where('isAvailable', '==', filters.available))
    }

    const snapshot = await getDocs(playersQuery)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Player[]
  },

  async getById(id: string): Promise<Player | null> {
    const playerDoc = await getDoc(doc(db, 'players', id))
    if (!playerDoc.exists()) return null
    return {
      id: playerDoc.id,
      ...playerDoc.data(),
      createdAt: playerDoc.data().createdAt?.toDate(),
      updatedAt: playerDoc.data().updatedAt?.toDate(),
    } as Player
  },

  async update(id: string, updates: Partial<Player>): Promise<void> {
    await updateDoc(doc(db, 'players', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  },

  async updateGameweekStats(playerId: string, gameweekId: string, stats: Omit<PlayerGameweekStats, 'id' | 'playerId' | 'gameweekId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const statsRef = doc(collection(db, 'playerGameweekStats'))

    // Calculate total points based on FPL scoring
    const player = await this.getById(playerId)
    let totalPoints = 0

    // Minutes played
    if (stats.minutes >= 60) totalPoints += 2
    else if (stats.minutes >= 1) totalPoints += 1

    // Goals scored (position dependent)
    if (player?.position === 'GKP' || player?.position === 'DEF') {
      totalPoints += stats.goalsScored * 6
    } else if (player?.position === 'MID') {
      totalPoints += stats.goalsScored * 5
    } else if (player?.position === 'FWD') {
      totalPoints += stats.goalsScored * 4
    }

    // Assists
    totalPoints += stats.assists * 3

    // Clean sheets
    if ((player?.position === 'GKP' || player?.position === 'DEF') && stats.cleanSheets > 0) {
      totalPoints += 4
    } else if (player?.position === 'MID' && stats.cleanSheets > 0) {
      totalPoints += 1
    }

    // Goals conceded (GKP and DEF only)
    if (player?.position === 'GKP' || player?.position === 'DEF') {
      totalPoints -= Math.floor(stats.goalsConceded / 2)
    }

    // Cards and other actions
    totalPoints -= stats.yellowCards * 1
    totalPoints -= stats.redCards * 3
    totalPoints -= stats.ownGoals * 2
    totalPoints += stats.penaltiesSaved * 5
    totalPoints -= stats.penaltiesMissed * 2

    // Saves (GKP only)
    if (player?.position === 'GKP') {
      totalPoints += Math.floor(stats.saves / 3)
    }

    // Bonus points
    totalPoints += stats.bonus

    await setDoc(statsRef, {
      playerId,
      gameweekId,
      ...stats,
      totalPoints,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Update player total points and form
    const playerStats = await getDocs(
      query(
        collection(db, 'playerGameweekStats'),
        where('playerId', '==', playerId),
        orderBy('createdAt', 'desc')
      )
    )

    const allPoints = playerStats.docs.map(doc => doc.data().totalPoints)
    const newTotalPoints = allPoints.reduce((sum, points) => sum + points, 0)
    const recentForm = allPoints.slice(0, 5).reduce((sum, points) => sum + points, 0) / Math.min(allPoints.length, 5)

    await this.update(playerId, {
      totalPoints: newTotalPoints,
      form: recentForm
    })
  }
}

// Gameweek Services
export const gameweekService = {
  async getAll(): Promise<Gameweek[]> {
    const gameweeksRef = collection(db, 'gameweeks')
    const snapshot = await getDocs(query(gameweeksRef, orderBy('number')))
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      deadline: doc.data().deadline?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      isDeadlinePassed: doc.data().deadline?.toDate() < new Date(),
    })) as Gameweek[]
  },

  async getCurrent(): Promise<Gameweek | null> {
    const gameweeksRef = collection(db, 'gameweeks')
    const snapshot = await getDocs(query(gameweeksRef, where('isCurrent', '==', true), limit(1)))
    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
      deadline: doc.data().deadline?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      isDeadlinePassed: doc.data().deadline?.toDate() < new Date(),
    } as Gameweek
  },

  async create(gameweek: Omit<Gameweek, 'id' | 'createdAt' | 'updatedAt' | 'isDeadlinePassed'>): Promise<string> {
    // If setting as current, make sure no other gameweek is current
    if (gameweek.isCurrent) {
      const currentGameweeks = await getDocs(
        query(collection(db, 'gameweeks'), where('isCurrent', '==', true))
      )

      for (const gameweekDoc of currentGameweeks.docs) {
        await updateDoc(gameweekDoc.ref, { isCurrent: false })
      }
    }

    const gameweekRef = doc(collection(db, 'gameweeks'))
    await setDoc(gameweekRef, {
      ...gameweek,
      deadline: Timestamp.fromDate(gameweek.deadline),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return gameweekRef.id
  },

  async update(id: string, updates: Partial<Gameweek>): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    }

    if (updates.deadline) {
      updateData.deadline = Timestamp.fromDate(updates.deadline)
    }

    await updateDoc(doc(db, 'gameweeks', id), updateData)
  },

  // Real-time listener for deadline changes
  onDeadlineChange(callback: (gameweek: Gameweek | null) => void) {
    return onSnapshot(
      query(collection(db, 'gameweeks'), where('isCurrent', '==', true), limit(1)),
      (snapshot) => {
        if (snapshot.empty) {
          callback(null)
          return
        }

        const doc = snapshot.docs[0]
        const gameweek = {
          id: doc.id,
          ...doc.data(),
          deadline: doc.data().deadline?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          isDeadlinePassed: doc.data().deadline?.toDate() < new Date(),
        } as Gameweek

        callback(gameweek)
      }
    )
  }
}

// Fantasy Team Services
export const fantasyTeamService = {
  async getUserTeam(userId: string): Promise<FantasyTeam | null> {
    const teamsRef = collection(db, 'fantasyTeams')
    const snapshot = await getDocs(query(teamsRef, where('userId', '==', userId), limit(1)))

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as FantasyTeam
  },

  async createTeam(team: Omit<FantasyTeam, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const teamRef = doc(collection(db, 'fantasyTeams'))
    await setDoc(teamRef, {
      ...team,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return teamRef.id
  },

  async updateTeam(id: string, updates: Partial<FantasyTeam>): Promise<void> {
    // Filter out undefined values to avoid Firebase errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(doc(db, 'fantasyTeams', id), {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    })
  },

  async saveTeamSelection(
    fantasyTeamId: string,
    gameweekId: string,
    selections: Omit<FantasyTeamSelection, 'id' | 'fantasyTeamId' | 'gameweekId' | 'createdAt'>[]
  ): Promise<void> {
    // Remove existing selections for this gameweek
    const existingSelections = await getDocs(
      query(
        collection(db, 'fantasyTeamSelections'),
        where('fantasyTeamId', '==', fantasyTeamId),
        where('gameweekId', '==', gameweekId)
      )
    )

    for (const selection of existingSelections.docs) {
      await deleteDoc(selection.ref)
    }

    // Add new selections
    for (const selection of selections) {
      const selectionRef = doc(collection(db, 'fantasyTeamSelections'))
      await setDoc(selectionRef, {
        fantasyTeamId,
        gameweekId,
        ...selection,
        createdAt: serverTimestamp(),
      })
    }
  },

  async getTeamSelection(fantasyTeamId: string, gameweekId: string): Promise<FantasyTeamSelection[]> {
    const selectionsRef = collection(db, 'fantasyTeamSelections')
    const snapshot = await getDocs(
      query(
        selectionsRef,
        where('fantasyTeamId', '==', fantasyTeamId),
        where('gameweekId', '==', gameweekId)
      )
    )

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as FantasyTeamSelection[]
  }
}



