#!/usr/bin/env node

// Script to fix users who got double points due to duplicate processing
import { initializeApp } from 'firebase/app'
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  updateDoc,
  writeBatch
} from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7UkB8aDHfYU3t4LvRXQUy12YO1lbY5VA",
  authDomain: "fantasy-football-6a8ac.firebaseapp.com",
  projectId: "fantasy-football-6a8ac",
  storageBucket: "fantasy-football-6a8ac.appspot.com",
  messagingSenderId: "100735739662",
  appId: "1:100735739662:web:e2c45eafd1e59bb23c8b01"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Set this to the gameweek that was processed twice
const DOUBLED_GAMEWEEK = 2

async function fixDoublePointsIssue() {
  console.log('🔧 FIXING DOUBLE POINTS ISSUE')
  console.log('='.repeat(50))
  console.log(`🎯 Target gameweek: GW${DOUBLED_GAMEWEEK}`)

  try {
    // Get all users
    const usersRef = collection(db, 'users')
    const usersSnapshot = await getDocs(usersRef)
    
    console.log(`👥 Found ${usersSnapshot.docs.length} users to check`)

    const batch = writeBatch(db)
    let fixedUsers = 0
    let batchCount = 0

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      const userData = userDoc.data()
      
      try {
        // Check if user was processed for this gameweek
        const wasProcessed = userData[`gw${DOUBLED_GAMEWEEK}Processed`]
        
        if (!wasProcessed) {
          console.log(`⏭️  User ${userId}: Not processed for GW${DOUBLED_GAMEWEEK}, skipping`)
          continue
        }

        // Get current total points
        const currentTotal = userData.totalPoints || 0
        
        // Get the gameweek points that were added
        const openGWPoints = userData.openGameweekPoints || 0
        
        // If openGameweek matches the doubled gameweek, subtract one instance
        if (userData.openGameweek === DOUBLED_GAMEWEEK && openGWPoints > 0) {
          const correctedTotal = currentTotal - openGWPoints
          
          console.log(`🔧 User ${userId}: ${currentTotal} - ${openGWPoints} = ${correctedTotal}`)
          
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

    console.log('\n📊 SUMMARY:')
    console.log(`✅ Fixed ${fixedUsers} users who had double points`)
    console.log(`🎯 Gameweek: GW${DOUBLED_GAMEWEEK}`)
    console.log(`🔧 Users can now be processed correctly again`)

  } catch (error) {
    console.error('❌ Error fixing double points:', error)
  }
}

// Run the fix
fixDoublePointsIssue().then(() => {
  console.log('\n✅ Double points fix completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Fix failed:', error)
  process.exit(1)
})
