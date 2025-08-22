const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAA5U81ZlnHeO0JSea-CwBX5jr013ZdCg8",
  authDomain: "jordanianfantasy-eef57.firebaseapp.com",
  projectId: "jordanianfantasy-eef57",
  storageBucket: "jordanianfantasy-eef57.firebasestorage.app",
  messagingSenderId: "112691197575",
  appId: "1:112691197575:web:8b4124608078dde3082a22"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

const logSuccess = (msg) => console.log(colors.green + msg + colors.reset);
const logError = (msg) => console.log(colors.red + msg + colors.reset);
const logWarning = (msg) => console.log(colors.yellow + msg + colors.reset);
const logInfo = (msg) => console.log(colors.blue + msg + colors.reset);
const logHeader = (msg) => console.log(colors.cyan + '\n============================================================' + colors.reset);

async function resetFantasyTeams() {
  logHeader();
  console.log(colors.cyan + '🔧 RESETTING FANTASY TEAMS TRANSFER STATE' + colors.reset);
  logHeader();
  
  try {
    logInfo('Fetching all fantasy teams from database...');
    
    const fantasyTeamsRef = collection(db, 'fantasyTeams');
    const fantasyTeamsSnapshot = await getDocs(fantasyTeamsRef);
    
    let totalTeams = 0;
    let updatedTeams = 0;
    let errors = 0;
    
    // Process teams in batches (Firestore batch limit is 500)
    let batch = writeBatch(db);
    let batchCount = 0;
    let totalBatches = 0;
    
    logSuccess(`Found ${fantasyTeamsSnapshot.size} fantasy teams to process`);
    logInfo('Starting reset operation...\n');
    
    for (const teamDoc of fantasyTeamsSnapshot.docs) {
      totalTeams++;
      const teamId = teamDoc.id;
      const teamData = teamDoc.data();
      
      try {
        let teamNeedsUpdate = false;
        let updateData = {};
        
        // Check current transferState
        const currentState = teamData.transferState || {};
        
        // Check if we need to update transferState fields
        if (currentState.savedFreeTransfers !== 2) {
          updateData['transferState.savedFreeTransfers'] = 2;
          teamNeedsUpdate = true;
        }
        
        if (currentState.pointsDeductedThisWeek !== 0) {
          updateData['transferState.pointsDeductedThisWeek'] = 0;
          teamNeedsUpdate = true;
        }
        
        if (currentState.transferCost !== 0) {
          updateData['transferState.transferCost'] = 0;
          teamNeedsUpdate = true;
        }
        
        // Also reset top-level transferCost if it exists
        if (teamData.transferCost !== 0) {
          updateData.transferCost = 0;
          teamNeedsUpdate = true;
        }
        
        if (teamNeedsUpdate) {
          batch.update(doc(db, 'fantasyTeams', teamId), updateData);
          batchCount++;
          updatedTeams++;
          
          logSuccess(`✅ Queued team ${teamId}: savedFreeTransfers=2, pointsDeductedThisWeek=0, transferCost=0`);
          
          // Commit batch every 450 operations (safe limit)
          if (batchCount >= 450) {
            await batch.commit();
            totalBatches++;
            logInfo(`📦 Committed batch ${totalBatches} (${batchCount} operations)`);
            
            // Create new batch
            batch = writeBatch(db);
            batchCount = 0;
          }
        } else {
          logInfo(`ℹ️ Team ${teamId} already has correct values`);
        }
        
      } catch (error) {
        logError(`❌ Error processing team ${teamId}: ${error.message}`);
        errors++;
      }
    }
    
    // Commit final batch if there are remaining operations
    if (batchCount > 0) {
      await batch.commit();
      totalBatches++;
      logInfo(`📦 Final batch ${totalBatches} committed (${batchCount} operations)`);
    }
    
    logHeader();
    console.log(colors.cyan + '🎉 FANTASY TEAMS RESET COMPLETED SUCCESSFULLY' + colors.reset);
    logHeader();
    
    console.log(colors.white + '📊 FINAL SUMMARY:' + colors.reset);
    console.log(`   👥 Teams analyzed: ${totalTeams}`);
    console.log(`   ✅ Teams updated: ${updatedTeams}`);
    console.log(`   📦 Total batches: ${totalBatches}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   🕒 Completed at: ${new Date().toLocaleString()}`);
    
    if (errors === 0) {
      logSuccess('🎉 All fantasy teams reset successfully!');
      console.log(colors.white + '📋 What was accomplished:' + colors.reset);
      console.log('   ✅ All teams have savedFreeTransfers = 2');
      console.log('   ✅ All teams have pointsDeductedThisWeek = 0');
      console.log('   ✅ All teams have transferCost = 0');
    }
    
  } catch (error) {
    logError(`Fatal error during fantasy teams reset: ${error.message}`);
    throw error;
  }
}

resetFantasyTeams().then(() => {
  console.log('\n✅ Fantasy teams reset completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
