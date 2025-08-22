import { NextRequest, NextResponse } from 'next/server'

export async function POST() {
  try {
    // First gameweek functionality removed - use gameweekDeadlineService instead
    return NextResponse.json({
      success: false,
      message: 'First gameweek setup functionality has been moved to gameweekDeadlineService'
    })
  } catch (error) {
    console.error('Setup gameweek error:', error)
    return NextResponse.json(
      { error: 'Failed to setup gameweek' },
      { status: 500 }
    )
  }
}