// Database cleanup script to fix duplicated transfer fields
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDfI-0HEJJaJmKZfM00w8U3mhqT1S5ZZMU",
  authDomain: "jordaniian-fantasy-league.firebaseapp.com",
  projectId: "jordaniian-fantasy-league",
  storageBucket: "jordaniian-fantasy-league.firebasestorage.app",
  messagingSenderId: "461511420262",
  appId: "1:461511420262:web:fb0b8f2ce6e8f8ad14a8d8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupTransferFields() {
  console.log('🧹 Starting transfer fields cleanup...');
  
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    let processedUsers = 0;
    let updatedUsers = 0;
    
    for (const userDoc of snapshot.docs) {
      processedUsers++;
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`\n👤 Processing user ${userId} (${processedUsers}/${snapshot.size})`);
      
      // Check for old/duplicate transfer fields
      const hasOldTransferCost = 'transferCost' in userData;
      const hasOldFreeTransfers = 'freeTransfers' in userData;
      const hasOldTransfersMade = 'transfersMade' in userData;
      const hasPendingTransfers = 'pendingTransfers' in userData;
      
      // Check transferState structure
      const currentTransferState = userData.transferState;
      const hasTransferState = !!currentTransferState;
      
      console.log(`📊 Transfer fields analysis:`, {
        hasOldTransferCost,
        hasOldFreeTransfers,
        hasOldTransfersMade,
        hasPendingTransfers,
        hasTransferState,
        currentTransferState: currentTransferState ? {
          savedFreeTransfers: currentTransferState.savedFreeTransfers,
          transfersMadeThisWeek: currentTransferState.transfersMadeThisWeek,
          pointsDeductedThisWeek: currentTransferState.pointsDeductedThisWeek,
          wildcardActive: currentTransferState.wildcardActive,
          lastGameweekProcessed: currentTransferState.lastGameweekProcessed
        } : 'missing'
      });
      
      // Determine if update is needed
      const needsUpdate = hasOldTransferCost || hasOldFreeTransfers || hasOldTransfersMade || hasPendingTransfers || !hasTransferState;
      
      if (needsUpdate) {
        console.log(`🔧 User needs cleanup`);
        updatedUsers++;
        
        // Create clean transfer state
        const cleanTransferState = {
          savedFreeTransfers: currentTransferState?.savedFreeTransfers || 1,
          transfersMadeThisWeek: currentTransferState?.transfersMadeThisWeek || 0,
          pointsDeductedThisWeek: currentTransferState?.pointsDeductedThisWeek || 0,
          wildcardActive: currentTransferState?.wildcardActive || false,
          freeHitActive: currentTransferState?.freeHitActive || false,
          lastGameweekProcessed: currentTransferState?.lastGameweekProcessed || 4
        };
        
        // Prepare update object
        const updateData = {
          transferState: cleanTransferState,
          lastUpdated: new Date()
        };
        
        // Remove old fields
        if (hasOldTransferCost) updateData.transferCost = null;
        if (hasOldFreeTransfers) updateData.freeTransfers = null;
        if (hasOldTransfersMade) updateData.transfersMade = null;
        if (hasPendingTransfers) updateData.pendingTransfers = null;
        
        console.log(`✅ Updating user with clean state:`, cleanTransferState);
        
        await updateDoc(doc(db, 'users', userId), updateData);
        
        console.log(`✅ User ${userId} updated successfully`);
      } else {
        console.log(`✅ User already has clean transfer state`);
      }
    }
    
    console.log(`\n🎉 Cleanup complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total users processed: ${processedUsers}`);
    console.log(`   - Users updated: ${updatedUsers}`);
    console.log(`   - Users already clean: ${processedUsers - updatedUsers}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupTransferFields();
