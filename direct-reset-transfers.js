const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, updateDoc, writeBatch, query, where } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClkUTQm1vdAGnGOpdFH9D0B-eF8Ql8CQI",
  authDomain: "fantasyleague-d9e1e.firebaseapp.com",
  projectId: "fantasyleague-d9e1e",
  storageBucket: "fantasyleague-d9e1e.firebasestorage.app",
  messagingSenderId: "1070940148478",
  appId: "1:1070940148478:web:a2e90f5ad61a3bbd649def"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetTransfersForOpenGameweek() {
  try {
    console.log('🚀 Starting transfer reset for open gameweek...');
    
    // Hardcode GW4 since we know it's open from your screenshot
    const openGameweek = 4;
    console.log(`🎯 Targeting open gameweek: GW${openGameweek}`);
    
    // Get all users
    console.log('👥 Fetching all users...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`📊 Found ${usersSnapshot.docs.length} users to update`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process users in smaller batches to avoid timeout
    const users = usersSnapshot.docs;
    const batchSize = 50;
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)} (${batch.length} users)`);
      
      // Process this batch
      for (const userDoc of batch) {
        const userId = userDoc.id;
        
        try {
          // Define the transfer state for this user
          const transferState = {
            savedFreeTransfers: 2,           // Set to 2 free transfers
            transfersMadeThisWeek: 0,        // Reset transfers made
            pointsDeductedThisWeek: 0,       // Reset deduction points to 0
            lastGameweekProcessed: openGameweek,
            wildcardActive: false,
            freeHitActive: false
          };
          
          // 1. Update/Create transfer document
          const transferDocRef = doc(db, 'transfers', `${userId}_${openGameweek}`);
          await setDoc(transferDocRef, {
            userId: userId,
            gameweekId: openGameweek,
            transferState: transferState,
            updatedAt: new Date(),
            resetBy: 'admin_script_direct'
          }, { merge: true });
          
          // 2. Update user's squad document if it exists
          try {
            const squadDocRef = doc(db, 'users', userId, 'squads', `gw${openGameweek}`);
            
            // Try to update the squad document
            await updateDoc(squadDocRef, {
              'transferState.freeTransfers': 2,
              'transferState.transferCost': 0,
              'transferState.transfersMade': 0,
              'transferState.pendingTransfers': [],
              transferCost: 0,
              lastUpdated: new Date(),
              resetBy: 'admin_script_direct'
            });
            
          } catch (squadError) {
            // Squad document might not exist yet, that's okay
            // console.log(`  ℹ️ No squad found for user ${userId} (normal for new users)`);
          }
          
          successCount++;
          
          if (successCount % 25 === 0) {
            console.log(`  ✅ Successfully updated ${successCount} users so far...`);
          }
          
        } catch (userError) {
          errorCount++;
          console.error(`  ❌ Error updating user ${userId}:`, userError.message);
        }
      }
      
      // Small delay between batches to avoid overwhelming Firestore
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 Transfer reset completed!');
    console.log('📊 Final Summary:');
    console.log(`   🎯 Gameweek: GW${openGameweek}`);
    console.log(`   ✅ Successfully updated: ${successCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    console.log(`   🎁 Free transfers set to: 2`);
    console.log(`   💰 Deduction points reset to: 0`);
    console.log(`   🔄 Transfers made reset to: 0`);
    
    if (errorCount === 0) {
      console.log('🌟 All users updated successfully!');
    } else {
      console.log(`⚠️ ${errorCount} users had errors but ${successCount} were updated successfully`);
    }
    
  } catch (error) {
    console.error('💥 Script failed with error:', error);
    throw error;
  }
}

// Run the script
console.log('🔧 Direct Transfer Reset Script Starting...');
resetTransfersForOpenGameweek()
  .then(() => {
    console.log('🏁 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
