const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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

async function testSquadAccess() {
  console.log('🔍 Testing squad document access...\n');
  
  // Test the specific user from your screenshot
  const testUserId = '01VWgDOQd8hFkttXPwWYHP9k0tp2';
  
  try {
    console.log(`📋 Testing user: ${testUserId}`);
    
    // Test squad document access
    const squadRef = doc(db, 'users', testUserId, 'squads', 'gw2');
    const squadDoc = await getDoc(squadRef);
    
    if (squadDoc.exists()) {
      const squadData = squadDoc.data();
      console.log('✅ GW2 squad document found!');
      console.log('📊 Squad data preview:');
      console.log(`   - transferCost: ${squadData.transferCost}`);
      console.log(`   - freeTransfers: ${squadData.freeTransfers}`);
      if (squadData.transferState) {
        console.log(`   - transferState.freeTransfers: ${squadData.transferState.freeTransfers}`);
        console.log(`   - transferState.transferCost: ${squadData.transferState.transferCost}`);
      }
    } else {
      console.log('❌ GW2 squad document NOT found');
    }
    
    // Also test if we can list all squad subcollections for this user
    console.log('\n🔍 Checking user main document...');
    const userRef = doc(db, 'users', testUserId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log('✅ User document found');
    } else {
      console.log('❌ User document NOT found');
    }
    
  } catch (error) {
    console.error('❌ Error testing squad access:', error.message);
  }
}

testSquadAccess().then(() => {
  console.log('\n✅ Squad access test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
