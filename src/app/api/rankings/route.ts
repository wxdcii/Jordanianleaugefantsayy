import { NextRequest, NextResponse } from 'next/server'
import { RankingService } from '@/lib/rankingService'
import { LeaderboardService } from '@/lib/leaderboardService'

// GET /api/rankings - Get user ranking or leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'user' | 'leaderboard' | 'around'
    const gameweek = searchParams.get('gameweek')
    const limit = parseInt(searchParams.get('limit') || '100')
    const rank = parseInt(searchParams.get('rank') || '0')

    console.log(`📊 Rankings API called - Type: ${type}, User: ${userId}, GW: ${gameweek}`)

    switch (type) {
      case 'user':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for user ranking' },
            { status: 400 }
          )
        }

        const userRanking = await RankingService.getUserRanking(userId)
        return NextResponse.json({
          success: userRanking.success,
          data: userRanking.data,
          stats: {
            gameweeksPlayed: userRanking.gameweeksPlayed,
            averagePoints: userRanking.averagePoints
          },
          message: userRanking.message
        })

      case 'leaderboard':
        if (gameweek) {
          // Get gameweek leaderboard
          const gwNumber = parseInt(gameweek)
          const gwLeaderboard = await LeaderboardService.getGameweekLeaderboard(gwNumber)
          return NextResponse.json({
            success: gwLeaderboard.success,
            data: gwLeaderboard.data,
            message: gwLeaderboard.message
          })
        } else {
          // Get overall leaderboard
          const overallLeaderboard = await LeaderboardService.getOverallLeaderboard()
          return NextResponse.json({
            success: overallLeaderboard.success,
            data: overallLeaderboard.data,
            message: overallLeaderboard.message
          })
        }

      case 'around':
        if (!rank) {
          return NextResponse.json(
            { error: 'rank is required for around ranking' },
            { status: 400 }
          )
        }

        const usersAround = await RankingService.getUsersAroundRank(rank, 5)
        return NextResponse.json({
          success: usersAround.success,
          data: usersAround.data,
          message: usersAround.message
        })

      case 'top':
        const topUsers = await RankingService.getTopUsers(limit)
        return NextResponse.json({
          success: topUsers.success,
          data: topUsers.data,
          message: topUsers.message
        })

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: user, leaderboard, around, or top' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error in rankings API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    )
  }
}

// POST /api/rankings - Update rankings or trigger calculations
export async function POST(request: NextRequest) {
  try {
    const { action, userId, gameweekNumber, season } = await request.json()

    console.log(`🔄 Rankings update - Action: ${action}, User: ${userId}, GW: ${gameweekNumber}`)

    switch (action) {
      case 'calculate_all':
        // Recalculate all user rankings
        const allRankingsResult = await RankingService.calculateAndUpdateAllRankings()
        return NextResponse.json({
          success: allRankingsResult.success,
          message: allRankingsResult.message,
          usersUpdated: allRankingsResult.usersUpdated
        })

      case 'update_user':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for user update' },
            { status: 400 }
          )
        }

        const userUpdateResult = await RankingService.updateSingleUserRanking(userId)
        return NextResponse.json({
          success: userUpdateResult.success,
          newRank: userUpdateResult.newRank,
          totalPoints: userUpdateResult.totalPoints,
          message: userUpdateResult.message
        })

      case 'generate_leaderboards':
        // Generate all leaderboards
        const leaderboardsResult = await LeaderboardService.generateAllLeaderboards(27, season || "2024-25")
        return NextResponse.json({
          success: leaderboardsResult.success,
          message: leaderboardsResult.message,
          generated: leaderboardsResult.generated
        })

      case 'generate_gameweek_leaderboard':
        if (!gameweekNumber) {
          return NextResponse.json(
            { error: 'gameweekNumber is required for gameweek leaderboard' },
            { status: 400 }
          )
        }

        const gwLeaderboardResult = await LeaderboardService.generateGameweekLeaderboard(gameweekNumber)
        return NextResponse.json({
          success: gwLeaderboardResult.success,
          message: gwLeaderboardResult.message,
          leaderboard: gwLeaderboardResult.leaderboard
        })

      case 'generate_overall_leaderboard':
        const overallLeaderboardResult = await LeaderboardService.generateOverallLeaderboard(season || "2024-25")
        return NextResponse.json({
          success: overallLeaderboardResult.success,
          message: overallLeaderboardResult.message,
          leaderboard: overallLeaderboardResult.leaderboard
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: calculate_all, update_user, generate_leaderboards, generate_gameweek_leaderboard, or generate_overall_leaderboard' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error in rankings update API:', error)
    return NextResponse.json(
      { error: 'Failed to update rankings' },
      { status: 500 }
    )
  }
}
