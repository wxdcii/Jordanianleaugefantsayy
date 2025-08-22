import { NextResponse } from 'next/server'
import {
  updateUserGameweekPoints,
  updateAllUsersGameweekPoints,
  updateUserTotalPoints,
  calculateUserGameweekPoints,
  triggerPlayerDataUpdate,
  debugSquadStructure
} from '../../../lib/firebase/realTimePointsUpdater.js'

/**
 * API Route for Real-time Points Updates
 * 
 * POST /api/update-points - Update points for users when player performance changes
 */

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, userId, gameweek, playerId, updateAll = false } = body

    console.log(`🔄 Points update request: ${action}`, { userId, gameweek, playerId, updateAll })

    switch (action) {
      case 'update-user-gameweek':
        // Update points for a specific user and gameweek
        if (!userId || !gameweek) {
          return NextResponse.json({
            success: false,
            message: 'Missing required fields: userId, gameweek'
          }, { status: 400 })
        }

        const userResult = await updateUserGameweekPoints(userId, gameweek)
        
        if (userResult.success) {
          // Also update user's total points
          await updateUserTotalPoints(userId)
        }

        return NextResponse.json({
          success: userResult.success,
          message: userResult.message,
          data: {
            userId: userId,
            gameweek: gameweek,
            points: userResult.points,
            breakdown: userResult.breakdown
          }
        })

      case 'update-all-gameweek':
        // Update points for all users in a specific gameweek
        if (!gameweek) {
          return NextResponse.json({
            success: false,
            message: 'Missing required field: gameweek'
          }, { status: 400 })
        }

        const allUsersResult = await updateAllUsersGameweekPoints(gameweek)

        return NextResponse.json({
          success: allUsersResult.success,
          message: allUsersResult.message,
          data: {
            gameweek: gameweek,
            results: allUsersResult.results,
            updatedCount: allUsersResult.results?.filter(r => r.success).length || 0,
            totalCount: allUsersResult.results?.length || 0
          }
        })

      case 'update-user-total':
        // Recalculate total points for a specific user
        if (!userId) {
          return NextResponse.json({
            success: false,
            message: 'Missing required field: userId'
          }, { status: 400 })
        }

        const totalResult = await updateUserTotalPoints(userId)

        return NextResponse.json({
          success: totalResult.success,
          message: totalResult.message,
          data: {
            userId: userId,
            totalPoints: totalResult.totalPoints,
            gameweekBreakdown: totalResult.gameweekBreakdown
          }
        })

      case 'calculate-only':
        // Calculate points without saving (for testing)
        if (!userId || !gameweek) {
          return NextResponse.json({
            success: false,
            message: 'Missing required fields: userId, gameweek'
          }, { status: 400 })
        }

        const calculateResult = await calculateUserGameweekPoints(userId, gameweek)

        return NextResponse.json({
          success: calculateResult.success,
          message: calculateResult.message || `Calculated ${calculateResult.points} points`,
          data: {
            userId: userId,
            gameweek: gameweek,
            points: calculateResult.points,
            breakdown: calculateResult.breakdown
          }
        })

      case 'player-data-updated':
        // Update all users affected by a player's data change
        if (!playerId || !gameweek) {
          return NextResponse.json({
            success: false,
            message: 'Missing required fields: playerId, gameweek'
          }, { status: 400 })
        }

        const playerUpdateResult = await triggerPlayerDataUpdate(playerId, gameweek)

        return NextResponse.json({
          success: playerUpdateResult.success,
          message: playerUpdateResult.message,
          data: playerUpdateResult.data
        })

      case 'debug-squad':
        // Debug squad structure
        if (!userId || !gameweek) {
          return NextResponse.json({
            success: false,
            message: 'Missing required fields: userId, gameweek'
          }, { status: 400 })
        }

        const debugResult = await debugSquadStructure(userId, gameweek)

        return NextResponse.json({
          success: true,
          message: 'Squad structure debug info',
          data: debugResult
        })

      default:
        return NextResponse.json({
          success: false,
          message: `Unknown action: ${action}. Valid actions: update-user-gameweek, update-all-gameweek, update-user-total, calculate-only, player-data-updated, debug-squad`
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in points update API:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 })
  }
}

// GET - Get current points for a user/gameweek
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const gameweek = searchParams.get('gameweek')
    const action = searchParams.get('action') || 'get-points'

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required parameter: userId'
      }, { status: 400 })
    }

    if (action === 'calculate' && gameweek) {
      // Calculate points for specific gameweek
      const result = await calculateUserGameweekPoints(userId, parseInt(gameweek))
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: {
          userId: userId,
          gameweek: parseInt(gameweek),
          points: result.points,
          breakdown: result.breakdown
        }
      })
    }

    // Default: get stored points
    const { getGameweekPoints } = await import('../../../lib/firebase/pointsService.js')

    if (gameweek) {
      const result = await getGameweekPoints(userId, parseInt(gameweek))
      return NextResponse.json({
        success: result.success,
        data: result.data,
        message: result.message
      })
    } else {
      // Get total points
      const { getUserRanking } = await import('../../../lib/firebase/pointsService.js')
      const result = await getUserRanking(userId)
      return NextResponse.json({
        success: result.success,
        data: result.data,
        message: result.message
      })
    }

  } catch (error) {
    console.error('Error in points get API:', error)
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
    message: 'Real-time Points Update API Documentation',
    endpoints: {
      'POST /api/update-points': {
        description: 'Update user points when player performance changes',
        actions: {
          'update-user-gameweek': {
            description: 'Update points for specific user and gameweek',
            body: { action: 'update-user-gameweek', userId: 'string', gameweek: 'number' }
          },
          'update-all-gameweek': {
            description: 'Update points for all users in a gameweek',
            body: { action: 'update-all-gameweek', gameweek: 'number' }
          },
          'update-user-total': {
            description: 'Recalculate total points for a user',
            body: { action: 'update-user-total', userId: 'string' }
          },
          'calculate-only': {
            description: 'Calculate points without saving (testing)',
            body: { action: 'calculate-only', userId: 'string', gameweek: 'number' }
          }
        }
      },
      'GET /api/update-points': {
        description: 'Get current points for user/gameweek',
        params: {
          userId: 'required - User ID',
          gameweek: 'optional - Specific gameweek',
          action: 'optional - calculate (to recalculate) or get-points (default)'
        }
      }
    },
    examples: {
      updateUserGameweek: {
        method: 'POST',
        url: '/api/update-points',
        body: {
          action: 'update-user-gameweek',
          userId: 'user123',
          gameweek: 3
        }
      },
      updateAllGameweek: {
        method: 'POST',
        url: '/api/update-points',
        body: {
          action: 'update-all-gameweek',
          gameweek: 3
        }
      },
      calculatePoints: {
        method: 'GET',
        url: '/api/update-points?userId=user123&gameweek=3&action=calculate'
      }
    },
    pointsCalculation: {
      appearance: '2 points for playing',
      fullGame: '+1 bonus for 60+ minutes',
      goals: {
        GKP_DEF: '6 points per goal',
        MID: '5 points per goal', 
        FWD: '4 points per goal'
      },
      assists: '3 points each',
      cleanSheet: '4 points (GKP/DEF only)',
      saves: '1 point per 3 saves (GKP only)',
      penalties: '+5 saved, -2 missed',
      cards: '-1 yellow, -3 red',
      ownGoals: '-2 points each',
      captain: 'Double points',
      tripleCaptain: 'Triple points',
      benchBoost: 'Bench players count'
    },
    usage: {
      realTimeUpdates: 'Call when player performance data changes',
      batchUpdates: 'Update all users after matches complete',
      testing: 'Use calculate-only to test without saving'
    }
  })
}
