import { NextRequest, NextResponse } from 'next/server'
import { WeeklyUpdateService } from '@/lib/weeklyUpdateService'

// POST /api/weekly-update - Trigger weekly ranking update
export async function POST(request: NextRequest) {
  try {
    const { gameweekNumber, playerPoints, action } = await request.json()

    console.log(`🚀 Weekly update API called - GW: ${gameweekNumber}, Action: ${action}`)

    if (!gameweekNumber || gameweekNumber < 1 || gameweekNumber > 27) {
      return NextResponse.json(
        { error: 'Valid gameweekNumber (1-27) is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'process_gameweek':
        // Process gameweek results and update rankings
        const results = await WeeklyUpdateService.triggerWeeklyUpdate(
          gameweekNumber,
          playerPoints
        )

        return NextResponse.json({
          success: true,
          results,
          message: `GW${gameweekNumber} processing completed`
        })

      case 'test_update':
        // Test update with mock data
        console.log(`🧪 Running test update for GW${gameweekNumber}`)
        
        const testResults = await WeeklyUpdateService.triggerWeeklyUpdate(gameweekNumber)
        
        return NextResponse.json({
          success: true,
          results: testResults,
          message: `Test update completed for GW${gameweekNumber}`,
          note: 'This was a test update with mock player points'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: process_gameweek or test_update' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error in weekly update API:', error)
    return NextResponse.json(
      { error: 'Failed to process weekly update' },
      { status: 500 }
    )
  }
}

// GET /api/weekly-update - Get status of weekly updates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameweekNumber = parseInt(searchParams.get('gameweekNumber') || '0')

    if (gameweekNumber && (gameweekNumber < 1 || gameweekNumber > 27)) {
      return NextResponse.json(
        { error: 'Valid gameweekNumber (1-27) is required' },
        { status: 400 }
      )
    }

    // For now, return a simple status
    // In a real implementation, you might track update status in the database
    return NextResponse.json({
      success: true,
      message: 'Weekly update API is available',
      availableActions: ['process_gameweek', 'test_update'],
      gameweekRange: '1-27',
      lastUpdate: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error getting weekly update status:', error)
    return NextResponse.json(
      { error: 'Failed to get weekly update status' },
      { status: 500 }
    )
  }
}
