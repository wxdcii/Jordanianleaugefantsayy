
import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore'

interface Match {
  homeTeam: string;
  awayTeam: string;
  homeTeam_ar?: string;
  awayTeam_ar?: string;
  date: string;
  time: string;
  stadium: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: string;
  createdAt?: string;
  lastUpdated?: string;
  [key: string]: unknown;
}

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameweek = searchParams.get('gameweek')
    const status = searchParams.get('status') // scheduled, live, finished
    
    if (gameweek) {
      // Get matches for specific gameweek
      const gameweekRef = doc(db, 'gameweeks', `gw${gameweek}`)
      const gameweekDoc = await getDoc(gameweekRef)
      
      if (!gameweekDoc.exists()) {
        return NextResponse.json(
          { error: 'Gameweek not found' },
          { status: 404 }
        )
      }
      
      const gameweekData = gameweekDoc.data()
      let fixtures = gameweekData.fixtures || []
      
      // Filter by status if provided
      if (status) {
        fixtures = fixtures.filter((fixture: { status?: string }) => fixture.status === status)
      }
      
      return NextResponse.json({
        gameweek: gameweekData.number,
        fixtures: fixtures
      })
    } else {
      // Get all matches from all gameweeks
      const gameweeksRef = collection(db, 'gameweeks')
      const snapshot = await getDocs(gameweeksRef)
      
      interface Match {
        homeTeam: string;
        awayTeam: string;
        homeTeam_ar?: string;
        awayTeam_ar?: string;
        date: string;
        time: string;
        stadium: string;
        homeScore?: number | null;
        awayScore?: number | null;
        status: string;
        createdAt?: string;
        lastUpdated?: string;
        [key: string]: unknown;
      }
      const allMatches: Match[] = []
      
      snapshot.forEach(doc => {
        const gameweekData = doc.data()
        const fixtures = gameweekData.fixtures || []
        
        fixtures.forEach((fixture: Match) => {
          allMatches.push({
            ...fixture,
            gameweek: gameweekData.number,
            gameweekId: doc.id
          })
        })
      })
      
      // Filter by status if provided
      let filteredMatches = allMatches
      if (status) {
        filteredMatches = allMatches.filter((match: Match) => match.status === status)
      }
      
      return NextResponse.json({
        total: filteredMatches.length,
        matches: filteredMatches
      })
    }
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      gameweekId,
      matchIndex,
      homeScore,
      awayScore,
      status
    } = body

    // Validate required fields
    if (!gameweekId || matchIndex === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: gameweekId and matchIndex' },
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
    const fixtures: Match[] = [...(gameweekData.fixtures || [])]

    if (matchIndex >= fixtures.length || matchIndex < 0) {
      return NextResponse.json(
        { error: 'Invalid match index' },
        { status: 400 }
      )
    }

    // Update the specific match
    const updatedMatch: Match = {
      ...fixtures[matchIndex],
      homeScore: homeScore !== undefined ? homeScore : fixtures[matchIndex].homeScore,
      awayScore: awayScore !== undefined ? awayScore : fixtures[matchIndex].awayScore,
      status: status || fixtures[matchIndex].status,
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
      match: updatedMatch
    })

  } catch (error) {
    console.error('Error updating match result:', error)
    return NextResponse.json(
      { error: 'Failed to update match result' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      gameweekId,
      homeTeam,
      awayTeam,
      homeTeam_ar,
      awayTeam_ar,
      date,
      time,
      stadium,
      homeScore = null,
      awayScore = null,
      status = "scheduled"
    } = body

    // Validate required fields
    if (!gameweekId || !homeTeam || !awayTeam || !date || !time || !stadium) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    const fixtures: Match[] = [...(gameweekData.fixtures || [])]

    // Create new match
    const newMatch: Match = {
      homeTeam,
      awayTeam,
      homeTeam_ar: homeTeam_ar || homeTeam,
      awayTeam_ar: awayTeam_ar || awayTeam,
      date,
      time,
      stadium,
      homeScore,
      awayScore,
      status,
      createdAt: new Date().toISOString()
    }

    fixtures.push(newMatch)

    // Update the gameweek document
    await updateDoc(gameweekRef, {
      fixtures: fixtures,
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Match added successfully',
      match: newMatch
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding match:', error)
    return NextResponse.json(
      { error: 'Failed to add match' },
      { status: 500 }
    )
  }
}
