// Debug script to test the exact save operation
console.log('🧪 Testing Firebase save with minimal data...');

// Import Firebase functions directly
import { doc, setDoc } from 'firebase/firestore';

// Test with the same structure but minimal data
async function testMinimalSave() {
  try {
    // First, try to import Firebase db
    const { db } = await import('./src/lib/firebase.js');
    
    if (!db) {
      console.error('❌ Firebase db not available');
      return;
    }
    
    console.log('✅ Firebase db available');
    
    // Test with minimal squad data structure
    const testUserId = 'test-user-123';
    const testGameweek = 4;
    
    const minimalSquadData = {
      userId: testUserId,
      gameweekId: testGameweek,
      players: [
        {
          playerId: 'player1',
          name: 'Test Player',
          position: 'FWD',
          club: 'Test Club',
          price: 10.0,
          isCaptain: true,
          isStarting: true,
          benchPosition: null,
          points: 0
        }
      ],
      formation: '3-4-3',
      captainId: 'player1',
      totalValue: 10.0,
      transferCost: 0,
      chipsUsed: {
        wildcard1: { used: false, gameweek: null, isActive: false }
      },
      transferState: {
        transfersMade: 0,
        freeTransfers: 2,
        transferCost: 0,
        pendingTransfers: []
      },
      isValid: true,
      validationErrors: [],
      deadline: 'GW4 deadline',
      isSubmitted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('💾 Attempting to save minimal squad data...');
    
    const squadDocRef = doc(db, 'users', testUserId, 'squads', `gw${testGameweek}`);
    await setDoc(squadDocRef, minimalSquadData);
    
    console.log('✅ Minimal squad data saved successfully!');
    
  } catch (error) {
    console.error('💥 Error during minimal save test:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Check if it's a specific Firebase error
    if (error.code) {
      console.error('🔥 Firebase error code:', error.code);
      switch (error.code) {
        case 'permission-denied':
          console.error('❌ Permission denied - check Firestore rules');
          break;
        case 'invalid-argument':
          console.error('❌ Invalid argument - check data structure');
          break;
        case 'unavailable':
          console.error('❌ Service unavailable - network issue');
          break;
        default:
          console.error('❌ Unknown Firebase error');
      }
    }
  }
}

testMinimalSave();
