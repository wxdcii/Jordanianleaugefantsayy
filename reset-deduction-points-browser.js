// Browser-based script to reset deduction points for GW2
// Run this in the Firebase console or browser developer tools

const CURRENT_GAMEWEEK = 2;

async function resetDeductionPointsInBrowser() {
  // This assumes you're already authenticated in Firebase console
  const db = firebase.firestore();
  
  console.log(`🔄 Starting deduction points reset for GW${CURRENT_GAMEWEEK}...`);
  
  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    let totalUsers = 0;
    let updatedUsers = 0;
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      totalUsers++;
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log(`📝 Processing user: ${userId}`);
      
      try {
        // Reset main user transferState
        if (userData.transferState) {
          await db.collection('users').doc(userId).update({
            'transferState.pointsDeductedThisWeek': 0
          });
          console.log(`✅ Reset transferState for user ${userId}`);
        }
        
        // Reset squad transferState for current gameweek
        try {
          await db.collection('users').doc(userId)
            .collection('squads').doc(`gw${CURRENT_GAMEWEEK}`)
            .update({
              'transferState.transferCost': 0,
              'transferState.pointsDeducted': 0,
              transferCost: 0
            });
          console.log(`✅ Reset squad transferState for user ${userId} GW${CURRENT_GAMEWEEK}`);
        } catch (squadError) {
          console.log(`⚠️ No squad found for user ${userId} GW${CURRENT_GAMEWEEK}`);
        }
        
        updatedUsers++;
        
      } catch (userError) {
        console.error(`❌ Error updating user ${userId}:`, userError);
      }
    }
    
    // Also reset GameweekPoints collection
    console.log('\n🔄 Resetting GameweekPoints collection...');
    const gameweekPointsSnapshot = await db.collection('GameweekPoints')
      .where('gameweekId', '==', CURRENT_GAMEWEEK)
      .get();
    
    let pointsUpdated = 0;
    for (const pointsDoc of gameweekPointsSnapshot.docs) {
      try {
        await db.collection('GameweekPoints').doc(pointsDoc.id).update({
          transferCost: 0,
          pointsDeducted: 0
        });
        pointsUpdated++;
        console.log(`✅ Reset GameweekPoints for ${pointsDoc.data().userId}`);
      } catch (error) {
        console.error(`❌ Error updating GameweekPoints ${pointsDoc.id}:`, error);
      }
    }
    
    console.log('\n📊 Reset Summary:');
    console.log(`Total users processed: ${totalUsers}`);
    console.log(`Successfully updated users: ${updatedUsers}`);
    console.log(`GameweekPoints records updated: ${pointsUpdated}`);
    console.log(`✅ Deduction points reset completed for GW${CURRENT_GAMEWEEK}!`);
    
    return {
      totalUsers,
      updatedUsers,
      pointsUpdated
    };
    
  } catch (error) {
    console.error('💥 Error during reset:', error);
    throw error;
  }
}

// Run the function
resetDeductionPointsInBrowser()
  .then(result => {
    console.log('🎉 Reset completed successfully!', result);
  })
  .catch(error => {
    console.error('💥 Reset failed:', error);
  });
