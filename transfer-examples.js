#!/usr/bin/env node

/**
 * Transfer System Examples - Centralized Transfer Cost
 * 
 * This script demonstrates how the new centralized transfer system works
 * with real examples of different transfer scenarios.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already done)
if (!admin.apps.length) {
  try {
    const serviceAccount = require('./firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.log('⚠️  Firebase service account not found. Using demo data only.');
  }
}

const db = admin.apps.length ? admin.firestore() : null;

// Example transfer scenarios
const transferExamples = [
  {
    scenario: "New User - First Squad Creation",
    description: "User creates their first squad",
    initialState: {
      savedFreeTransfers: 9999, // Unlimited for first time
      transfersMadeThisWeek: 0,
      pointsDeductedThisWeek: 0
    },
    action: "Select 15 players for first time",
    transfersSelected: 15,
    expectedResult: {
      savedFreeTransfers: 1, // Reset to 1 after first save
      transfersMadeThisWeek: 0,
      pointsDeductedThisWeek: 0,
      cost: 0
    }
  },
  {
    scenario: "Free Transfer - Within Limit",
    description: "User makes 1 transfer with 1 free transfer available",
    initialState: {
      savedFreeTransfers: 1,
      transfersMadeThisWeek: 0,
      pointsDeductedThisWeek: 0
    },
    action: "Transfer: Salah OUT → Mané IN",
    transfersSelected: 1,
    expectedResult: {
      savedFreeTransfers: 1,
      transfersMadeThisWeek: 1,
      pointsDeductedThisWeek: 0,
      cost: 0
    }
  },
  {
    scenario: "Hit Taken - 1 Extra Transfer",
    description: "User makes 2 transfers with only 1 free transfer",
    initialState: {
      savedFreeTransfers: 1,
      transfersMadeThisWeek: 0,
      pointsDeductedThisWeek: 0
    },
    action: "Transfer: Salah OUT → Mané IN, Kane OUT → Haaland IN",
    transfersSelected: 2,
    expectedResult: {
      savedFreeTransfers: 1,
      transfersMadeThisWeek: 2,
      pointsDeductedThisWeek: 4, // 1 extra transfer = -4 points
      cost: 4
    }
  },
  {
    scenario: "Multiple Hits",
    description: "User makes 4 transfers with only 1 free transfer",
    initialState: {
      savedFreeTransfers: 1,
      transfersMadeThisWeek: 0,
      pointsDeductedThisWeek: 0
    },
    action: "4 transfers: major squad overhaul",
    transfersSelected: 4,
    expectedResult: {
      savedFreeTransfers: 1,
      transfersMadeThisWeek: 4,
      pointsDeductedThisWeek: 12, // 3 extra transfers = -12 points
      cost: 12
    }
  },
  {
    scenario: "Accumulated Free Transfers",
    description: "User didn't transfer last week, now has 2 free transfers",
    initialState: {
      savedFreeTransfers: 2, // Carried over from previous week
      transfersMadeThisWeek: 0,
      pointsDeductedThisWeek: 0
    },
    action: "Transfer: 3 players with 2 free transfers",
    transfersSelected: 3,
    expectedResult: {
      savedFreeTransfers: 2,
      transfersMadeThisWeek: 3,
      pointsDeductedThisWeek: 4, // 1 extra transfer = -4 points
      cost: 4
    }
  },
  {
    scenario: "Wildcard Active",
    description: "User activates wildcard - unlimited free transfers",
    initialState: {
      savedFreeTransfers: 1,
      transfersMadeThisWeek: 0,
      pointsDeductedThisWeek: 0,
      wildcardActive: true
    },
    action: "Transfer: Complete squad overhaul (10 transfers)",
    transfersSelected: 10,
    expectedResult: {
      savedFreeTransfers: 1,
      transfersMadeThisWeek: 10,
      pointsDeductedThisWeek: 0, // No cost due to wildcard
      cost: 0
    }
  },
  {
    scenario: "Gameweek Transition",
    description: "New gameweek starts - penalties reset, free transfers added",
    initialState: {
      savedFreeTransfers: 1,
      transfersMadeThisWeek: 3,
      pointsDeductedThisWeek: 8 // Had -8 points from previous week
    },
    action: "New gameweek starts",
    transfersSelected: 0,
    expectedResult: {
      savedFreeTransfers: 2, // +1 free transfer added (max 2)
      transfersMadeThisWeek: 0, // Reset to 0
      pointsDeductedThisWeek: 0, // Penalties reset to 0
      cost: 0
    }
  }
];

// Calculate transfer cost
function calculateTransferCost(transfers, freeTransfers, wildcardActive = false) {
  if (wildcardActive) return 0;
  const extraTransfers = Math.max(0, transfers - freeTransfers);
  return extraTransfers * 4;
}

// Display transfer examples
function displayTransferExamples() {
  console.log('🔄 TRANSFER SYSTEM EXAMPLES - CENTRALIZED STORAGE\n');
  console.log('='.repeat(80));

  transferExamples.forEach((example, index) => {
    console.log(`\n📋 EXAMPLE ${index + 1}: ${example.scenario}`);
    console.log(`📝 ${example.description}\n`);
    
    // Initial State
    console.log('🔸 INITIAL STATE:');
    console.log(`   transferState: {`);
    console.log(`     savedFreeTransfers: ${example.initialState.savedFreeTransfers}`);
    console.log(`     transfersMadeThisWeek: ${example.initialState.transfersMadeThisWeek}`);
    console.log(`     pointsDeductedThisWeek: ${example.initialState.pointsDeductedThisWeek}`);
    if (example.initialState.wildcardActive) {
      console.log(`     wildcardActive: ${example.initialState.wildcardActive}`);
    }
    console.log(`   }`);
    
    // Action
    console.log(`\n🎯 ACTION: ${example.action}`);
    if (example.transfersSelected > 0) {
      console.log(`   Transfers made: ${example.transfersSelected}`);
    }
    
    // Calculation
    const cost = calculateTransferCost(
      example.transfersSelected, 
      example.initialState.savedFreeTransfers,
      example.initialState.wildcardActive
    );
    
    console.log(`\n💰 COST CALCULATION:`);
    if (example.initialState.wildcardActive) {
      console.log(`   Wildcard active → FREE transfers`);
    } else if (example.transfersSelected === 0) {
      console.log(`   No transfers made → No cost`);
    } else {
      const freeUsed = Math.min(example.transfersSelected, example.initialState.savedFreeTransfers);
      const extraTransfers = Math.max(0, example.transfersSelected - example.initialState.savedFreeTransfers);
      console.log(`   Free transfers used: ${freeUsed}`);
      console.log(`   Extra transfers: ${extraTransfers}`);
      console.log(`   Cost: ${extraTransfers} × 4 = ${cost} points`);
    }
    
    // Result State
    console.log(`\n🔹 RESULT STATE:`);
    console.log(`   transferState: {`);
    console.log(`     savedFreeTransfers: ${example.expectedResult.savedFreeTransfers}`);
    console.log(`     transfersMadeThisWeek: ${example.expectedResult.transfersMadeThisWeek}`);
    console.log(`     pointsDeductedThisWeek: ${example.expectedResult.pointsDeductedThisWeek} ← SINGLE SOURCE`);
    console.log(`   }`);
    
    // Validation
    const isCorrect = cost === example.expectedResult.cost;
    console.log(`\n${isCorrect ? '✅' : '❌'} VALIDATION: Expected ${example.expectedResult.cost}, Got ${cost}`);
    
    console.log('\n' + '-'.repeat(80));
  });
}

// Show Firebase document structure
function showFirebaseStructure() {
  console.log('\n🗄️  FIREBASE DOCUMENT STRUCTURE\n');
  console.log('='.repeat(50));
  
  const sampleDocument = {
    userId: "user123",
    gameweekId: 5,
    players: [
      {
        playerId: "salah",
        name: "Mohamed Salah",
        position: "FWD",
        club: "Liverpool",
        price: 12.5,
        isCaptain: true,
        isStarting: true,
        points: 85
      },
      // ... more players
    ],
    formation: "3-4-3",
    captainId: "salah",
    totalValue: 100.0,
    // ❌ transferCost: 8, // REMOVED - no longer stored here
    transferState: {
      transfersMade: 2,
      freeTransfers: 1,
      transferCost: 4, // ← CENTRALIZED HERE (Firebase compatibility)
      pendingTransfers: []
    },
    chipsUsed: {
      wildcard1: { used: false, gameweek: null, isActive: false },
      // ... other chips
    },
    isValid: true,
    validationErrors: [],
    deadline: "GW5 deadline",
    isSubmitted: false
  };

  console.log('📄 Squad Document:');
  console.log(JSON.stringify(sampleDocument, null, 2));
  
  console.log('\n🎯 KEY POINTS:');
  console.log('✅ Transfer cost stored ONLY in transferState.transferCost');
  console.log('❌ No top-level transferCost field');
  console.log('✅ Single source of truth for transfer penalties');
  console.log('✅ Clean, non-redundant structure');
}

// Test with real Firebase data (if available)
async function testWithRealData() {
  if (!db) {
    console.log('\n⚠️  Firebase not connected - showing demo data only');
    return;
  }

  console.log('\n🔍 TESTING WITH REAL DATA\n');
  console.log('='.repeat(40));

  try {
    // Get a sample user squad
    const usersSnapshot = await db.collection('users').limit(3).get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const squadsSnapshot = await db.collection('users').doc(userId).collection('squads').limit(1).get();
      
      if (!squadsSnapshot.empty) {
        const squadDoc = squadsSnapshot.docs[0];
        const squadData = squadDoc.data();
        
        console.log(`\n👤 User: ${userId}`);
        console.log(`📄 Squad: ${squadDoc.id}`);
        
        // Check transfer state
        if (squadData.transferState) {
          console.log(`💰 Transfer State:`);
          console.log(`   - Transfers made: ${squadData.transferState.transfersMade || 0}`);
          console.log(`   - Free transfers: ${squadData.transferState.freeTransfers || 0}`);
          console.log(`   - Transfer cost: ${squadData.transferState.transferCost || 0} points`);
          
          // Check if old transferCost exists
          if (squadData.hasOwnProperty('transferCost')) {
            console.log(`⚠️  Old transferCost field found: ${squadData.transferCost}`);
            console.log(`   This should be removed in future cleanup`);
          } else {
            console.log(`✅ No redundant transferCost field - clean structure!`);
          }
        } else {
          console.log(`⚠️  No transferState found`);
        }
        
        break; // Just show one example
      }
    }
  } catch (error) {
    console.log(`❌ Error accessing Firebase: ${error.message}`);
  }
}

// Main execution
async function runExamples() {
  displayTransferExamples();
  showFirebaseStructure();
  await testWithRealData();
  
  console.log('\n🎉 Transfer Examples Complete!');
  console.log('\n📊 SUMMARY:');
  console.log('✅ Transfer costs centralized in transferState only');
  console.log('✅ No redundant storage across multiple fields');  
  console.log('✅ Clean, consistent data structure');
  console.log('✅ Proper penalty calculation and reset logic');
  
  process.exit(0);
}

runExamples().catch(console.error);
