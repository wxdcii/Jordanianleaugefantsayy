// Test to identify what specific part of the squad data is causing the error
import { doc, setDoc } from 'firebase/firestore';

async function testDataStructure() {
  try {
    const { db } = await import('./src/lib/firebase.js');
    
    if (!db) {
      console.error('❌ Firebase db not available');
      return;
    }
    
    console.log('🧪 Testing different parts of squad data structure...');
    
    const testUserId = 'debug-user';
    const testGameweek = 4;
    
    // Test 1: Basic data only
    console.log('Test 1: Basic data...');
    const basicData = {
      userId: testUserId,
      gameweekId: testGameweek,
      test: 'basic'
    };
    
    let docRef = doc(db, 'users', testUserId, 'squads', 'test-basic');
    await setDoc(docRef, basicData);
    console.log('✅ Basic data saved');
    
    // Test 2: With players array
    console.log('Test 2: With players array...');
    const playersData = {
      userId: testUserId,
      gameweekId: testGameweek,
      players: [
        {
          playerId: 'p1',
          name: 'Player 1',
          position: 'FWD',
          club: 'Club 1',
          price: 10.0,
          isCaptain: false,
          isStarting: true,
          benchPosition: null,
          points: 5
        }
      ]
    };
    
    docRef = doc(db, 'users', testUserId, 'squads', 'test-players');
    await setDoc(docRef, playersData);
    console.log('✅ Players data saved');
    
    // Test 3: With chips data
    console.log('Test 3: With chips data...');
    const chipsData = {
      userId: testUserId,
      gameweekId: testGameweek,
      chipsUsed: {
        wildcard1: { used: false, gameweek: null, isActive: false },
        wildcard2: { used: false, gameweek: null, isActive: false },
        benchBoost: { used: false, gameweek: null, isActive: false },
        tripleCaptain: { used: false, gameweek: null, isActive: false },
        freeHit: { used: false, gameweek: null, isActive: false }
      }
    };
    
    docRef = doc(db, 'users', testUserId, 'squads', 'test-chips');
    await setDoc(docRef, chipsData);
    console.log('✅ Chips data saved');
    
    // Test 4: With transfer state
    console.log('Test 4: With transfer state...');
    const transferData = {
      userId: testUserId,
      gameweekId: testGameweek,
      transferState: {
        transfersMade: 0,
        freeTransfers: 2,
        transferCost: 0,
        pendingTransfers: []
      }
    };
    
    docRef = doc(db, 'users', testUserId, 'squads', 'test-transfers');
    await setDoc(docRef, transferData);
    console.log('✅ Transfer state data saved');
    
    // Test 5: With dates
    console.log('Test 5: With dates...');
    const dateData = {
      userId: testUserId,
      gameweekId: testGameweek,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    docRef = doc(db, 'users', testUserId, 'squads', 'test-dates');
    await setDoc(docRef, dateData);
    console.log('✅ Date data saved');
    
    console.log('🎉 All tests passed! The issue might be elsewhere.');
    
  } catch (error) {
    console.error('💥 Test failed at:', error.message);
    console.error('Error details:', error);
  }
}

testDataStructure();
