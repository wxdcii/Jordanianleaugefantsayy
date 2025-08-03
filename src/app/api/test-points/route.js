import { NextResponse } from 'next/server'
import { updateUserGameweekPoints } from '../../../lib/firebase/realTimePointsUpdater.js'

/**
 * Test API to manually trigger points recalculation
 * POST /api/test-points
 * Body: { userId: string, gameweek: number }
 */

export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, gameweek } = body

    if (!userId || !gameweek) {
      return NextResponse.json({
        success: false,
        message: 'Missing userId or gameweek'
      }, { status: 400 })
    }

    console.log(`🧪 Test: Recalculating points for user ${userId}, GW${gameweek}`)

    // Trigger points recalculation
    const result = await updateUserGameweekPoints(userId, gameweek)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      points: result.points,
      breakdown: result.breakdown
    })

  } catch (error) {
    console.error('Error in test points API:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 })
  }
}

// GET - Show usage info
export async function GET(request) {
  return NextResponse.json({
    message: 'Test Points Recalculation API',
    usage: {
      method: 'POST',
      body: {
        userId: 'string - User ID',
        gameweek: 'number - Gameweek number (1-27)'
      },
      description: 'Manually triggers points recalculation for a user and gameweek'
    },
    example: {
      url: 'POST /api/test-points',
      body: {
        userId: 'your-user-id',
        gameweek: 1
      }
    }
  })
}
