import { NextResponse } from 'next/server'
import { 
  updateAllUsersGameweekPoints
} from '../../../lib/firebase/realTimePointsUpdater.js'
import firebase from '../../../lib/firebase'; 

export async function POST(request) {
  try {
    const body = await request.json()
    let { gameweeks } = body

    // If no gameweeks specified, find the open gameweek from the database
    if (!gameweeks || !Array.isArray(gameweeks) || gameweeks.length === 0) {
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase')
      const gwSnapshot = await getDocs(collection(db, 'gameweeksDeadline'))
      const openGameweekDoc = gwSnapshot.docs.find(doc => doc.data().isOpen === true)
      if (openGameweekDoc) {
        gameweeks = [openGameweekDoc.data().gw]
      } else {
        return NextResponse.json({
          success: false,
          message: 'No open gameweek found.',
        }, { status: 400 })
      }
    }

    console.log(`📊 Updating gameweeks: ${gameweeks.join(', ')}`)

    const results = []
    let totalUsersUpdated = 0
    let totalErrors = 0

    // Update each gameweek (should be only the open one)
    for (const gameweek of gameweeks) {
      try {
        console.log(`🔄 Updating GW${gameweek}...`)
        const result = await updateAllUsersGameweekPoints(gameweek)
        if (result.success) {
          const successCount = result.results?.filter(r => r.success).length || 0
          totalUsersUpdated += successCount
          results.push({
            gameweek: gameweek,
            success: true,
            usersUpdated: successCount,
            totalUsers: result.results?.length || 0
          })
          console.log(`✅ GW${gameweek}: Updated ${successCount} users`)
        } else {
          totalErrors++
          results.push({
            gameweek: gameweek,
            success: false,
            error: result.message
          })
          console.error(`❌ GW${gameweek}: ${result.message}`)
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (gameweekError) {
        totalErrors++
        results.push({
          gameweek: gameweek,
          success: false,
          error: gameweekError.message
        })
        console.error(`❌ Error updating GW${gameweek}:`, gameweekError)
      }
    }

    // Update total points for all users: previous total + open gameweek points only
    console.log('🧮 Updating total points for all users...')
    try {
      const { collection, getDocs, getDoc, doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('../../../lib/firebase')
      const usersSnapshot = await getDocs(collection(db, 'users'))
      let totalPointsUpdated = 0
      const openGameweek = Math.max(...gameweeks)
      for (const userDoc of usersSnapshot.docs) {
        try {
          // Get previous total points from user profile
          const prevTotalPoints = userDoc.data().totalPoints || 0

          // Get open gameweek points for this user
          const gwPointsDocRef = doc(db, 'users', userDoc.id, 'gameweekPoints', String(openGameweek))
          const gwPointsDoc = await getDoc(gwPointsDocRef)
          const openGWPoints = gwPointsDoc.exists() ? gwPointsDoc.data().points || 0 : 0

          // Add open gameweek points to previous total
          const newTotalPoints = prevTotalPoints + openGWPoints

          // Save new total points to user profile
          await updateDoc(doc(db, 'users', userDoc.id), { totalPoints: newTotalPoints })

          totalPointsUpdated++
        } catch (userError) {
          console.warn(`Error updating total points for user ${userDoc.id}:`, userError)
        }
      }
      console.log(`✅ Updated total points for ${totalPointsUpdated} users`)

      // --- RANKING LOGIC ---
      // Fetch all users again and sort by totalPoints descending
      const rankedSnapshot = await getDocs(collection(db, 'users'))
      const rankedUsers = rankedSnapshot.docs
        .map(doc => ({
          userId: doc.id,
          totalPoints: doc.data().totalPoints || 0
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints)

      // Optionally, update each user's rank in Firestore
      for (let i = 0; i < rankedUsers.length; i++) {
        const user = rankedUsers[i]
        try {
          await updateDoc(doc(db, 'users', user.userId), { rank: i + 1 })
        } catch (rankError) {
          console.warn(`Error updating rank for user ${user.userId}:`, rankError)
        }
      }

      return NextResponse.json({
        success: true,
        message: `Points and ranking updated!`,
        data: {
          gameweeksUpdated: gameweeks.length,
          totalUsersUpdated: totalUsersUpdated,
          totalPointsUpdated: totalPointsUpdated,
          totalErrors: totalErrors,
          results: results,
          ranking: rankedUsers.map((u, idx) => ({
            userId: u.userId,
            totalPoints: u.totalPoints,
            rank: idx + 1
          })),
          summary: {
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
          }
        }
      })
    } catch (totalPointsError) {
      console.error('Error updating total points:', totalPointsError)
      return NextResponse.json({
        success: true,
        message: `Gameweek points updated but error updating total points: ${totalPointsError.message}`,
        data: {
          gameweeksUpdated: gameweeks.length,
          totalUsersUpdated: totalUsersUpdated,
          totalErrors: totalErrors + 1,
          results: results,
          totalPointsError: totalPointsError.message
        }
      })
    }
  } catch (error) {
    console.error('Error in bulk points refresh:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error during points refresh',
      error: error.message
    }, { status: 500 })
  }
}