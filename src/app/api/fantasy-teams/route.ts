import { NextRequest, NextResponse } from 'next/server'
import { fantasyTeamService } from '@/lib/firebaseServices'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      gameweekId,
      players,
      formation,
      chipsUsed,
      transferState,
      substitutions,
      totalValue,
      transferCost,
      deadline,
      isValid,
      validationErrors,
      teamName
    } = body

    console.log('Enhanced team save request:', {
      userId,
      gameweekId,
      playersCount: players?.length,
      formation,
      totalValue,
      transferCost,
      isValid
    })

    // Validate required fields
    if (!userId || !gameweekId || !players || !Array.isArray(players)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Enhanced validation
    if (players.length !== 15) {
      return NextResponse.json(
        { error: 'Must have exactly 15 players' },
        { status: 400 }
      )
    }

    const captainCount = players.filter((p: { isCaptain?: boolean }) => p.isCaptain).length
    if (captainCount !== 1) {
      return NextResponse.json(
        { error: 'Must have exactly one captain' },
        { status: 400 }
      )
    }

    const startingCount = players.filter((p: { isStarting?: boolean }) => p.isStarting).length
    if (startingCount !== 11) {
      return NextResponse.json(
        { error: 'Must have exactly 11 starting players' },
        { status: 400 }
      )
    }

    // Check if user already has a team, create if not
    let fantasyTeam = await fantasyTeamService.getUserTeam(userId)

    if (!fantasyTeam) {
      const newTeamId = await fantasyTeamService.createTeam({
        userId,
        teamName: teamName || `${userId}'s Team`,
        teamNameAr: teamName || `فريق ${userId}`,
        totalPoints: 0,
        budget: 100.0,
        freeTransfers: 1
      })

      fantasyTeam = await fantasyTeamService.getUserTeam(userId)
    }

    if (!fantasyTeam) {
      return NextResponse.json(
        { error: 'Failed to create or find fantasy team' },
        { status: 500 }
      )
    }

    // Save enhanced team selection for the gameweek
    await fantasyTeamService.saveTeamSelection(
      fantasyTeam.id,
      gameweekId,
      players
    )

    // Update team metadata with enhanced data
    const updates: Partial<Record<string, unknown>> = {
      formation,
      chipsUsed,
      transferState,
      substitutions,
      totalValue,
      transferCost,
      deadline,
      isValid,
      validationErrors,
      lastUpdated: new Date().toISOString()
    }

    await fantasyTeamService.updateTeam(fantasyTeam.id, updates)

    console.log('Enhanced team data saved successfully:', {
      fantasyTeamId: fantasyTeam.id,
      gameweekId,
      playersCount: players.length,
      totalValue,
      transferCost
    })

    return NextResponse.json({
      success: true,
      message: 'Team saved successfully',
      fantasyTeamId: fantasyTeam.id
    })

  } catch (error) {
    console.error('Error saving fantasy team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const gameweekId = searchParams.get('gameweekId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user's fantasy team
    const fantasyTeam = await fantasyTeamService.getUserTeam(userId)

    if (!fantasyTeam) {
      return NextResponse.json(
        { error: 'Fantasy team not found' },
        { status: 404 }
      )
    }

    let teamSelection = null
    if (gameweekId) {
      teamSelection = await fantasyTeamService.getTeamSelection(fantasyTeam.id, gameweekId)
    }

    return NextResponse.json({
      fantasyTeam,
      teamSelection
    })

  } catch (error) {
    console.error('Error fetching fantasy team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
