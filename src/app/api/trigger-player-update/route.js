import { NextResponse } from 'next/server'
import { triggerPlayerDataUpdate } from '../../../lib/firebase/realTimePointsUpdater.js'
import firebase from '../../../lib/firebase'; // no extension

/**
 * API Route to trigger points updates when player data changes
 * 
 * POST /api/trigger-player-update
 * Body: { playerId: string, gameweek: number }
 */

export async function POST(request) {
  try {
    const body = await request.json()
    const { playerId, gameweek } = body

    console.log(`🔄 Triggering player update: ${playerId} in GW${gameweek}`)

    if (!playerId || !gameweek) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: playerId, gameweek'
      }, { status: 400 })
    }

    // Trigger the update for all affected users
    const result = await triggerPlayerDataUpdate(playerId, gameweek)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        playerId: playerId,
        gameweek: gameweek,
        affectedUsers: result.data?.affectedUsers || 0,
        successfulUpdates: result.data?.successfulUpdates || 0,
        details: result.data
      }
    })

  } catch (error) {
    console.error('Error in trigger player update API:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 })
  }
}

// GET - Test endpoint to check which users have a specific player
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    const gameweek = searchParams.get('gameweek')

    if (!playerId || !gameweek) {
      return NextResponse.json({
        success: false,
        message: 'Missing required parameters: playerId, gameweek'
      }, { status: 400 })
    }

    // Import here to avoid circular dependencies
    const { 
      doc, 
      getDoc, 
      collection, 
      getDocs
    } = await import('firebase/firestore')
    const { db } = await import('../../../lib/firebase')

    console.log(`🔍 Checking which users have player ${playerId} in GW${gameweek}`)

    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const usersWithPlayer = []

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      
      try {
        // Check if user has a squad for this gameweek
        const squadDoc = await getDoc(doc(db, `users/${userId}/squads/gw${gameweek}`))
        
        if (squadDoc.exists()) {
          const squadData = squadDoc.data()
          
          // Check different possible squad structures
          let allPlayers = []
          
          if (squadData.startingXI && squadData.bench) {
            allPlayers = [...(squadData.startingXI || []), ...(squadData.bench || [])]
          } else if (squadData.formation) {
            allPlayers = [...(squadData.formation.starting || []), ...(squadData.formation.bench || [])]
          } else if (squadData.players) {
            allPlayers = squadData.players || []
          }
          
          // Check if this player is in the user's squad
          const hasPlayer = allPlayers.some(player => 
            player.playerId === playerId || player.id === playerId
          )
          
          if (hasPlayer) {
            const userData = userDoc.data()
            usersWithPlayer.push({
              userId: userId,
              displayName: userData.displayName || userData.email || 'Unknown User',
              isCaptain: squadData.captain === playerId,
              squadStructure: {
                hasStartingXI: !!squadData.startingXI,
                hasFormation: !!squadData.formation,
                hasPlayers: !!squadData.players
              }
            })
          }
        }
      } catch (userError) {
        console.warn(`Error checking squad for user ${userId}:`, userError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Found ${usersWithPlayer.length} users with player ${playerId} in GW${gameweek}`,
      data: {
        playerId: playerId,
        gameweek: parseInt(gameweek),
        usersWithPlayer: usersWithPlayer,
        totalUsers: usersWithPlayer.length
      }
    })

  } catch (error) {
    console.error('Error in get users with player API:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 })
  }
}

// Example usage documentation
export async function OPTIONS(request) {
  return NextResponse.json({
    message: 'Player Update Trigger API Documentation',
    endpoints: {
      'POST /api/trigger-player-update': {
        description: 'Trigger points update for all users when a player\'s points change',
        body: {
          playerId: 'string - Player ID whose points changed',
          gameweek: 'number - Gameweek number (1-27)'
        },
        example: {
          playerId: 'player123',
          gameweek: 3
        }
      },
      'GET /api/trigger-player-update': {
        description: 'Check which users have a specific player in their squad',
        params: {
          playerId: 'string - Player ID to check',
          gameweek: 'number - Gameweek number'
        },
        example: '/api/trigger-player-update?playerId=player123&gameweek=3'
      }
    },
    usage: {
      whenToUse: 'Call this API whenever you update a player\'s points in the database',
      workflow: [
        '1. Update player points in players collection',
        '2. Call POST /api/trigger-player-update with playerId and gameweek',
        '3. System finds all users with that player',
        '4. Recalculates and updates their gameweek points',
        '5. Updates their total points across all gameweeks'
      ]
    },
    example_workflow: {
      step1: 'Update player points: players/player123 → points.gw3 = 15',
      step2: 'Trigger update: POST /api/trigger-player-update { playerId: "player123", gameweek: 3 }',
      step3: 'System automatically updates all affected users\' points'
    }
  })
}
