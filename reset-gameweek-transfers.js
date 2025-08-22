const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } = require('firebase/firestore');

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

async function getCurrentOpenGameweek() {
  try {
    const gameweeksRef = collection(db, 'gameweeksDeadline');
    const snapshot = await getDocs(gameweeksRef);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.isOpen) {
        console.log(`🎯 Found open gameweek: GW${data.gw}`);
        return data.gw;
      }
    }
    
    console.log('⚠️ No open gameweek found');
    return null;
  } catch (error) {
    console.error('Error finding open gameweek:', error);
    return null;
  }
}

async function resetAllUsersTransfers() {
  try {
    console.log('🚀 Starting transfer reset for all users...');
    
    // Get current open gameweek
    const openGameweek = await getCurrentOpenGameweek();
    if (!openGameweek) {
      console.log('❌ No open gameweek found. Cannot proceed.');
      return;
    }
    
    console.log(`📊 Resetting transfers for open gameweek: GW${openGameweek}`);
    
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`👥 Found ${usersSnapshot.docs.length} users to update`);
    
    // Process users in batches of 500 (Firestore limit)
    const batch = writeBatch(db);
    let batchCount = 0;
    let totalUpdated = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        // Update user's transfer state via API endpoint
        const transferStateUpdate = {
          savedFreeTransfers: 2, // Set to 2 free transfers
          transfersMadeThisWeek: 0, // Reset transfers made
          pointsDeductedThisWeek: 0, // Reset deduction points
          lastGameweekProcessed: openGameweek,
          wildcardActive: false,
          freeHitActive: false
        };
        
        // Update transfer state in transfers collection
        const transferDocRef = doc(db, 'transfers', `${userId}_${openGameweek}`);
        batch.set(transferDocRef, {
          userId: userId,
          gameweekId: openGameweek,
          transferState: transferStateUpdate,
          updatedAt: new Date(),
          resetBy: 'admin_script'
        }, { merge: true });
        
        // Update user document to mark as reset
        const userDocRef = doc(db, 'users', userId);
        batch.update(userDocRef, {
          [`transfersReset_GW${openGameweek}`]: true,
          lastTransferReset: new Date(),
          resetBy: 'admin_script'
        });
        
        batchCount++;
        totalUpdated++;
        
        // Execute batch when it reaches 450 operations (leaving room for safety)
        if (batchCount >= 450) {
          console.log(`💾 Committing batch of ${batchCount} operations...`);
          await batch.commit();
          
          // Create new batch
          const newBatch = writeBatch(db);
          Object.assign(batch, newBatch);
          batchCount = 0;
          
          console.log(`✅ Updated ${totalUpdated} users so far...`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating user ${userId}:`, error);
      }
    }
    
    // Commit any remaining operations
    if (batchCount > 0) {
      console.log(`💾 Committing final batch of ${batchCount} operations...`);
      await batch.commit();
    }
    
    console.log(`🎉 Transfer reset completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Gameweek: GW${openGameweek}`);
    console.log(`   - Total users updated: ${totalUpdated}`);
    console.log(`   - Free transfers set to: 2`);
    console.log(`   - Deduction points reset to: 0`);
    console.log(`   - Transfers made reset to: 0`);
    
    // Also update any existing squad data to reflect the reset
    console.log('🔄 Updating existing squad data...');
    await updateExistingSquads(openGameweek);
    
  } catch (error) {
    console.error('💥 Error during transfer reset:', error);
  }
}

async function updateExistingSquads(gameweek) {
  try {
    // Get all users again to update their squad data
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let squadUpdates = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      try {
        // Check if user has a squad for this gameweek
        const squadRef = doc(db, 'users', userId, 'squads', `gw${gameweek}`);
        const squadDoc = await squadRef.get();
        
        if (squadDoc.exists()) {
          const squadData = squadDoc.data();
          
          // Update squad's transfer state
          await updateDoc(squadRef, {
            'transferState.freeTransfers': 2,
            'transferState.transferCost': 0,
            'transferState.transfersMade': 0,
            'transferState.pendingTransfers': [],
            transferCost: 0,
            lastUpdated: new Date(),
            resetBy: 'admin_script'
          });
          
          squadUpdates++;
        }
      } catch (error) {
        console.warn(`⚠️ Could not update squad for user ${userId}:`, error.message);
      }
    }
    
    console.log(`✅ Updated ${squadUpdates} existing squad documents`);
    
  } catch (error) {
    console.error('❌ Error updating existing squads:', error);
  }
}

// Run the script
resetAllUsersTransfers().then(() => {
  console.log('🏁 Script completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
