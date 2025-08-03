import { NextRequest, NextResponse } from 'next/server'
import { UserSquadService } from '@/lib/userSquadService'

export async function POST(request: NextRequest) {
  try {
    const squadData = await request.json()
    
    console.log('Saving user squad:', {
      userId: squadData.userId,
      gameweekId: squadData.gameweekId,
      playersCount: squadData.players?.length,
      captainId: squadData.captainId,
      formation: squadData.formation,
      totalValue: squadData.totalValue
    })

    // Validate required fields
    if (!squadData.userId || !squadData.gameweekId || !squadData.players || !Array.isArray(squadData.players)) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, gameweekId, or players' },
        { status: 400 }
      )
    }

    if (squadData.players.length !== 15) {
      return NextResponse.json(
        { error: 'Must have exactly 15 players' },
        { status: 400 }
      )
    }

    if (!squadData.captainId) {
      return NextResponse.json(
        { error: 'Must have a captain selected' },
        { status: 400 }
      )
    }

    // Validate captain is in the squad
    const captainInSquad = squadData.players.some((p: { playerId?: string }) => p.playerId === squadData.captainId)
    if (!captainInSquad) {
      return NextResponse.json(
        { error: 'Captain must be in the squad' },
        { status: 400 }
      )
    }

    // Validate starting XI count
    const startingCount = squadData.players.filter((p: { isStarting?: boolean }) => p.isStarting).length
    if (startingCount !== 11) {
      return NextResponse.json(
        { error: 'Must have exactly 11 starting players' },
        { status: 400 }
      )
    }

    // Save the squad
    const squadId = await UserSquadService.saveUserSquad(squadData)

    return NextResponse.json({
      success: true,
      message: 'User squad saved successfully',
      squadId,
      data: {
        userId: squadData.userId,
        gameweekId: squadData.gameweekId,
        playersCount: squadData.players.length,
        captainId: squadData.captainId,
        formation: squadData.formation,
        totalValue: squadData.totalValue,
        isSubmitted: squadData.isSubmitted
      }
    })

  } catch (error) {
    console.error('Error saving user squad:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to save user squad',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const gameweekId = searchParams.get('gameweekId')
    const action = searchParams.get('action')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    // Get specific gameweek squad
    if (gameweekId) {
      const squad = await UserSquadService.getUserSquad(userId, parseInt(gameweekId))
      
      if (!squad) {
        return NextResponse.json(
          { error: 'Squad not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: squad
      })
    }

    // Get all user squads
    if (action === 'all') {
      const squads = await UserSquadService.getUserSquads(userId)
      
      return NextResponse.json({
        success: true,
        data: squads,
        count: squads.length
      })
    }

    return NextResponse.json(
      { error: 'Missing gameweekId parameter or action=all' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error fetching user squad:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user squad',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, gameweekId, action, ...updateData } = await request.json()

    if (!userId || !gameweekId) {
      return NextResponse.json(
        { error: 'Missing userId or gameweekId' },
        { status: 400 }
      )
    }

    // Submit squad
    if (action === 'submit') {
      await UserSquadService.submitSquad(userId, gameweekId)
      
      return NextResponse.json({
        success: true,
        message: 'Squad submitted successfully'
      })
    }

    // Update squad (re-save with new data)
    if (action === 'update') {
      const squadId = await UserSquadService.saveUserSquad({
        userId,
        gameweekId,
        ...updateData
      })

      return NextResponse.json({
        success: true,
        message: 'Squad updated successfully',
        squadId
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "submit" or "update"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating user squad:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update user squad',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const gameweekId = searchParams.get('gameweekId')

    if (!userId || !gameweekId) {
      return NextResponse.json(
        { error: 'Missing userId or gameweekId' },
        { status: 400 }
      )
    }

    await UserSquadService.deleteSquad(userId, parseInt(gameweekId))

    return NextResponse.json({
      success: true,
      message: 'Squad deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting user squad:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to delete user squad',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
