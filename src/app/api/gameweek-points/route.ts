import { NextRequest, NextResponse } from 'next/server'
import { GameweekPointsService, GameweekPointsData } from '@/lib/gameweekPointsService'
import { RankingService } from '@/lib/rankingService'

// GET /api/gameweek-points - Get gameweek points for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const gameweekNumber = parseInt(searchParams.get('gameweekNumber') || '0')
    const type = searchParams.get('type') // 'single' | 'all'

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    console.log(`📊 Gameweek points API - User: ${userId}, GW: ${gameweekNumber}, Type: ${type}`)

    if (type === 'all') {
      // Get all gameweek points for user
      const allPointsResult = await GameweekPointsService.getAllUserGameweekPoints(userId)
      return NextResponse.json({
        success: allPointsResult.success,
        data: allPointsResult.data,
        totalPoints: allPointsResult.totalPoints,
        message: allPointsResult.message
      })
    } else {
      // Get specific gameweek points
      if (!gameweekNumber || gameweekNumber < 1 || gameweekNumber > 27) {
        return NextResponse.json(
          { error: 'Valid gameweekNumber (1-27) is required' },
          { status: 400 }
        )
      }

      const pointsResult = await GameweekPointsService.getGameweekPoints(userId, gameweekNumber)
      return NextResponse.json({
        success: pointsResult.success,
        data: pointsResult.data,
        message: pointsResult.message
      })
    }

  } catch (error) {
    console.error('❌ Error in gameweek points API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gameweek points' },
      { status: 500 }
    )
  }
}

// POST /api/gameweek-points - Save or update gameweek points
export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      gameweekNumber, 
      pointsData, 
      updateRanking = true,
      batchUpdates 
    } = await request.json()

    console.log(`💾 Saving gameweek points - User: ${userId}, GW: ${gameweekNumber}`)

    // Handle batch updates
    if (batchUpdates && Array.isArray(batchUpdates)) {
      const batchResult = await GameweekPointsService.batchSaveGameweekPoints(batchUpdates)
      
      if (batchResult.success && updateRanking) {
        // Update rankings for all affected users
        console.log('🔄 Updating rankings after batch save...')
        await RankingService.calculateAndUpdateAllRankings()
      }
      
      return NextResponse.json({
        success: batchResult.success,
        message: batchResult.message,
        updatedCount: batchUpdates.length
      })
    }

    // Handle single update
    if (!userId || !gameweekNumber || !pointsData) {
      return NextResponse.json(
        { error: 'userId, gameweekNumber, and pointsData are required' },
        { status: 400 }
      )
    }

    if (gameweekNumber < 1 || gameweekNumber > 27) {
      return NextResponse.json(
        { error: 'gameweekNumber must be between 1 and 27' },
        { status: 400 }
      )
    }

    // Validate pointsData structure
    const requiredFields = ['points', 'benchPoints', 'transfersMade', 'formation', 'playersCount', 'isValid']
    const missingFields = requiredFields.filter(field => !(field in pointsData))
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Save gameweek points
    const saveResult = await GameweekPointsService.saveGameweekPoints(
      userId, 
      gameweekNumber, 
      pointsData as GameweekPointsData
    )

    if (!saveResult.success) {
      return NextResponse.json(
        { error: saveResult.message },
        { status: 500 }
      )
    }

    // Update user ranking if requested
    let rankingUpdate = null
    if (updateRanking) {
      console.log('🔄 Updating user ranking...')
      rankingUpdate = await RankingService.updateSingleUserRanking(userId)
    }

    return NextResponse.json({
      success: true,
      message: saveResult.message,
      ranking: rankingUpdate ? {
        newRank: rankingUpdate.newRank,
        totalPoints: rankingUpdate.totalPoints
      } : null
    })

  } catch (error) {
    console.error('❌ Error saving gameweek points:', error)
    return NextResponse.json(
      { error: 'Failed to save gameweek points' },
      { status: 500 }
    )
  }
}

// PUT /api/gameweek-points - Update existing gameweek points
export async function PUT(request: NextRequest) {
  try {
    const { userId, gameweekNumber, pointsData, updateRanking = true } = await request.json()

    if (!userId || !gameweekNumber || !pointsData) {
      return NextResponse.json(
        { error: 'userId, gameweekNumber, and pointsData are required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Updating gameweek points - User: ${userId}, GW: ${gameweekNumber}`)

    // Update gameweek points (same as save, but explicitly for updates)
    const updateResult = await GameweekPointsService.saveGameweekPoints(
      userId, 
      gameweekNumber, 
      pointsData as GameweekPointsData
    )

    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.message },
        { status: 500 }
      )
    }

    // Update user ranking if requested
    let rankingUpdate = null
    if (updateRanking) {
      console.log('🔄 Updating user ranking after points update...')
      rankingUpdate = await RankingService.updateSingleUserRanking(userId)
    }

    return NextResponse.json({
      success: true,
      message: updateResult.message,
      ranking: rankingUpdate ? {
        newRank: rankingUpdate.newRank,
        totalPoints: rankingUpdate.totalPoints
      } : null
    })

  } catch (error) {
    console.error('❌ Error updating gameweek points:', error)
    return NextResponse.json(
      { error: 'Failed to update gameweek points' },
      { status: 500 }
    )
  }
}
