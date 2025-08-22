import { NextRequest, NextResponse } from 'next/server'
import { SimpleRankingService } from '@/lib/simpleRankingService'

// GET /api/simple-rankings - Get simple rankings based on actual squad data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action') // 'all' | 'user' | 'update'

    console.log(`📊 Simple Rankings API called - Action: ${action}, User: ${userId}`)

    switch (action) {
      case 'all':
        // Get all rankings
        const allRankings = await SimpleRankingService.generateSimpleRankings()
        return NextResponse.json({
          success: allRankings.success,
          data: allRankings.rankings,
          message: allRankings.message,
          count: allRankings.rankings.length
        })

      case 'user':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for user ranking' },
            { status: 400 }
          )
        }

        const userRanking = await SimpleRankingService.getUserRanking(userId)
        return NextResponse.json({
          success: userRanking.success,
          data: userRanking.ranking,
          message: userRanking.message
        })

      case 'users-with-squads':
        // Get all users with their squad data
        const usersWithSquads = await SimpleRankingService.getAllUsersWithSquads()
        return NextResponse.json({
          success: usersWithSquads.success,
          data: usersWithSquads.users,
          message: usersWithSquads.message,
          count: usersWithSquads.users.length
        })

      default:
        // Default to all rankings
        const defaultRankings = await SimpleRankingService.generateSimpleRankings()
        return NextResponse.json({
          success: defaultRankings.success,
          data: defaultRankings.rankings,
          message: defaultRankings.message,
          count: defaultRankings.rankings.length
        })
    }

  } catch (error) {
    console.error('❌ Error in simple rankings API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch simple rankings' },
      { status: 500 }
    )
  }
}

// POST /api/simple-rankings - Update rankings in database
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    console.log(`🔄 Simple Rankings update - Action: ${action}`)

    switch (action) {
      case 'update':
        // Update all user rankings in database
        const updateResult = await SimpleRankingService.updateUserRankings()
        return NextResponse.json({
          success: updateResult.success,
          updated: updateResult.updated,
          message: updateResult.message
        })

      case 'calculate':
        // Just calculate and return rankings without updating database
        const calculateResult = await SimpleRankingService.generateSimpleRankings()
        return NextResponse.json({
          success: calculateResult.success,
          data: calculateResult.rankings,
          message: calculateResult.message,
          count: calculateResult.rankings.length
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: update or calculate' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error in simple rankings update API:', error)
    return NextResponse.json(
      { error: 'Failed to update simple rankings' },
      { status: 500 }
    )
  }
}
