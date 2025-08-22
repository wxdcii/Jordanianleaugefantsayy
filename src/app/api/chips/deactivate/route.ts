import { NextRequest, NextResponse } from 'next/server'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { userId, gameweekId } = await request.json()

    if (!userId || !gameweekId) {
      return NextResponse.json(
        { error: 'Missing userId or gameweekId' },
        { status: 400 }
      )
    }

    console.log(`🔄 Deactivating chips for user ${userId} after gameweek ${gameweekId}`)

    // Get user document
    const userDocRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const currentChips = userData.chips || {
      wildcard1: { gameweek: null, used: false, isActive: false },
      wildcard2: { gameweek: null, used: false, isActive: false },
      freeHit: { gameweek: null, used: false, isActive: false },
      benchBoost: { gameweek: null, used: false, isActive: false },
      tripleCaptain: { gameweek: null, used: false, isActive: false }
    }

    console.log('🎯 Current chips before deactivation:', currentChips)

    // Deactivate all active chips but keep them as used
    const updatedChips = { ...currentChips }
    let hasActiveChips = false

    Object.keys(updatedChips).forEach(chipKey => {
      const chip = updatedChips[chipKey as keyof typeof updatedChips]
      if (chip.isActive) {
        console.log(`🔄 Deactivating ${chipKey} (was active in gameweek ${chip.gameweek})`)
        chip.isActive = false
        // Keep used: true and gameweek number
        hasActiveChips = true
      }
    })

    if (!hasActiveChips) {
      console.log('ℹ️ No active chips to deactivate')
      return NextResponse.json({
        message: 'No active chips to deactivate',
        chipsUsed: currentChips
      })
    }

    // Update user document
    await updateDoc(userDocRef, {
      chips: updatedChips
    })

    console.log('✅ Chips deactivated successfully:', updatedChips)

    return NextResponse.json({
      message: 'Chips deactivated successfully',
      chipsUsed: updatedChips
    })

  } catch (error) {
    console.error('❌ Error deactivating chips:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate chips' },
      { status: 500 }
    )
  }
}
