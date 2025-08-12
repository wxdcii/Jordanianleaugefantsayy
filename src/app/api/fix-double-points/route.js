import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { collection, getDocs, doc, updateDoc, writeBatch } = await import('firebase/firestore')
    const { db } = await import('../../../lib/firebase')
    
    console.log('🔧 FIXING DOUBLE POINTS ISSUE')
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'))
    console.log(`👥 Found ${usersSnapshot.docs.length} users to check`)

    const batch = writeBatch(db)
    let fixedUsers = 0
    let batchCount = 0
    const DOUBLED_GAMEWEEK = 2

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      const userData = userDoc.data()
      
      try {
        // Check if user has double points (totalPoints = openGameweekPoints * 2)
        const totalPoints = userData.totalPoints || 0
        const openGWPoints = userData.openGameweekPoints || 0
        const openGameweek = userData.openGameweek
        
        // If total points equals double the open gameweek points, they got doubled
        if (openGameweek === DOUBLED_GAMEWEEK && totalPoints === openGWPoints * 2 && openGWPoints > 0) {
          
          // Fix: set total points to just the open gameweek points
          const correctedTotal = openGWPoints
          
          console.log(`🔧 User ${userId}: ${totalPoints} → ${correctedTotal} (removed duplicate ${openGWPoints})`)
          
          // Update user document
          const userRef = doc(db, 'users', userId)
          batch.update(userRef, {
            totalPoints: correctedTotal,
            lastPointsUpdate: new Date(),
            [`gw${DOUBLED_GAMEWEEK}Processed`]: false, // Reset the flag
            fixedDoublePoints: true // Mark as fixed
          })
          
          fixedUsers++
          batchCount++
          
          // Execute batch when it reaches size limit
          if (batchCount >= 500) {
            await batch.commit()
            console.log(`📦 Batch executed (${batchCount} users fixed)`)
            batchCount = 0
          }
        }

      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error)
      }
    }

    // Execute remaining batch
    if (batchCount > 0) {
      await batch.commit()
      console.log(`📦 Final batch executed (${batchCount} users fixed)`)
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedUsers} users who had double points`,
      data: {
        usersFixed: fixedUsers,
        gameweek: DOUBLED_GAMEWEEK
      }
    })

  } catch (error) {
    console.error('❌ Error fixing double points:', error)
    return NextResponse.json({
      success: false,
      message: 'Error fixing double points',
      error: error.message
    }, { status: 500 })
  }
}
