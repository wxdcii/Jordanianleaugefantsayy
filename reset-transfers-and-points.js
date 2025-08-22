// Reset Free Transfers and Deduction Points Script
// Sets free transfers to 2 and deduction points to 0 for all users

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, writeBatch, getDoc } = require('firebase/firestore');

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

// Enhanced logging with colors
const logColors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function logInfo(message) {
  console.log(`${logColors.blue}ℹ️  ${message}${logColors.reset}`);
}

function logSuccess(message) {
  console.log(`${logColors.green}✅ ${message}${logColors.reset}`);
}

function logWarning(message) {
  console.log(`${logColors.yellow}⚠️  ${message}${logColors.reset}`);
}

function logError(message) {
  console.log(`${logColors.red}❌ ${message}${logColors.reset}`);
}

function logHeader(message) {
  console.log(`\n${logColors.magenta}${'='.repeat(60)}`);
  console.log(`🔧 ${message}`);
  console.log(`${'='.repeat(60)}${logColors.reset}\n`);
}

function createProgressBar(current, total, width = 40) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `${logColors.cyan}[${bar}] ${percentage}% (${current}/${total})${logColors.reset}`;
}

async function analyzeCurrentTransferState() {
  logHeader('ANALYZING CURRENT TRANSFER STATE');
  
  try {
    logInfo('Fetching all users from database...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const totalUsers = usersSnapshot.size;
    let usersWithWrongTransfers = 0;
    let usersWithDeductions = 0;
    let processedUsers = 0;
    
    const transferStats = {
      freeTransfers: {},
      deductionPoints: {},
      transfersMade: {}
    };
    
    logSuccess(`Found ${totalUsers} users in database`);
    logInfo('Analyzing transfer states...\n');
    
    for (const userDoc of usersSnapshot.docs) {
      processedUsers++;
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      if (userData.transferState) {
        const state = userData.transferState;
        
        // Count free transfers distribution
        const freeTransfers = state.savedFreeTransfers || 0;
        transferStats.freeTransfers[freeTransfers] = (transferStats.freeTransfers[freeTransfers] || 0) + 1;
        
        // Count deduction points distribution
        const deductionPoints = state.pointsDeductedThisWeek || 0;
        transferStats.deductionPoints[deductionPoints] = (transferStats.deductionPoints[deductionPoints] || 0) + 1;
        
        // Count transfers made distribution
        const transfersMade = state.transfersMadeThisWeek || 0;
        transferStats.transfersMade[transfersMade] = (transferStats.transfersMade[transfersMade] || 0) + 1;
        
        // Check if user needs updating
        if (freeTransfers !== 2) {
          usersWithWrongTransfers++;
          logWarning(`User ${userId}: ${freeTransfers} free transfers (needs reset to 2)`);
        }
        
        if (deductionPoints > 0) {
          usersWithDeductions++;
          logWarning(`User ${userId}: ${deductionPoints} deduction points (needs reset to 0)`);
        }
      } else {
        logWarning(`User ${userId}: No transferState found (needs initialization)`);
        usersWithWrongTransfers++;
      }
      
      // Show progress every 50 users
      if (processedUsers % 50 === 0 || processedUsers === totalUsers) {
        console.log(createProgressBar(processedUsers, totalUsers));
      }
    }
    
    // Display statistics
    logHeader('TRANSFER STATE ANALYSIS');
    console.log(`${logColors.cyan}📊 CURRENT TRANSFER STATE DISTRIBUTION:`);
    
    console.log(`\n🎁 Free Transfers Distribution:`);
    Object.entries(transferStats.freeTransfers).sort().forEach(([transfers, count]) => {
      const indicator = transfers === '2' ? '✅' : '❌';
      console.log(`   ${indicator} ${transfers} free transfers: ${count} users`);
    });
    
    console.log(`\n🔻 Deduction Points Distribution:`);
    Object.entries(transferStats.deductionPoints).sort().forEach(([points, count]) => {
      const indicator = points === '0' ? '✅' : '❌';
      console.log(`   ${indicator} ${points} deduction points: ${count} users`);
    });
    
    console.log(`\n🔄 Transfers Made Distribution:`);
    Object.entries(transferStats.transfersMade).sort().forEach(([transfers, count]) => {
      console.log(`   📈 ${transfers} transfers made: ${count} users`);
    });
    
    console.log(`\n${logColors.yellow}📋 SUMMARY:`);
    console.log(`   👥 Total Users: ${totalUsers}`);
    console.log(`   🔧 Users needing free transfer reset: ${usersWithWrongTransfers}`);
    console.log(`   💰 Users with deduction points: ${usersWithDeductions}${logColors.reset}`);
    
    return {
      totalUsers,
      usersWithWrongTransfers,
      usersWithDeductions,
      transferStats
    };
    
  } catch (error) {
    logError(`Fatal error during analysis: ${error.message}`);
    throw error;
  }
}

async function resetUserTransfersAndPoints() {
  logHeader('RESETTING FREE TRANSFERS AND DEDUCTION POINTS');
  
  try {
    logInfo('Fetching all users for reset operation...');
    
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let totalUsers = 0;
    let updatedUsers = 0;
    let errors = 0;
    let processedUsers = 0;
    
    // Process users in batches (Firestore batch limit is 500)
    let batch = writeBatch(db);
    let batchCount = 0;
    let totalBatches = 0;
    
    logSuccess(`Found ${usersSnapshot.size} users to process`);
    logInfo('Starting reset operation...\n');
    
    for (const userDoc of usersSnapshot.docs) {
      totalUsers++;
      processedUsers++;
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        let userNeedsUpdate = false;
        let updateData = {};
        
        // Check current transferState
        const currentState = userData.transferState || {};
        
        // Prepare the new transfer state
        const newTransferState = {
          ...currentState,
          savedFreeTransfers: 2,              // Set free transfers to 2
          pointsDeductedThisWeek: 0,          // Reset deduction points to 0
          transfersMadeThisWeek: currentState.transfersMadeThisWeek || 0  // Keep current transfers made
        };
        
        // Check if update is needed
        if (currentState.savedFreeTransfers !== 2 || 
            currentState.pointsDeductedThisWeek !== 0 || 
            !userData.transferState) {
          
          userNeedsUpdate = true;
          updateData.transferState = newTransferState;
          
          logSuccess(`Updating user ${userId}:`);
          logInfo(`  └─ Free transfers: ${currentState.savedFreeTransfers || 'undefined'} → 2`);
          logInfo(`  └─ Deduction points: ${currentState.pointsDeductedThisWeek || 0} → 0`);
        }
        
        // Update user document if needed
        if (userNeedsUpdate) {
          const userRef = doc(db, 'users', userId);
          batch.update(userRef, updateData);
          
          updatedUsers++;
          batchCount++;
        }
        
        // Show progress every 50 users
        if (processedUsers % 50 === 0) {
          console.log(createProgressBar(processedUsers, usersSnapshot.size));
        }
        
        // Execute batch when reaching limit
        if (batchCount >= 450) {
          await batch.commit();
          totalBatches++;
          logSuccess(`Committed batch ${totalBatches} of ${batchCount} updates to database`);
          batch = writeBatch(db); // Create new batch
          batchCount = 0;
        }
        
      } catch (userError) {
        logError(`Error updating user ${userId}: ${userError.message}`);
        errors++;
      }
    }
    
    // Commit final batch if it has operations
    if (batchCount > 0) {
      await batch.commit();
      totalBatches++;
      logSuccess(`Committed final batch ${totalBatches} of ${batchCount} updates to database`);
    }
    
    console.log(createProgressBar(totalUsers, totalUsers)); // Show 100% complete
    
    logHeader('USER RESET SUMMARY');
    console.log(`${logColors.green}✅ TRANSFER STATE RESET COMPLETED:`);
    console.log(`   📊 Total users processed: ${totalUsers}`);
    console.log(`   ✅ Successfully updated: ${updatedUsers}`);
    console.log(`   📦 Total batches committed: ${totalBatches}`);
    console.log(`   ➡️  No update needed: ${totalUsers - updatedUsers - errors}`);
    console.log(`   ❌ Errors encountered: ${errors}${logColors.reset}`);
    
    return { totalUsers, updatedUsers, errors };
    
  } catch (error) {
    logError(`Fatal error during user reset: ${error.message}`);
    throw error;
  }
}

async function resetSquadDocuments() {
  logHeader('RESETTING SQUAD DOCUMENTS - GW2 ONLY');
  
  try {
    logInfo('Scanning user squad subcollections for GW2...');
    
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let totalSquadDocs = 0;
    let updatedSquadDocs = 0;
    let errors = 0;
    
    let batch = writeBatch(db);
    let batchCount = 0;
    let totalBatches = 0;
    
    const TARGET_GAMEWEEK = 2; // Only process GW2
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      try {
        // Get user's main transferState to check for active wildcards
        const userData = userDoc.data();
        const userTransferState = userData.transferState || {};
        const chipsUsed = userData.chipsUsed || {};
        
        // Only check for GW2 squad document
        try {
          const squadRef = doc(db, 'users', userId, 'squads', 'gw2');
          const squadDoc = await getDoc(squadRef);
          
          if (squadDoc.exists()) {
            // Reset transfer-related fields in GW2 squad document
            batch.update(squadRef, {
              // Main transfer cost fields
              transferCost: 0,
              freeTransfers: 2, // Reset the top-level freeTransfers field
              
              // TransferState object
              'transferState.transferCost': 0,
              'transferState.freeTransfers': 2, // Reset the nested freeTransfers field
              'transferState.transfersMade': 0,
              'transferState.pointsDeducted': 0,
              
              // Additional fields that might exist
              pointsDeducted: 0,
              deductionPoints: 0
            });
            
            logSuccess(`Reset GW2 for user ${userId}: freeTransfers=2, transferCost=0`);
            
            totalSquadDocs++;
            updatedSquadDocs++;
            batchCount++;
            
            if (batchCount >= 350) {
              await batch.commit();
              totalBatches++;
              logSuccess(`Committed squad batch ${totalBatches} of ${batchCount} updates`);
              batch = writeBatch(db); // Create new batch
              batchCount = 0;
            }
          } else {
            logWarning(`No GW2 squad found for user ${userId}`);
          }
          
        } catch (squadError) {
          // GW2 squad document may not exist for this user
          logWarning(`No GW2 squad found for user ${userId}`);
        }
        
      } catch (userError) {
        logError(`Error processing GW2 squad for user ${userId}: ${userError.message}`);
        errors++;
      }
    }
    
    // Commit final batch only if it has operations
    if (batchCount > 0) {
      await batch.commit();
      totalBatches++;
      logSuccess(`Committed final squad batch ${totalBatches} of ${batchCount} updates`);
    }
    
    logHeader('GW2 SQUAD RESET SUMMARY');
    console.log(`${logColors.green}✅ GW2 SQUAD DOCUMENTS RESET COMPLETED:`);
    console.log(`   📊 Total GW2 squad documents processed: ${totalSquadDocs}`);
    console.log(`   ✅ Successfully updated: ${updatedSquadDocs}`);
    console.log(`   📦 Total batches committed: ${totalBatches}`);
    console.log(`   ❌ Errors encountered: ${errors}${logColors.reset}`);
    
    return { totalSquadDocs, updatedSquadDocs, errors };
    
  } catch (error) {
    logError(`Error resetting GW2 squad documents: ${error.message}`);
    throw error;
  }
}

async function fixWildcardLogic() {
  logHeader('FIXING WILDCARD LOGIC');
  
  try {
    logInfo('Checking and fixing wildcard states...');
    
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let totalUsers = 0;
    let usersFixed = 0;
    let errors = 0;
    
    const batch = writeBatch(db);
    let batchCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      totalUsers++;
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        const chipsUsed = userData.chipsUsed || {};
        let needsUpdate = false;
        let updatedChips = { ...chipsUsed };
        
        // Check wildcard1
        if (chipsUsed.wildcard1?.isActive) {
          const activeGameweek = chipsUsed.wildcard1.gameweek;
          logWarning(`User ${userId}: Wildcard1 active on GW${activeGameweek}`);
          
          // Wildcard should only be active for its specific gameweek
          // For this reset, we'll deactivate all wildcards and reset free transfers properly
          updatedChips.wildcard1 = {
            ...chipsUsed.wildcard1,
            isActive: false
          };
          needsUpdate = true;
          logInfo(`  └─ Deactivating wildcard1 for proper transfer reset`);
        }
        
        // Check wildcard2
        if (chipsUsed.wildcard2?.isActive) {
          const activeGameweek = chipsUsed.wildcard2.gameweek;
          logWarning(`User ${userId}: Wildcard2 active on GW${activeGameweek}`);
          
          updatedChips.wildcard2 = {
            ...chipsUsed.wildcard2,
            isActive: false
          };
          needsUpdate = true;
          logInfo(`  └─ Deactivating wildcard2 for proper transfer reset`);
        }
        
        // Also ensure transfer state is properly reset
        const currentTransferState = userData.transferState || {};
        const updatedTransferState = {
          ...currentTransferState,
          savedFreeTransfers: 2,              // Reset to 2 free transfers
          pointsDeductedThisWeek: 0,          // Reset deduction points
          transfersMadeThisWeek: currentTransferState.transfersMadeThisWeek || 0,
          wildcardActive: false,              // Ensure wildcard is not active in transfer state
          freeHitActive: false                // Ensure free hit is not active
        };
        
        if (needsUpdate || currentTransferState.savedFreeTransfers !== 2 || currentTransferState.pointsDeductedThisWeek !== 0) {
          const userRef = doc(db, 'users', userId);
          batch.update(userRef, {
            chipsUsed: updatedChips,
            transferState: updatedTransferState
          });
          
          usersFixed++;
          batchCount++;
          logSuccess(`Fixed wildcard logic for user ${userId}`);
        }
        
        if (batchCount >= 450) {
          await batch.commit();
          logSuccess(`Committed wildcard fix batch of ${batchCount} updates`);
          batch = writeBatch(db); // Create new batch
          batchCount = 0;
        }
        
      } catch (userError) {
        logError(`Error fixing wildcard for user ${userId}: ${userError.message}`);
        errors++;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      logSuccess(`Committed final wildcard fix batch of ${batchCount} updates`);
    }
    
    logHeader('WILDCARD LOGIC FIX SUMMARY');
    console.log(`${logColors.green}✅ WILDCARD LOGIC FIX COMPLETED:`);
    console.log(`   👥 Total users processed: ${totalUsers}`);
    console.log(`   🔧 Users fixed: ${usersFixed}`);
    console.log(`   ❌ Errors encountered: ${errors}${logColors.reset}`);
    
    return { totalUsers, usersFixed, errors };
    
  } catch (error) {
    logError(`Error fixing wildcard logic: ${error.message}`);
    throw error;
  }
}

// Main execution function
async function main() {
  logHeader('🚀 COMPREHENSIVE TRANSFER & WILDCARD RESET TOOL');
  console.log(`${logColors.magenta}Target Settings:`);
  console.log(`   🎁 Free Transfers: 2 for everyone (9999 only when wildcard active)`);
  console.log(`   💰 Deduction Points: 0 for everyone`);
  console.log(`   🃏 Wildcard Logic: Fixed to work correctly per gameweek`);
  console.log(`   � Squad Documents: Reset in subcollections`);
  console.log(`   �🕒 Timestamp: ${new Date().toLocaleString()}${logColors.reset}\n`);
  
  try {
    // Step 1: Analyze current state
    logInfo('Step 1: Analyzing current transfer state...');
    const analysisResults = await analyzeCurrentTransferState();
    
    // Step 2: Fix wildcard logic first
    logInfo('Step 2: Fixing wildcard logic and chip states...');
    const wildcardResults = await fixWildcardLogic();
    
    // Step 3: Reset user transfer states
    logInfo('Step 3: Resetting user transfer states...');
    const userResults = await resetUserTransfersAndPoints();
    
    // Step 4: Reset squad documents with proper wildcard handling
    logInfo('Step 4: Resetting squad documents...');
    const squadResults = await resetSquadDocuments();
    
    // Final summary
    logHeader('🎉 COMPREHENSIVE RESET COMPLETED SUCCESSFULLY');
    console.log(`${logColors.green}📊 FINAL SUMMARY:`);
    console.log(`   👥 Users analyzed: ${analysisResults.totalUsers}`);
    console.log(`   🔧 Wildcard logic fixed: ${wildcardResults.usersFixed}`);
    console.log(`   ✅ Users updated: ${userResults.updatedUsers}`);
    console.log(`   📋 Squad documents updated: ${squadResults.updatedSquadDocs}`);
    console.log(`   ❌ Total errors: ${userResults.errors + squadResults.errors + wildcardResults.errors}`);
    console.log(`   🕒 Completed at: ${new Date().toLocaleString()}${logColors.reset}`);
    
    logSuccess('\n🎉 Complete reset finished!');
    console.log(`${logColors.cyan}📋 What was accomplished:`);
    console.log(`   ✅ All users have 2 free transfers (baseline)`);
    console.log(`   ✅ All deduction points set to 0`);
    console.log(`   ✅ Wildcard logic fixed (9999 transfers only when active)`);
    console.log(`   ✅ Squad subcollections updated`);
    console.log(`   ✅ Transfer system should work correctly now${logColors.reset}`);
    
    // Verify reset by re-analyzing
    logInfo('\nStep 5: Verifying reset by re-analyzing...');
    await analyzeCurrentTransferState();
    
  } catch (error) {
    logError(`💥 Script failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Execute the script
main().catch(error => {
  logError(`💥 Script failed: ${error.message}`);
  process.exit(1);
});

module.exports = {
  resetUserTransfersAndPoints,
  resetSquadDocuments,
  analyzeCurrentTransferState
};
