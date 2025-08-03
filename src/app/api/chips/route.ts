import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ChipsUsed, getDefaultChipsUsed } from '@/lib/fantasyLogic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, chipsUsed } = body

    if (!userId || !chipsUsed) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update user's chips in Firebase
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      chips: chipsUsed,
      lastActive: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Chips saved successfully'
    })

  } catch (error) {
    console.error('Error saving chips:', error)
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

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user's chips from Firebase
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const chipsUsed: ChipsUsed = userData.chips || getDefaultChipsUsed()

    return NextResponse.json({
      chipsUsed
    })

  } catch (error) {
    console.error('Error fetching chips:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Activate a specific chip
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, chipType, currentGameweek, activate } = body

    console.log('🎮 Chips API called:', {
      userId,
      chipType,
      currentGameweek,
      activate
    })

    if (!userId || !chipType || currentGameweek === undefined) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current chips
    const userRef = doc(db, 'users', userId)
    console.log('📄 Getting user document:', userRef.path)

    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      console.log('❌ User document not found')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const currentChips: ChipsUsed = userData.chips || getDefaultChipsUsed()

    console.log('🎯 Current chips state:', currentChips)
    console.log('🎮 Target chip:', chipType, currentChips[chipType as keyof ChipsUsed])

    // Validate chip activation
    if (activate) {
      console.log('✅ Validating chip activation...')

      // Check if chip is already used
      if (currentChips[chipType as keyof ChipsUsed].used) {
        console.log('❌ Chip already used this season')
        return NextResponse.json(
          { error: 'Chip already used this season' },
          { status: 400 }
        )
      }

      // Check if any chip is already active this gameweek
      const activeChips = Object.entries(currentChips).filter(([_, chip]) => chip.isActive)
      console.log('🔍 Currently active chips:', activeChips)

      const hasActiveChip = activeChips.length > 0

      if (hasActiveChip && !currentChips[chipType as keyof ChipsUsed].isActive) {
        console.log('❌ Another chip is already active')
        return NextResponse.json(
          { error: 'Another chip is already active this gameweek' },
          { status: 400 }
        )
      }

      // Rule 3: Special validation for wildcards based on gameweek windows
      if (chipType === 'wildcard1' && (currentGameweek < 2 || currentGameweek > 13)) {
        // Wildcard 1 only available in gameweeks 2-13
        return NextResponse.json(
          { error: 'Wildcard 1 can only be used in gameweeks 2-13' },
          { status: 400 }
        )
      }

      if (chipType === 'wildcard2' && (currentGameweek < 14 || currentGameweek > 27)) {
        // Wildcard 2 only available in gameweeks 14-27
        return NextResponse.json(
          { error: 'Wildcard 2 can only be used in gameweeks 14-27' },
          { status: 400 }
        )
      }

      // Rule 4: Cannot use wildcard or free hit in GW1
      if (currentGameweek === 1 && (chipType === 'wildcard1' || chipType === 'wildcard2' || chipType === 'freeHit')) {
        return NextResponse.json(
          { error: 'This chip cannot be used in Gameweek 1' },
          { status: 400 }
        )
      }
    }

    // Update chip status
    const updatedChips = { ...currentChips }
    
    if (activate) {
      // Deactivate all other chips first
      Object.keys(updatedChips).forEach(key => {
        const chipKey = key as keyof ChipsUsed
        if (updatedChips[chipKey].isActive) {
          updatedChips[chipKey] = { ...updatedChips[chipKey], isActive: false }
        }
      })

      // Activate the selected chip
      updatedChips[chipType as keyof ChipsUsed] = {
        used: true,
        gameweek: currentGameweek,
        isActive: true
      }
    } else {
      // Deactivate the chip
      updatedChips[chipType as keyof ChipsUsed] = {
        ...updatedChips[chipType as keyof ChipsUsed],
        isActive: false
      }
    }

    console.log('💾 Saving to Firebase...')
    console.log('📄 Updated chips:', updatedChips[chipType as keyof ChipsUsed])

    // Save to Firebase
    await updateDoc(userRef, {
      chips: updatedChips,
      lastActive: new Date()
    })

    // Chips saved successfully to database

    // Recalculate points for the current gameweek to include chip bonuses
    try {
      const { updateUserGameweekPoints } = await import('@/lib/firebase/realTimePointsUpdater.js')
      const pointsResult = await updateUserGameweekPoints(userId, currentGameweek)

      // Points recalculation completed (success or failure logged in updater)
    } catch (pointsError) {
      // Points calculation failed but chip activation still succeeded
      // Don't fail the chip activation if points calculation fails
    }

    return NextResponse.json({
      success: true,
      chipsUsed: updatedChips,
      message: activate ? 'Chip activated successfully' : 'Chip deactivated successfully'
    })

  } catch (error) {
    console.error('Error updating chip:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
