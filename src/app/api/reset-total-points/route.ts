import { NextResponse } from 'next/server'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'

export async function POST(request: Request) {
  try {
    console.log('🔄 Starting total points reset...')
    
    // Get all users from the users collection
    const usersSnapshot = await getDocs(collection(db, 'users'))
    
    if (usersSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'No users found in the database'
      }, { status: 404 })
    }

    let updatedCount = 0
    let errorCount = 0
    const results = []

    // Reset total points for each user
    for (const userDoc of usersSnapshot.docs) {
      try {
        const userId = userDoc.id
        const userData = userDoc.data()
        const currentTotalPoints = userData.totalPoints || 0

        // Update the user document to set totalPoints to 0
        await updateDoc(doc(db, 'users', userId), {
          totalPoints: 0
        })

        results.push({
          userId,
          success: true,
          previousPoints: currentTotalPoints,
          newPoints: 0
        })

        updatedCount++
        console.log(`✅ Reset points for user ${userId}: ${currentTotalPoints} → 0`)

      } catch (userError) {
        console.error(`❌ Error resetting points for user ${userDoc.id}:`, userError)
        results.push({
          userId: userDoc.id,
          success: false,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        })
        errorCount++
      }
    }

    console.log(`🏁 Reset complete: ${updatedCount} users updated, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Successfully reset total points for ${updatedCount} users`,
      data: {
        totalUsersProcessed: usersSnapshot.docs.length,
        successfulUpdates: updatedCount,
        errors: errorCount,
        results: results,
        resetTimestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error in reset total points:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error during points reset',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
