const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');

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

async function resetSingleUser() {
  console.log('🔧 Resetting single user GW2 squad...\n');
  
  const testUserId = '01VWgDOQd8hFkttXPwWYHP9k0tp2';
  
  try {
    console.log(`📋 Processing user: ${testUserId}`);
    
    // Get squad document
    const squadRef = doc(db, 'users', testUserId, 'squads', 'gw2');
    const squadDoc = await getDoc(squadRef);
    
    if (squadDoc.exists()) {
      const squadData = squadDoc.data();
      console.log('📊 Current squad data:');
      console.log(`   - transferCost: ${squadData.transferCost}`);
      console.log(`   - freeTransfers: ${squadData.freeTransfers}`);
      if (squadData.transferState) {
        console.log(`   - transferState.freeTransfers: ${squadData.transferState.freeTransfers}`);
        console.log(`   - transferState.transferCost: ${squadData.transferState.transferCost}`);
      }
      
      console.log('\n🔧 Updating squad document...');
      
      // Update the squad document
      await updateDoc(squadRef, {
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
      
      console.log('✅ Squad document updated successfully!');
      
      // Verify the update
      console.log('\n🔍 Verifying update...');
      const updatedDoc = await getDoc(squadRef);
      if (updatedDoc.exists()) {
        const updatedData = updatedDoc.data();
        console.log('📊 Updated squad data:');
        console.log(`   - transferCost: ${updatedData.transferCost}`);
        console.log(`   - freeTransfers: ${updatedData.freeTransfers}`);
        if (updatedData.transferState) {
          console.log(`   - transferState.freeTransfers: ${updatedData.transferState.freeTransfers}`);
          console.log(`   - transferState.transferCost: ${updatedData.transferState.transferCost}`);
        }
      }
      
    } else {
      console.log('❌ GW2 squad document NOT found');
    }
    
  } catch (error) {
    console.error('❌ Error resetting user:', error.message);
  }
}

resetSingleUser().then(() => {
  console.log('\n✅ Single user reset completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
