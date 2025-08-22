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

async function analyzeTransferBug() {
  console.log('============================================================');
  console.log('🔍 ANALYZING TRANSFER BUG - Finding 999/9999 Transfer Users');
  console.log('============================================================');

  try {
    // Check users collection
    console.log('📊 Analyzing users collection...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let usersWithUnlimitedTransfers = [];
    let usersWithoutFlag = [];
    let usersWithSquads = [];
    let totalUsers = 0;

    for (const userDoc of usersSnapshot.docs) {
      totalUsers++;
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Check transfer state
      const transferState = userData.transferState;
      const hasEverSavedSquad = userData.hasEverSavedSquad;
      
      if (transferState && transferState.savedFreeTransfers >= 999) {
        console.log(`🚨 User ${userId} has ${transferState.savedFreeTransfers} transfers`);
        console.log(`   - hasEverSavedSquad: ${hasEverSavedSquad}`);
        console.log(`   - wildcardActive: ${transferState.wildcardActive}`);
        console.log(`   - lastGameweekProcessed: ${transferState.lastGameweekProcessed}`);
        
        // Check if user has squads
        try {
          const squadsRef = collection(db, 'users', userId, 'squads');
          const squadsSnapshot = await getDocs(squadsRef);
          const hasSquads = !squadsSnapshot.empty;
          
          console.log(`   - hasSquads: ${hasSquads} (${squadsSnapshot.size} squads)`);
          
          if (hasSquads) {
            usersWithSquads.push({
              userId,
              transfers: transferState.savedFreeTransfers,
              hasEverSavedSquad,
              squadsCount: squadsSnapshot.size
            });
          }
        } catch (error) {
          console.log(`   - Error checking squads: ${error.message}`);
        }
        
        usersWithUnlimitedTransfers.push({
          userId,
          transfers: transferState.savedFreeTransfers,
          hasEverSavedSquad,
          wildcardActive: transferState.wildcardActive,
          lastGameweekProcessed: transferState.lastGameweekProcessed
        });
      }
      
      // Check for users without hasEverSavedSquad flag
      if (hasEverSavedSquad === undefined || hasEverSavedSquad === null) {
        usersWithoutFlag.push({
          userId,
          transfers: transferState?.savedFreeTransfers || 'N/A'
        });
      }
    }

    console.log('\n============================================================');
    console.log('📋 ANALYSIS RESULTS');
    console.log('============================================================');
    console.log(`📊 Total users analyzed: ${totalUsers}`);
    console.log(`🚨 Users with 999+ transfers: ${usersWithUnlimitedTransfers.length}`);
    console.log(`❓ Users without hasEverSavedSquad flag: ${usersWithoutFlag.length}`);
    console.log(`📁 Users with 999+ transfers AND squads: ${usersWithSquads.length}`);

    if (usersWithUnlimitedTransfers.length > 0) {
      console.log('\n🚨 USERS WITH UNLIMITED TRANSFERS:');
      usersWithUnlimitedTransfers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.userId}:`);
        console.log(`   - Transfers: ${user.transfers}`);
        console.log(`   - hasEverSavedSquad: ${user.hasEverSavedSquad}`);
        console.log(`   - wildcardActive: ${user.wildcardActive}`);
        console.log(`   - lastGameweekProcessed: ${user.lastGameweekProcessed}`);
      });
    }

    if (usersWithoutFlag.length > 0) {
      console.log('\n❓ USERS WITHOUT hasEverSavedSquad FLAG:');
      usersWithoutFlag.forEach((user, index) => {
        console.log(`${index + 1}. ${user.userId}: ${user.transfers} transfers`);
      });
    }

    if (usersWithSquads.length > 0) {
      console.log('\n📁 USERS WITH 999+ TRANSFERS BUT HAVE SQUADS (BUG CANDIDATES):');
      usersWithSquads.forEach((user, index) => {
        console.log(`${index + 1}. ${user.userId}:`);
        console.log(`   - Transfers: ${user.transfers}`);
        console.log(`   - hasEverSavedSquad: ${user.hasEverSavedSquad}`);
        console.log(`   - Squads count: ${user.squadsCount}`);
      });
    }

    // Check fantasyTeams collection for comparison
    console.log('\n📊 Checking fantasyTeams collection...');
    const fantasyTeamsRef = collection(db, 'fantasyTeams');
    const fantasyTeamsSnapshot = await getDocs(fantasyTeamsRef);
    
    let fantasyTeamsWithUnlimited = [];
    
    for (const teamDoc of fantasyTeamsSnapshot.docs) {
      const teamData = teamDoc.data();
      const transferState = teamData.transferState;
      
      if (transferState && transferState.savedFreeTransfers >= 999) {
        fantasyTeamsWithUnlimited.push({
          teamId: teamDoc.id,
          transfers: transferState.savedFreeTransfers,
          wildcardActive: transferState.wildcardActive
        });
      }
    }

    console.log(`🚨 Fantasy teams with 999+ transfers: ${fantasyTeamsWithUnlimited.length}`);
    
    if (fantasyTeamsWithUnlimited.length > 0) {
      console.log('\nFantasy teams with unlimited transfers:');
      fantasyTeamsWithUnlimited.forEach((team, index) => {
        console.log(`${index + 1}. ${team.teamId}: ${team.transfers} transfers (wildcard: ${team.wildcardActive})`);
      });
    }

  } catch (error) {
    console.error('❌ Error analyzing transfer bug:', error);
  }
}

analyzeTransferBug();
