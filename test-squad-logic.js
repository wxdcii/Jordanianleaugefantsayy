const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

// Firebase config (using client SDK)
const firebaseConfig = {
  apiKey: "AIzaSyBKBJNUk3PGxCGDLGbIxjgkG0UFWxLlRhM",
  authDomain: "thejordanianleague.firebaseapp.com",
  projectId: "thejordanianleague",
  storageBucket: "thejordanianleague.firebasestorage.app",
  messagingSenderId: "461266121467",
  appId: "1:461266121467:web:7afc20ae0c9b7d3aaea564"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testSquadLogic() {
  console.log('============================================================');
  console.log('🧪 TESTING NEW SQUAD CHECKING LOGIC');
  console.log('============================================================');

  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let usersWithUnlimitedTransfers = [];
    let potentialBugUsers = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const transferState = userData.transferState;
      
      // Only check users with 999+ transfers
      if (transferState && transferState.savedFreeTransfers >= 999) {
        console.log(`\n🔍 Analyzing user ${userId}:`);
        console.log(`   - Current transfers: ${transferState.savedFreeTransfers}`);
        console.log(`   - hasEverSavedSquad: ${userData.hasEverSavedSquad}`);
        
        // Test the NEW logic: Check for squads in previous gameweeks
        const squadsRef = collection(db, 'users', userId, 'squads');
        const squadsSnapshot = await getDocs(squadsRef);
        
        if (!squadsSnapshot.empty) {
          console.log(`   - Total squads found: ${squadsSnapshot.size}`);
          
          // Simulate checking for different current gameweeks
          const testGameweeks = [2, 3, 4, 5];
          
          for (const currentGW of testGameweeks) {
            // Check for squads in previous gameweeks
            const previousGameweeks = [];
            for (let gw = 1; gw < currentGW; gw++) {
              previousGameweeks.push(`gw${gw}`);
            }
            
            let hasSquadsInPrevious = false;
            const foundSquads = [];
            
            for (const squadDoc of squadsSnapshot.docs) {
              if (previousGameweeks.includes(squadDoc.id)) {
                hasSquadsInPrevious = true;
                foundSquads.push(squadDoc.id);
              }
            }
            
            const isNewUserOldLogic = !userData.hasEverSavedSquad && squadsSnapshot.empty; // Old logic
            const isNewUserNewLogic = !userData.hasEverSavedSquad && !hasSquadsInPrevious; // New logic
            
            console.log(`   - If current GW${currentGW}:`);
            console.log(`     * Previous GWs: ${previousGameweeks.join(', ')}`);
            console.log(`     * Found squads in previous: ${foundSquads.join(', ') || 'none'}`);
            console.log(`     * Old logic (any squads): isNew = ${isNewUserOldLogic}`);
            console.log(`     * New logic (previous squads): isNew = ${isNewUserNewLogic}`);
            
            // If old and new logic differ, this user would be affected
            if (isNewUserOldLogic !== isNewUserNewLogic) {
              potentialBugUsers.push({
                userId,
                currentTransfers: transferState.savedFreeTransfers,
                hasEverSavedSquad: userData.hasEverSavedSquad,
                testGameweek: currentGW,
                allSquads: squadsSnapshot.docs.map(doc => doc.id),
                previousSquads: foundSquads,
                oldLogicResult: isNewUserOldLogic,
                newLogicResult: isNewUserNewLogic
              });
            }
          }
        } else {
          console.log(`   - No squads found`);
        }
        
        usersWithUnlimitedTransfers.push({
          userId,
          transfers: transferState.savedFreeTransfers,
          hasEverSavedSquad: userData.hasEverSavedSquad,
          squadCount: squadsSnapshot.size
        });
      }
    }

    console.log('\n============================================================');
    console.log('📊 ANALYSIS RESULTS');
    console.log('============================================================');
    console.log(`🚨 Users with 999+ transfers: ${usersWithUnlimitedTransfers.length}`);
    console.log(`🔧 Users that would be affected by fix: ${potentialBugUsers.length}`);

    if (potentialBugUsers.length > 0) {
      console.log('\n🔧 USERS AFFECTED BY THE FIX:');
      potentialBugUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. User ${user.userId}:`);
        console.log(`   - Current transfers: ${user.currentTransfers}`);
        console.log(`   - hasEverSavedSquad: ${user.hasEverSavedSquad}`);
        console.log(`   - Test gameweek: ${user.testGameweek}`);
        console.log(`   - All squads: [${user.allSquads.join(', ')}]`);
        console.log(`   - Previous squads: [${user.previousSquads.join(', ') || 'none'}]`);
        console.log(`   - Old logic result: ${user.oldLogicResult ? 'NEW USER (999 transfers)' : 'EXISTING USER (normal transfers)'}`);
        console.log(`   - New logic result: ${user.newLogicResult ? 'NEW USER (999 transfers)' : 'EXISTING USER (normal transfers)'}`);
        console.log(`   - Fix impact: ${user.oldLogicResult && !user.newLogicResult ? '✅ WILL FIX (999→normal)' : '⚠️ Other change'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing squad logic:', error);
  }
}

testSquadLogic();
