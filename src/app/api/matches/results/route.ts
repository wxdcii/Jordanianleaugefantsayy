import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      gameweekId,
      matchIndex,
      homeScore,
      awayScore,
      status = "finished"
    } = body

    // Validate required fields
    if (!gameweekId || matchIndex === undefined || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: gameweekId, matchIndex, homeScore, awayScore' },
        { status: 400 }
      )
    }

    // Validate scores are numbers
    if (typeof homeScore !== 'number' || typeof awayScore !== 'number' || homeScore < 0 || awayScore < 0) {
      return NextResponse.json(
        { error: 'Scores must be non-negative numbers' },
        { status: 400 }
      )
    }

    // Get the gameweek document
    const gameweekRef = doc(db, 'gameweeks', gameweekId)
    const gameweekDoc = await getDoc(gameweekRef)

    if (!gameweekDoc.exists()) {
      return NextResponse.json(
        { error: 'Gameweek not found' },
        { status: 404 }
      )
    }

    const gameweekData = gameweekDoc.data()
    const fixtures = [...(gameweekData.fixtures || [])]

    if (matchIndex >= fixtures.length || matchIndex < 0) {
      return NextResponse.json(
        { error: 'Invalid match index' },
        { status: 400 }
      )
    }

    // Update the specific match with result
    const updatedMatch = {
      ...fixtures[matchIndex],
      homeScore: homeScore,
      awayScore: awayScore,
      status: status,
      resultUpdatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    fixtures[matchIndex] = updatedMatch

    // Update the gameweek document
    await updateDoc(gameweekRef, {
      fixtures: fixtures,
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Match result updated successfully',
      match: updatedMatch,
      result: `${updatedMatch.homeTeam} ${homeScore} - ${awayScore} ${updatedMatch.awayTeam}`
    })

  } catch (error) {
    console.error('Error updating match result:', error)
    return NextResponse.json(
      { error: 'Failed to update match result' },
      { status: 500 }
    )
  }
}

// Batch update multiple match results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { results } = body

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: 'Results must be a non-empty array' },
        { status: 400 }
      )
    }

    const updatedMatches = []
    const errors = []

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const { gameweekId, matchIndex, homeScore, awayScore, status = "finished" } = result

      try {
        // Validate each result
        if (!gameweekId || matchIndex === undefined || homeScore === undefined || awayScore === undefined) {
          errors.push(`Result ${i}: Missing required fields`)
          continue
        }

        if (typeof homeScore !== 'number' || typeof awayScore !== 'number' || homeScore < 0 || awayScore < 0) {
          errors.push(`Result ${i}: Invalid scores`)
          continue
        }

        // Get the gameweek document
        const gameweekRef = doc(db, 'gameweeks', gameweekId)
        const gameweekDoc = await getDoc(gameweekRef)

        if (!gameweekDoc.exists()) {
          errors.push(`Result ${i}: Gameweek not found`)
          continue
        }

        const gameweekData = gameweekDoc.data()
        const fixtures = [...(gameweekData.fixtures || [])]

        if (matchIndex >= fixtures.length || matchIndex < 0) {
          errors.push(`Result ${i}: Invalid match index`)
          continue
        }

        // Update the specific match
        const updatedMatch = {
          ...fixtures[matchIndex],
          homeScore: homeScore,
          awayScore: awayScore,
          status: status,
          resultUpdatedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }

        fixtures[matchIndex] = updatedMatch

        // Update the gameweek document
        await updateDoc(gameweekRef, {
          fixtures: fixtures,
          updatedAt: new Date()
        })

        updatedMatches.push({
          gameweekId,
          matchIndex,
          match: updatedMatch,
          result: `${updatedMatch.homeTeam} ${homeScore} - ${awayScore} ${updatedMatch.awayTeam}`
        })

      } catch (error) {
        errors.push(`Result ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedMatches.length} match results`,
      updatedMatches,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: results.length,
        successful: updatedMatches.length,
        failed: errors.length
      }
    })

  } catch (error) {
    console.error('Error batch updating match results:', error)
    return NextResponse.json(
      { error: 'Failed to batch update match results' },
      { status: 500 }
    )
  }
}
