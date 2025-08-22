#!/usr/bin/env node

/**
 * Test Script: Verify Centralized Transfer Deduction Points
 * 
 * This script tests that transfer deduction points are stored in ONE place only:
 * - transferState.pointsDeductedThisWeek (or transferState.transferCost for Firebase compatibility)
 * 
 * It should NOT be found in:
 * - squad.transferCost (top-level)
 * - Multiple scattered locations
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testCentralizedTransferCost() {
  console.log('🔍 Testing Centralized Transfer Deduction Points...\n');

  try {
    // Test 1: Check squad documents for centralized storage
    console.log('📋 Test 1: Checking squad documents structure...');
    
    const usersSnapshot = await db.collection('users').limit(5).get();
    let testedSquads = 0;
    let correctStructure = 0;
    let incorrectStructure = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // Check squads subcollection
      const squadsSnapshot = await db.collection('users').doc(userId).collection('squads').get();
      
      for (const squadDoc of squadsSnapshot.docs) {
        const squadData = squadDoc.data();
        testedSquads++;
        
        console.log(`\n👤 User: ${userId}, Squad: ${squadDoc.id}`);
        
        // Check if transferCost exists at top level (should NOT exist)
        const hasTopLevelTransferCost = squadData.hasOwnProperty('transferCost');
        
        // Check if transferState.transferCost exists (should exist)
        const hasTransferStateTransferCost = squadData.transferState?.hasOwnProperty('transferCost') || 
                                           squadData.transferState?.hasOwnProperty('pointsDeductedThisWeek');
        
        if (!hasTopLevelTransferCost && hasTransferStateTransferCost) {
          correctStructure++;
          console.log('✅ CORRECT: Transfer cost stored only in transferState');
          console.log(`   - transferState.transferCost: ${squadData.transferState?.transferCost || 0}`);
          console.log(`   - transferState.pointsDeductedThisWeek: ${squadData.transferState?.pointsDeductedThisWeek || 0}`);
        } else {
          incorrectStructure++;
          console.log('❌ INCORRECT: Transfer cost storage issue');
          if (hasTopLevelTransferCost) {
            console.log(`   - Found top-level transferCost: ${squadData.transferCost}`);
          }
          if (!hasTransferStateTransferCost) {
            console.log('   - Missing transferState.transferCost/pointsDeductedThisWeek');
          }
        }
        
        // Show transfer state structure
        if (squadData.transferState) {
          console.log('📊 Transfer State Structure:');
          Object.keys(squadData.transferState).forEach(key => {
            console.log(`   - ${key}: ${squadData.transferState[key]}`);
          });
        }
        
        if (testedSquads >= 10) break; // Limit to 10 squads for testing
      }
      
      if (testedSquads >= 10) break;
    }

    // Test 2: Verify no redundant storage
    console.log('\n📋 Test 2: Checking for redundant transfer cost storage...');
    
    const fantasyTeamsSnapshot = await db.collection('fantasy-teams').limit(5).get();
    let testedTeams = 0;
    let redundantStorage = 0;
    
    for (const teamDoc of fantasyTeamsSnapshot.docs) {
      const teamData = teamDoc.data();
      testedTeams++;
      
      console.log(`\n🏈 Team: ${teamDoc.id}`);
      
      const hasTopLevelTransferCost = teamData.hasOwnProperty('transferCost');
      const hasTransferStateTransferCost = teamData.transferState?.hasOwnProperty('transferCost') || 
                                         teamData.transferState?.hasOwnProperty('pointsDeductedThisWeek');
      
      if (hasTopLevelTransferCost && hasTransferStateTransferCost) {
        redundantStorage++;
        console.log('⚠️  REDUNDANT: Transfer cost stored in multiple places');
        console.log(`   - Top-level transferCost: ${teamData.transferCost}`);
        console.log(`   - transferState.transferCost: ${teamData.transferState?.transferCost || 0}`);
      } else if (hasTransferStateTransferCost) {
        console.log('✅ GOOD: Transfer cost stored only in transferState');
      } else {
        console.log('ℹ️  No transfer cost data found');
      }
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`├── Squads tested: ${testedSquads}`);
    console.log(`├── Correct structure: ${correctStructure}`);
    console.log(`├── Incorrect structure: ${incorrectStructure}`);
    console.log(`├── Teams tested: ${testedTeams}`);
    console.log(`└── Redundant storage found: ${redundantStorage}`);
    
    if (incorrectStructure === 0 && redundantStorage === 0) {
      console.log('\n🎉 SUCCESS: Transfer deduction points are properly centralized!');
      console.log('✅ Single source of truth: transferState.transferCost/pointsDeductedThisWeek');
    } else {
      console.log('\n⚠️  ISSUES FOUND: Transfer cost storage needs cleanup');
      if (incorrectStructure > 0) {
        console.log(`❌ ${incorrectStructure} squads have incorrect structure`);
      }
      if (redundantStorage > 0) {
        console.log(`❌ ${redundantStorage} teams have redundant storage`);
      }
    }

  } catch (error) {
    console.error('💥 Error testing centralized transfer cost:', error);
  }
}

// Test specific transfer cost scenarios
async function testTransferCostScenarios() {
  console.log('\n🧪 Testing Transfer Cost Scenarios...\n');

  const scenarios = [
    { transfers: 0, freeTransfers: 1, expected: 0 },
    { transfers: 1, freeTransfers: 1, expected: 0 },
    { transfers: 2, freeTransfers: 1, expected: 4 },
    { transfers: 3, freeTransfers: 2, expected: 4 },
    { transfers: 5, freeTransfers: 1, expected: 16 }
  ];

  scenarios.forEach((scenario, index) => {
    const extraTransfers = Math.max(0, scenario.transfers - scenario.freeTransfers);
    const cost = extraTransfers * 4;
    
    console.log(`📝 Scenario ${index + 1}:`);
    console.log(`   - Transfers made: ${scenario.transfers}`);
    console.log(`   - Free transfers: ${scenario.freeTransfers}`);
    console.log(`   - Extra transfers: ${extraTransfers}`);
    console.log(`   - Expected cost: ${scenario.expected} points`);
    console.log(`   - Calculated cost: ${cost} points`);
    console.log(`   - ${cost === scenario.expected ? '✅ CORRECT' : '❌ INCORRECT'}`);
    console.log('');
  });
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Centralized Transfer Cost Tests...\n');
  
  await testCentralizedTransferCost();
  await testTransferCostScenarios();
  
  console.log('\n✨ Tests completed!');
  process.exit(0);
}

runTests().catch(console.error);
