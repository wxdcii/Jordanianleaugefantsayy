import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const { targetGameweek = 4 } = await request.json()
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const users = usersSnapshot.docs
    
    let successCount = 0
    const results = []
    
    for (const userDoc of users) {
      const userId = userDoc.id
      
      try {
        // Reset transfer state
        const transferState = {
          savedFreeTransfers: 2,
          transfersMadeThisWeek: 0,
          pointsDeductedThisWeek: 0,
          lastGameweekProcessed: targetGameweek,
          wildcardActive: false,
          freeHitActive: false
        }
        
        // Update transfers collection
        await setDoc(doc(db, 'transfers', `${userId}_${targetGameweek}`), {
          userId: userId,
          gameweekId: targetGameweek,
          transferState: transferState,
          updatedAt: serverTimestamp(),
          resetBy: 'admin_api'
        }, { merge: true })
        
        successCount++
        results.push({ userId, status: 'success' })
        
      } catch (error) {
        results.push({ 
          userId, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Reset completed for ${successCount} users`,
      totalUsers: users.length,
      successCount,
      results
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}