// Reset User Deduction Points Script for GW2
// Enhanced version with admin-friendly logging and progress tracking

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } = require('firebase/firestore');

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CURRENT_GAMEWEEK = 2; // GW2 as specified

// Enhanced logging with colors and emojis for better admin experience
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

async function analyzeCurrentState() {
  logHeader(`ANALYZING CURRENT STATE - GAMEWEEK ${CURRENT_GAMEWEEK}`);
  
  try {
    logInfo('Fetching all users from database...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const totalUsers = usersSnapshot.size;
    let usersWithDeductions = 0;
    let totalDeductionPoints = 0;
    let processedUsers = 0;
    
    logSuccess(`Found ${totalUsers} users in database`);
    logInfo('Analyzing deduction points...\n');
    
    for (const userDoc of usersSnapshot.docs) {
      processedUsers++;
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      let userDeductions = 0;
      let deductionSources = [];
      
      // Check main transferState
      if (userData.transferState && userData.transferState.pointsDeductedThisWeek > 0) {
        userDeductions += userData.transferState.pointsDeductedThisWeek;
        deductionSources.push(`transferState: ${userData.transferState.pointsDeductedThisWeek}`);
      }
      
      if (userDeductions > 0) {
        usersWithDeductions++;
        totalDeductionPoints += userDeductions;
        logWarning(`User ${userId}: ${userDeductions} points (${deductionSources.join(', ')})`);
      }
      
      // Show progress every 50 users or at the end
      if (processedUsers % 50 === 0 || processedUsers === totalUsers) {
        console.log(createProgressBar(processedUsers, totalUsers));
      }
    }
    
    // Check GameweekPoints collection
    logInfo('\nChecking GameweekPoints collection...');
    const gameweekPointsRef = collection(db, 'GameweekPoints');
    const gameweekPointsSnapshot = await getDocs(gameweekPointsRef);
    
    let gameweekPointsWithDeductions = 0;
    gameweekPointsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.gameweekId === CURRENT_GAMEWEEK && (data.transferCost > 0 || data.pointsDeducted > 0)) {
        gameweekPointsWithDeductions++;
        logWarning(`GameweekPoints ${doc.id}: transferCost=${data.transferCost}, pointsDeducted=${data.pointsDeducted}`);
      }
    });
    
    // Summary
    logHeader('ANALYSIS SUMMARY');
    console.log(`${logColors.cyan}📊 CURRENT STATE ANALYSIS RESULTS:`);
    console.log(`   👥 Total Users: ${totalUsers}`);
    console.log(`   💳 Users with Deductions: ${usersWithDeductions}`);
    console.log(`   🔻 Total Deduction Points: ${totalDeductionPoints}`);
    console.log(`   📈 Average Deduction: ${usersWithDeductions > 0 ? (totalDeductionPoints / usersWithDeductions).toFixed(1) : 0} points`);
    console.log(`   📋 GameweekPoints Records with Deductions: ${gameweekPointsWithDeductions}${logColors.reset}`);
    
    return {
      totalUsers,
      usersWithDeductions,
      totalDeductionPoints,
      gameweekPointsWithDeductions
    };
    
  } catch (error) {
    logError(`Fatal error during analysis: ${error.message}`);
    throw error;
  }
}

async function resetUserDeductionPoints() {
  logHeader(`RESETTING USER DEDUCTION POINTS - GAMEWEEK ${CURRENT_GAMEWEEK}`);
  
  try {
    logInfo('Fetching all users for reset operation...');
    
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let totalUsers = 0;
    let updatedUsers = 0;
    let errors = 0;
    let processedUsers = 0;
    
    // Process users in batches (Firestore batch limit is 500)
    const batch = writeBatch(db);
    let batchCount = 0;
    
    logSuccess(`Found ${usersSnapshot.size} users to process`);
    logInfo('Starting reset operation...\n');
    
    for (const userDoc of usersSnapshot.docs) {
      totalUsers++;
      processedUsers++;
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        let userUpdated = false;
        
        // Reset transferState deduction points
        if (userData.transferState && userData.transferState.pointsDeductedThisWeek > 0) {
          const updatedTransferState = {
            ...userData.transferState,
            pointsDeductedThisWeek: 0
          };
          
          // Update user document
          const userRef = doc(db, 'users', userId);
          batch.update(userRef, {
            transferState: updatedTransferState
          });
          
          logSuccess(`Reset transferState for user ${userId} (was: ${userData.transferState.pointsDeductedThisWeek} points)`);
          userUpdated = true;
        }
        
        // Also check and update user squads subcollection for current gameweek
        try {
          const squadRef = doc(db, 'users', userId, 'squads', `gw${CURRENT_GAMEWEEK}`);
          
          // Reset transferState in squad document
          batch.update(squadRef, {
            'transferState.transferCost': 0,
            'transferState.pointsDeducted': 0,
            transferCost: 0
          });
          
          if (userUpdated) {
            logInfo(`  └─ Also reset squad data for GW${CURRENT_GAMEWEEK}`);
          }
          
        } catch (squadError) {
          // Squad document may not exist, continue
        }
        
        if (userUpdated) {
          updatedUsers++;
        }
        batchCount++;
        
        // Show progress every 50 users
        if (processedUsers % 50 === 0) {
          console.log(createProgressBar(processedUsers, usersSnapshot.size));
        }
        
        // Execute batch when reaching limit or at the end
        if (batchCount >= 450 || totalUsers === usersSnapshot.size) {
          await batch.commit();
          logSuccess(`Committed batch of ${batchCount} updates to database`);
          batchCount = 0;
        }
        
      } catch (userError) {
        logError(`Error updating user ${userId}: ${userError.message}`);
        errors++;
      }
    }
    
    console.log(createProgressBar(totalUsers, totalUsers)); // Show 100% complete
    
    logHeader('USER RESET SUMMARY');
    console.log(`${logColors.green}✅ USER DEDUCTION POINTS RESET COMPLETED:`);
    console.log(`   📊 Total users processed: ${totalUsers}`);
    console.log(`   ✅ Successfully updated: ${updatedUsers}`);
    console.log(`   ❌ Errors encountered: ${errors}${logColors.reset}`);
    
    return { totalUsers, updatedUsers, errors };
    
  } catch (error) {
    logError(`Fatal error during user reset: ${error.message}`);
    throw error;
  }
}

async function resetGameweekPointsDeductions() {
  logHeader(`RESETTING GAMEWEEK POINTS COLLECTION - GAMEWEEK ${CURRENT_GAMEWEEK}`);
  
  try {
    logInfo('Fetching GameweekPoints records...');
    
    const gameweekPointsRef = collection(db, 'GameweekPoints');
    const gameweekPointsSnapshot = await getDocs(gameweekPointsRef);
    
    const batch = writeBatch(db);
    let batchCount = 0;
    let updatedRecords = 0;
    let totalRecords = 0;
    
    logSuccess(`Found ${gameweekPointsSnapshot.size} total GameweekPoints records`);
    logInfo('Filtering and updating records for current gameweek...\n');
    
    for (const pointsDoc of gameweekPointsSnapshot.docs) {
      const pointsData = pointsDoc.data();
      
      // Check if this is for the current gameweek
      if (pointsData.gameweekId === CURRENT_GAMEWEEK) {
        totalRecords++;
        
        if (pointsData.transferCost > 0 || pointsData.pointsDeducted > 0) {
          logSuccess(`Resetting points for user: ${pointsData.userId} (transferCost: ${pointsData.transferCost}, pointsDeducted: ${pointsData.pointsDeducted})`);
          
          const pointsRef = doc(db, 'GameweekPoints', pointsDoc.id);
          batch.update(pointsRef, {
            transferCost: 0,
            pointsDeducted: 0
          });
          
          updatedRecords++;
          batchCount++;
          
          if (batchCount >= 450) {
            await batch.commit();
            logSuccess(`Committed GameweekPoints batch of ${batchCount} updates`);
            batchCount = 0;
          }
        }
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      logSuccess(`Committed final GameweekPoints batch of ${batchCount} updates`);
    }
    
    logHeader('GAMEWEEK POINTS RESET SUMMARY');
    console.log(`${logColors.green}✅ GAMEWEEK POINTS RESET COMPLETED:`);
    console.log(`   📊 Total GW${CURRENT_GAMEWEEK} records found: ${totalRecords}`);
    console.log(`   ✅ Records updated: ${updatedRecords}${logColors.reset}`);
    
    return { totalRecords, updatedRecords };
    
  } catch (error) {
    logError(`Error resetting GameweekPoints deductions: ${error.message}`);
    throw error;
  }
}

// Run the reset functions
async function main() {
  logHeader('🚀 ADMIN DEDUCTION POINTS RESET TOOL');
  console.log(`${logColors.magenta}Target Gameweek: ${CURRENT_GAMEWEEK}`);
  console.log(`Timestamp: ${new Date().toLocaleString()}${logColors.reset}\n`);
  
  try {
    // First analyze current state
    logInfo('Step 1: Analyzing current state before reset...');
    const analysisResults = await analyzeCurrentState();
    
    if (analysisResults.usersWithDeductions === 0 && analysisResults.gameweekPointsWithDeductions === 0) {
      logSuccess('\n🎉 No deduction points found! System is already clean.');
      return;
    }
    
    // Confirm before proceeding
    console.log(`\n${logColors.yellow}⚠️  WARNING: This will reset ALL deduction points for Gameweek ${CURRENT_GAMEWEEK}`);
    console.log(`   Affected users: ${analysisResults.usersWithDeductions}`);
    console.log(`   Total points to be reset: ${analysisResults.totalDeductionPoints}${logColors.reset}\n`);
    
    logInfo('Proceeding with reset in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Reset user transferState points
    logInfo('Step 2: Resetting user deduction points...');
    const userResults = await resetUserDeductionPoints();
    
    // Step 3: Reset GameweekPoints collection
    logInfo('Step 3: Resetting GameweekPoints collection...');
    const gameweekResults = await resetGameweekPointsDeductions();
    
    // Final summary
    logHeader('🎉 RESET OPERATION COMPLETED SUCCESSFULLY');
    console.log(`${logColors.green}📊 FINAL SUMMARY:`);
    console.log(`   👥 Users processed: ${userResults.totalUsers}`);
    console.log(`   ✅ Users updated: ${userResults.updatedUsers}`);
    console.log(`   📋 GameweekPoints updated: ${gameweekResults.updatedRecords}`);
    console.log(`   ❌ Errors encountered: ${userResults.errors}`);
    console.log(`   🕒 Completed at: ${new Date().toLocaleString()}${logColors.reset}`);
    
    logSuccess('\n🎉 All deduction points have been successfully reset!');
    
    // Verify reset by re-analyzing
    logInfo('\nStep 4: Verifying reset by re-analyzing...');
    await analyzeCurrentState();
    
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
  resetUserDeductionPoints,
  resetGameweekPointsDeductions,
  analyzeCurrentState
};
