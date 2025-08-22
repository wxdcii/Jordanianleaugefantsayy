// Copy and paste this into your browser console while on your fantasy app
// Make sure you're logged in as an admin user

async function resetAllUsersForGW4() {
  console.log('🚀 Starting transfer reset for GW4...');
  
  try {
    // Import Firebase if not already available
    if (typeof firebase === 'undefined') {
      console.log('❌ Firebase not available. Make sure you\'re on your fantasy app page.');
      return;
    }
    
    const db = firebase.firestore();
    
    // Get all users
    console.log('👥 Fetching all users...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.docs.length} users`);
    
    let successCount = 0;
    let errorCount = 0;
    const targetGameweek = 4;
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      try {
        // Create the transfer state
        const transferState = {
          savedFreeTransfers: 2,
          transfersMadeThisWeek: 0,
          pointsDeductedThisWeek: 0,
          lastGameweekProcessed: targetGameweek,
          wildcardActive: false,
          freeHitActive: false
        };
        
        // Update transfers collection
        await db.collection('transfers').doc(`${userId}_${targetGameweek}`).set({
          userId: userId,
          gameweekId: targetGameweek,
          transferState: transferState,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          resetBy: 'browser_console'
        }, { merge: true });
        
        // Update squad if exists
        try {
          const squadRef = db.collection('users').doc(userId).collection('squads').doc(`gw${targetGameweek}`);
          const squadDoc = await squadRef.get();
          
          if (squadDoc.exists()) {
            await squadRef.update({
              'transferState.freeTransfers': 2,
              'transferState.transferCost': 0,
              'transferState.transfersMade': 0,
              'transferState.pendingTransfers': [],
              transferCost: 0,
              lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
              resetBy: 'browser_console'
            });
          }
        } catch (squadError) {
          // Squad might not exist, that's okay
        }
        
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`✅ Updated ${successCount} users...`);
        }
        
      } catch (userError) {
        errorCount++;
        console.error(`❌ Error updating user ${userId}:`, userError);
      }
    }
    
    console.log('\n🎉 Reset completed!');
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log('🎁 All users now have:');
    console.log('   - 2 free transfers');
    console.log('   - 0 deduction points');
    console.log('   - 0 transfers made this week');
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run the function
resetAllUsersForGW4();
