import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Return server timestamp to prevent client-side time manipulation
    const serverTime = new Date().toISOString()
    
    return NextResponse.json({
      serverTime,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Error getting server time:', error)
    return NextResponse.json(
      { error: 'Failed to get server time' },
      { status: 500 }
    )
  }
}