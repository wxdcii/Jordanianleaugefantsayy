import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Test gameweek functionality removed - use gameweekDeadlineService instead
    return NextResponse.json({
      success: false,
      message: 'Test gameweek setup functionality has been moved to gameweekDeadlineService'
    })
  } catch (error) {
    console.error('Setup test gameweek error:', error)
    return NextResponse.json(
      { error: 'Failed to setup test gameweek' },
      { status: 500 }
    )
  }
}