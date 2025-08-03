/**
 * Example usage of Squad Manager functions
 * This file shows how to use the squad management and ranking system
 */

import { 
  saveSquadWithValidation, 
  getUserSquadWithPoints, 
  getCurrentGameweek,
  canModifySquad,
  formatTimeRemaining 
} from '@/lib/squadUtils'

import { 
  calculateAllUserPoints, 
  getLeaderboard, 
  getUserRankPosition,
  triggerGameweekCalculation 
} from '@/lib/rankingSystem'

import { getAuth } from 'firebase/auth'

// ===== EXAMPLE 1: Save User Squad =====
export async function exampleSaveSquad() {
  try {
    const currentGameweek = await getCurrentGameweek()
    
    // Example squad data
    const squadData = {
      formation: "3-4-3",
      startingXI: [
        { playerId: "player1", position: "GKP", name: "Goalkeeper 1", team: "Team A" },
        { playerId: "player2", position: "DEF", name: "Defender 1", team: "Team B" },
        { playerId: "player3", position: "DEF", name: "Defender 2", team: "Team C" },
        { playerId: "player4", position: "DEF", name: "Defender 3", team: "Team A" },
        { playerId: "player5", position: "MID", name: "Midfielder 1", team: "Team B" },
        { playerId: "player6", position: "MID", name: "Midfielder 2", team: "Team C" },
        { playerId: "player7", position: "MID", name: "Midfielder 3", team: "Team A" },
        { playerId: "player8", position: "MID", name: "Midfielder 4", team: "Team B" },
        { playerId: "player9", position: "FWD", name: "Forward 1", team: "Team C" },
        { playerId: "player10", position: "FWD", name: "Forward 2", team: "Team A" },
        { playerId: "player11", position: "FWD", name: "Forward 3", team: "Team B" }
      ],
      bench: [
        { playerId: "player12", position: "GKP", name: "Goalkeeper 2", team: "Team C" },
        { playerId: "player13", position: "DEF", name: "Defender 4", team: "Team A" },
        { playerId: "player14", position: "MID", name: "Midfielder 5", team: "Team B" },
        { playerId: "player15", position: "FWD", name: "Forward 4", team: "Team C" }
      ],
      captainId: "player9", // Forward 1 as captain
      viceCaptainId: "player5" // Midfielder 1 as vice captain
    }

    // Check if squad can be modified
    const modifyCheck = await canModifySquad(currentGameweek)
    if (!modifyCheck.canModify) {
      console.log('Cannot modify squad:', modifyCheck.message)
      return
    }

    console.log('Time remaining:', formatTimeRemaining(modifyCheck.timeRemaining))

    // Save the squad
    const result = await saveSquadWithValidation(squadData, currentGameweek)
    
    if (result.success) {
      console.log('Squad saved successfully!')
      console.log('Squad ID:', result.squadId)
      console.log('Saved at:', result.savedAt)
    } else {
      console.error('Failed to save squad:', result.message)
    }

    return result

  } catch (error) {
    console.error('Error in example save squad:', error)
  }
}

// ===== EXAMPLE 2: Get User Squad with Points =====
export async function exampleGetUserSquad() {
  try {
    const auth = getAuth()
    const currentUser = auth.currentUser

    if (!currentUser) {
      console.log('User not logged in')
      return
    }

    const currentGameweek = await getCurrentGameweek()
    
    // Get user's squad with points
    const squadWithPoints = await getUserSquadWithPoints(currentUser.uid, currentGameweek)
    
    if (squadWithPoints) {
      console.log('User Squad:')
      console.log('Formation:', squadWithPoints.formation)
      console.log('Total Points:', squadWithPoints.totalPoints)
      console.log('Starting XI:', squadWithPoints.startingXI)
      console.log('Bench:', squadWithPoints.bench)
      console.log('Captain:', squadWithPoints.captainId)
      
      if (squadWithPoints.points) {
        console.log('Player Points:', squadWithPoints.points.playerPoints)
      }
    } else {
      console.log('No squad found for current gameweek')
    }

    return squadWithPoints

  } catch (error) {
    console.error('Error getting user squad:', error)
  }
}

// ===== EXAMPLE 3: Calculate Points for All Users (Admin Function) =====
export async function exampleCalculateAllPoints() {
  try {
    const gameweek = 27 // Example gameweek
    
    console.log(`Calculating points for all users in gameweek ${gameweek}...`)
    
    const result = await calculateAllUserPoints(gameweek)
    
    if (result.success) {
      console.log('Points calculation completed!')
      console.log('Processed users:', result.processedUsers)
      console.log('Total users:', result.totalUsers)
      console.log('Top 5 users:', result.userResults.slice(0, 5))
    } else {
      console.error('Points calculation failed:', result.message)
    }

    return result

  } catch (error) {
    console.error('Error calculating points:', error)
  }
}

// ===== EXAMPLE 4: Get Leaderboard =====
export async function exampleGetLeaderboard() {
  try {
    const topUsers = await getLeaderboard(10) // Get top 10 users
    
    console.log('=== LEADERBOARD ===')
    topUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName} - ${user.totalPoints} points (Rank: ${user.overallRank})`)
    })

    return topUsers

  } catch (error) {
    console.error('Error getting leaderboard:', error)
  }
}

// ===== EXAMPLE 5: Get User's Rank Position =====
export async function exampleGetUserRank() {
  try {
    const auth = getAuth()
    const currentUser = auth.currentUser

    if (!currentUser) {
      console.log('User not logged in')
      return
    }

    const rankPosition = await getUserRankPosition(currentUser.uid, 3) // 3 users above and below
    
    if (rankPosition) {
      console.log('=== YOUR POSITION ===')
      console.log(`Rank: ${rankPosition.user.overallRank}`)
      console.log(`Points: ${rankPosition.user.totalPoints}`)
      console.log(`Position: ${rankPosition.position} of ${rankPosition.totalUsers}`)
      
      console.log('\n=== SURROUNDING USERS ===')
      rankPosition.surrounding.forEach(user => {
        const isCurrentUser = user.userId === currentUser.uid
        const marker = isCurrentUser ? ' ← YOU' : ''
        console.log(`${user.overallRank}. ${user.displayName} - ${user.totalPoints} points${marker}`)
      })
    }

    return rankPosition

  } catch (error) {
    console.error('Error getting user rank:', error)
  }
}

// ===== EXAMPLE 6: Trigger Gameweek Calculation (Admin) =====
export async function exampleTriggerCalculation() {
  try {
    const gameweek = 27 // Example gameweek
    
    console.log(`Triggering calculation for gameweek ${gameweek}...`)
    
    const result = await triggerGameweekCalculation(gameweek)
    
    if (result.success) {
      console.log('Calculation triggered successfully!')
      console.log('Results:', result)
    } else {
      console.error('Calculation failed:', result.message)
    }

    return result

  } catch (error) {
    console.error('Error triggering calculation:', error)
  }
}

// ===== EXAMPLE 7: Complete Workflow =====
export async function exampleCompleteWorkflow() {
  try {
    console.log('=== COMPLETE SQUAD MANAGEMENT WORKFLOW ===')
    
    // 1. Save a squad
    console.log('\n1. Saving squad...')
    await exampleSaveSquad()
    
    // 2. Get user's squad
    console.log('\n2. Getting user squad...')
    await exampleGetUserSquad()
    
    // 3. Get leaderboard
    console.log('\n3. Getting leaderboard...')
    await exampleGetLeaderboard()
    
    // 4. Get user's rank
    console.log('\n4. Getting user rank...')
    await exampleGetUserRank()
    
    console.log('\n=== WORKFLOW COMPLETED ===')

  } catch (error) {
    console.error('Error in complete workflow:', error)
  }
}

// ===== USAGE IN REACT COMPONENTS =====

/**
 * Example React hook for squad management
 */
export function useSquadManager() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [squad, setSquad] = useState(null)

  const saveSquad = async (squadData) => {
    setLoading(true)
    setError(null)
    
    try {
      const currentGameweek = await getCurrentGameweek()
      const result = await saveSquadWithValidation(squadData, currentGameweek)
      
      if (result.success) {
        setSquad(squadData)
      } else {
        setError(result.message)
      }
      
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }

  const loadSquad = async (userId) => {
    setLoading(true)
    setError(null)
    
    try {
      const currentGameweek = await getCurrentGameweek()
      const squadData = await getUserSquadWithPoints(userId, currentGameweek)
      setSquad(squadData)
      return squadData
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    squad,
    loading,
    error,
    saveSquad,
    loadSquad
  }
}
