import { NextResponse } from 'next/server'
import { fetchAllPlayers } from '@/lib/firebasePlayersService'

export async function GET() {
  try {
    const players = await fetchAllPlayers()
    
    return NextResponse.json({
      success: true,
      count: players.length,
      data: players
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch players from Firebase' 
      },
      { status: 500 }
    )
  }
}