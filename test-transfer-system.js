const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc, updateDoc } = require('firebase/firestore');

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

async function testTransferLogic() {
  console.log('============================================================');
  console.log('🧪 TESTING TRANSFER LOGIC - Comprehensive Transfer System Test');
  console.log('============================================================');

  try {
    // Test 1: Check current transfer state of users
    console.log('\n📊 TEST 1: CURRENT TRANSFER STATE ANALYSIS');
    console.log('------------------------------------------------------------');
    
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let usersWithUnlimitedTransfers = [];
    let usersWithNormalTransfers = [];
    let usersWithWildcardActive = [];
    let totalUsers = 0;

    for (const userDoc of usersSnapshot.docs) {
      totalUsers++;
      const userData = userDoc.data();
      const userId = userDoc.id;
      const transferState = userData.transferState;
      
      if (transferState) {
        if (transferState.savedFreeTransfers >= 999) {
          usersWithUnlimitedTransfers.push({
            userId,
            transfers: transferState.savedFreeTransfers,
            wildcardActive: transferState.wildcardActive,
            lastGameweekProcessed: transferState.lastGameweekProcessed,
            hasEverSavedSquad: userData.hasEverSavedSquad
          });
        } else {
          usersWithNormalTransfers.push({
            userId,
            transfers: transferState.savedFreeTransfers,
            lastGameweekProcessed: transferState.lastGameweekProcessed
          });
        }
        
        if (transferState.wildcardActive) {
          usersWithWildcardActive.push({
            userId,
            transfers: transferState.savedFreeTransfers,
            lastGameweekProcessed: transferState.lastGameweekProcessed
          });
        }
      }
    }

    console.log(`📈 Total users: ${totalUsers}`);
    console.log(`🚨 Users with unlimited transfers (999+): ${usersWithUnlimitedTransfers.length}`);
    console.log(`✅ Users with normal transfers (<999): ${usersWithNormalTransfers.length}`);
    console.log(`🃏 Users with wildcard active: ${usersWithWildcardActive.length}`);

    // Test 2: Simulate the new squad checking logic
    console.log('\n🔍 TEST 2: NEW SQUAD CHECKING LOGIC SIMULATION');
    console.log('------------------------------------------------------------');

    let firstTimeUsers = [];
    let existingUsers = [];
    
    for (const user of usersWithUnlimitedTransfers) {
      const userId = user.userId;
      
      // Check squad history with new logic
      const squadsRef = collection(db, 'users', userId, 'squads');
      const squadsSnapshot = await getDocs(squadsRef);
      
      // Simulate current gameweek scenarios
      const testGameweeks = [2, 3, 4, 5];
      
      for (const currentGW of testGameweeks) {
        // Check for squads in previous gameweeks
        const previousGameweeks = [];
        for (let gw = 1; gw < currentGW; gw++) {
          previousGameweeks.push(`gw${gw}`);
        }
        
        const currentGameweekId = `gw${currentGW}`;
        
        let hasSquadsInPrevious = false;
        let hasSquadForCurrent = false;
        const foundPreviousSquads = [];
        
        for (const squadDoc of squadsSnapshot.docs) {
          if (previousGameweeks.includes(squadDoc.id)) {
            hasSquadsInPrevious = true;
            foundPreviousSquads.push(squadDoc.id);
          }
          if (squadDoc.id === currentGameweekId) {
            hasSquadForCurrent = true;
          }
        }
        
        // Apply new logic
        const isFirstTimeForThisGameweek = !user.hasEverSavedSquad && !hasSquadsInPrevious && !hasSquadForCurrent;
        
        if (isFirstTimeForThisGameweek) {
          firstTimeUsers.push({
            userId,
            currentTransfers: user.transfers,
            testGameweek: currentGW,
            hasEverSavedSquad: user.hasEverSavedSquad,
            previousSquads: foundPreviousSquads,
            shouldGet999: true
          });
        } else {
          existingUsers.push({
            userId,
            currentTransfers: user.transfers,
            testGameweek: currentGW,
            hasEverSavedSquad: user.hasEverSavedSquad,
            previousSquads: foundPreviousSquads,
            hasSquadForCurrent,
            shouldGet999: false
          });
        }
        
        // Only test first scenario for brevity
        break;
      }
    }

    console.log(`✅ Users who should have 999 transfers (first-time): ${firstTimeUsers.length}`);
    console.log(`⚠️ Users who should NOT have 999 transfers (existing): ${existingUsers.length}`);

    if (existingUsers.length > 0) {
      console.log('\n⚠️ USERS WITH INCORRECT UNLIMITED TRANSFERS:');
      existingUsers.slice(0, 5).forEach((user, index) => {
        console.log(`${index + 1}. ${user.userId}:`);
        console.log(`   - Current transfers: ${user.currentTransfers} (should be ≤ 5)`);
        console.log(`   - hasEverSavedSquad: ${user.hasEverSavedSquad}`);
        console.log(`   - Previous squads: [${user.previousSquads.join(', ') || 'none'}]`);
        console.log(`   - Has current squad: ${user.hasSquadForCurrent}`);
      });
    }

    // Test 3: Check wildcard states
    console.log('\n🃏 TEST 3: WILDCARD STATE VERIFICATION');
    console.log('------------------------------------------------------------');

    if (usersWithWildcardActive.length > 0) {
      console.log('Users with wildcard active:');
      usersWithWildcardActive.forEach((user, index) => {
        console.log(`${index + 1}. ${user.userId}:`);
        console.log(`   - Transfers: ${user.transfers}`);
        console.log(`   - Last processed GW: ${user.lastGameweekProcessed}`);
        console.log(`   - Status: ${user.transfers >= 9999 ? '✅ Correct (9999)' : '⚠️ Unexpected transfer count'}`);
      });
    } else {
      console.log('✅ No users have wildcard active (good for testing)');
    }

    // Test 4: Fantasy Teams check
    console.log('\n🏆 TEST 4: FANTASY TEAMS COLLECTION CHECK');
    console.log('------------------------------------------------------------');

    const fantasyTeamsRef = collection(db, 'fantasyTeams');
    const fantasyTeamsSnapshot = await getDocs(fantasyTeamsRef);
    
    let fantasyTeamsWithUnlimited = 0;
    let fantasyTeamsWithNormal = 0;
    
    for (const teamDoc of fantasyTeamsSnapshot.docs) {
      const teamData = teamDoc.data();
      const transferState = teamData.transferState;
      
      if (transferState) {
        if (transferState.savedFreeTransfers >= 999) {
          fantasyTeamsWithUnlimited++;
        } else {
          fantasyTeamsWithNormal++;
        }
      }
    }

    console.log(`📊 Fantasy Teams total: ${fantasyTeamsSnapshot.size}`);
    console.log(`🚨 Fantasy Teams with unlimited transfers: ${fantasyTeamsWithUnlimited}`);
    console.log(`✅ Fantasy Teams with normal transfers: ${fantasyTeamsWithNormal}`);

    // Test 5: Transfer calculation simulation
    console.log('\n🧮 TEST 5: TRANSFER COST CALCULATION SIMULATION');
    console.log('------------------------------------------------------------');

    const testScenarios = [
      { transfers: 1, freeTransfers: 2, gameweek: 3, wildcard: false, expected: 0 },
      { transfers: 2, freeTransfers: 2, gameweek: 3, wildcard: false, expected: 0 },
      { transfers: 3, freeTransfers: 2, gameweek: 3, wildcard: false, expected: 4 },
      { transfers: 5, freeTransfers: 1, gameweek: 3, wildcard: false, expected: 16 },
      { transfers: 10, freeTransfers: 9999, gameweek: 3, wildcard: false, expected: 0 },
      { transfers: 5, freeTransfers: 2, gameweek: 3, wildcard: true, expected: 0 },
    ];

    console.log('Transfer cost calculations:');
    testScenarios.forEach((scenario, index) => {
      const freeUsed = Math.min(scenario.transfers, scenario.freeTransfers);
      const paidTransfers = Math.max(0, scenario.transfers - freeUsed);
      const cost = scenario.wildcard || scenario.freeTransfers >= 9999 ? 0 : paidTransfers * 4;
      
      console.log(`${index + 1}. ${scenario.transfers} transfers, ${scenario.freeTransfers} free, wildcard: ${scenario.wildcard}`);
      console.log(`   → Cost: ${cost} points (expected: ${scenario.expected}) ${cost === scenario.expected ? '✅' : '❌'}`);
    });

    // Summary
    console.log('\n============================================================');
    console.log('📋 TRANSFER SYSTEM HEALTH SUMMARY');
    console.log('============================================================');
    
    const healthIssues = [];
    
    if (existingUsers.length > 0) {
      healthIssues.push(`${existingUsers.length} users have incorrect unlimited transfers`);
    }
    
    if (usersWithWildcardActive.length > 0) {
      healthIssues.push(`${usersWithWildcardActive.length} users have wildcard active (may need review)`);
    }
    
    if (fantasyTeamsWithUnlimited > fantasyTeamsWithNormal * 0.1) {
      healthIssues.push(`High ratio of fantasy teams with unlimited transfers (${fantasyTeamsWithUnlimited}/${fantasyTeamsSnapshot.size})`);
    }

    if (healthIssues.length === 0) {
      console.log('🎉 TRANSFER SYSTEM STATUS: HEALTHY');
      console.log('✅ All transfer logic appears to be working correctly');
    } else {
      console.log('⚠️ TRANSFER SYSTEM STATUS: NEEDS ATTENTION');
      console.log('Issues found:');
      healthIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

    console.log('\n📊 Quick Stats:');
    console.log(`   • Total users: ${totalUsers}`);
    console.log(`   • Users with normal transfers: ${usersWithNormalTransfers.length} (${Math.round(usersWithNormalTransfers.length/totalUsers*100)}%)`);
    console.log(`   • Users with unlimited transfers: ${usersWithUnlimitedTransfers.length} (${Math.round(usersWithUnlimitedTransfers.length/totalUsers*100)}%)`);
    console.log(`   • Fantasy teams with normal transfers: ${fantasyTeamsWithNormal} (${Math.round(fantasyTeamsWithNormal/fantasyTeamsSnapshot.size*100)}%)`);

  } catch (error) {
    console.error('❌ Error testing transfer logic:', error);
  }
}

testTransferLogic();
