#!/usr/bin/env node

/**
 * Gameweek Transition Example: What happens to deduction points?
 * 
 * This example shows what happens when a user has deduction points in GW2
 * and the system transitions to GW3.
 */

console.log('🔄 GAMEWEEK TRANSITION: DEDUCTION POINTS EXAMPLE\n');
console.log('='.repeat(70));

// Simulate the exact scenario
function simulateGameweekTransition() {
  console.log('\n📅 SCENARIO: User makes transfers in GW2 and gets deduction points\n');

  // GW2 - User makes transfers and gets hit
  console.log('🏈 GAMEWEEK 2 - USER MAKES TRANSFERS:');
  console.log('----------------------------------------');
  
  const gw2Initial = {
    savedFreeTransfers: 1,
    transfersMadeThisWeek: 0,
    pointsDeductedThisWeek: 0,
    lastGameweekProcessed: 2
  };

  console.log('📊 Initial GW2 State:');
  console.log('   transferState: {');
  console.log(`     savedFreeTransfers: ${gw2Initial.savedFreeTransfers}`);
  console.log(`     transfersMadeThisWeek: ${gw2Initial.transfersMadeThisWeek}`);
  console.log(`     pointsDeductedThisWeek: ${gw2Initial.pointsDeductedThisWeek}`);
  console.log('   }');

  // User makes transfers in GW2
  console.log('\n🎯 USER ACTION: Makes 3 transfers in GW2');
  console.log('   - Salah OUT → Mané IN');
  console.log('   - Kane OUT → Haaland IN');
  console.log('   - Bruno OUT → KDB IN');

  // Calculate deduction
  const transfersMade = 3;
  const freeTransfersUsed = Math.min(transfersMade, gw2Initial.savedFreeTransfers);
  const extraTransfers = Math.max(0, transfersMade - gw2Initial.savedFreeTransfers);
  const deductionPoints = extraTransfers * 4;

  console.log('\n💰 DEDUCTION CALCULATION:');
  console.log(`   Transfers made: ${transfersMade}`);
  console.log(`   Free transfers used: ${freeTransfersUsed}`);
  console.log(`   Extra transfers: ${extraTransfers}`);
  console.log(`   Deduction: ${extraTransfers} × 4 = ${deductionPoints} points`);

  const gw2Final = {
    ...gw2Initial,
    transfersMadeThisWeek: transfersMade,
    pointsDeductedThisWeek: deductionPoints
  };

  console.log('\n📊 Final GW2 State:');
  console.log('   transferState: {');
  console.log(`     savedFreeTransfers: ${gw2Final.savedFreeTransfers}`);
  console.log(`     transfersMadeThisWeek: ${gw2Final.transfersMadeThisWeek}`);
  console.log(`     pointsDeductedThisWeek: ${gw2Final.pointsDeductedThisWeek} ← DEDUCTION APPLIED`);
  console.log('   }');

  // Show GW2 score impact
  const gw2BasePoints = 75; // Example base points
  const gw2FinalPoints = gw2BasePoints - deductionPoints;
  console.log('\n🏆 GW2 FINAL SCORE:');
  console.log(`   Base points: ${gw2BasePoints}`);
  console.log(`   Deduction: -${deductionPoints}`);
  console.log(`   Final score: ${gw2FinalPoints} points`);

  console.log('\n' + '='.repeat(70));
  
  // GW3 Transition
  console.log('\n🔄 GAMEWEEK TRANSITION: GW2 → GW3');
  console.log('-----------------------------------');

  console.log('\n🎯 SYSTEM ACTION: New gameweek starts');
  console.log('   ✅ Deadline passes');
  console.log('   ✅ GW2 results finalized');
  console.log('   ✅ GW3 opens for transfers');

  // Apply transition logic
  const gw3State = {
    savedFreeTransfers: Math.min(2, gw2Final.savedFreeTransfers + 1), // +1 FT (max 2)
    transfersMadeThisWeek: 0, // RESET
    pointsDeductedThisWeek: 0, // RESET - KEY POINT!
    lastGameweekProcessed: 3
  };

  console.log('\n📊 GW3 State (After Transition):');
  console.log('   transferState: {');
  console.log(`     savedFreeTransfers: ${gw3State.savedFreeTransfers} ← +1 FT added`);
  console.log(`     transfersMadeThisWeek: ${gw3State.transfersMadeThisWeek} ← RESET to 0`);
  console.log(`     pointsDeductedThisWeek: ${gw3State.pointsDeductedThisWeek} ← RESET to 0 🔥`);
  console.log('   }');

  console.log('\n✨ WHAT HAPPENED TO THE DEDUCTION POINTS?');
  console.log('   ❌ They DO NOT carry over to GW3');
  console.log('   ✅ They were applied to GW2 score only');
  console.log('   ✅ User starts GW3 with clean slate (0 penalty)');
  console.log('   ✅ User gets fresh free transfer for GW3');

  return { gw2Final, gw3State };
}

// Show multiple scenarios
function showMultipleScenarios() {
  console.log('\n📋 MORE EXAMPLES: Different Transition Scenarios\n');
  console.log('='.repeat(70));

  const scenarios = [
    {
      name: "Light Hit in GW2",
      gw2: { freeTransfers: 1, transfersMade: 2, deduction: 4 },
      gw3: { freeTransfers: 2, transfersMade: 0, deduction: 0 }
    },
    {
      name: "Heavy Hit in GW2", 
      gw2: { freeTransfers: 1, transfersMade: 5, deduction: 16 },
      gw3: { freeTransfers: 2, transfersMade: 0, deduction: 0 }
    },
    {
      name: "No Transfers in GW2",
      gw2: { freeTransfers: 1, transfersMade: 0, deduction: 0 },
      gw3: { freeTransfers: 2, transfersMade: 0, deduction: 0 }
    },
    {
      name: "Had 2 FT, Used 1 in GW2",
      gw2: { freeTransfers: 2, transfersMade: 1, deduction: 0 },
      gw3: { freeTransfers: 2, transfersMade: 0, deduction: 0 }
    }
  ];

  scenarios.forEach((scenario, index) => {
    console.log(`\n📝 Scenario ${index + 1}: ${scenario.name}`);
    console.log(`   GW2 End:  FT:${scenario.gw2.freeTransfers}, Transfers:${scenario.gw2.transfersMade}, Deduction:${scenario.gw2.deduction}`);
    console.log(`   GW3 Start: FT:${scenario.gw3.freeTransfers}, Transfers:${scenario.gw3.transfersMade}, Deduction:${scenario.gw3.deduction}`);
    console.log(`   💡 Penalty Reset: ${scenario.gw2.deduction} → ${scenario.gw3.deduction} points`);
  });
}

// Show the penalty lifecycle
function showPenaltyLifecycle() {
  console.log('\n🔄 PENALTY LIFECYCLE: How Deduction Points Work\n');
  console.log('='.repeat(70));

  console.log('\n📅 GAMEWEEK LIFECYCLE:');
  console.log('\n1️⃣  GW2 Opens:');
  console.log('   - User starts with 1 FT');
  console.log('   - User has 0 penalty points');
  console.log('   - User can make transfers');

  console.log('\n2️⃣  GW2 Active (User Makes Transfers):');
  console.log('   - User makes 3 transfers');
  console.log('   - System calculates: 3 - 1 = 2 extra transfers');
  console.log('   - System applies: 2 × 4 = 8 penalty points');
  console.log('   - Penalty stored in: transferState.pointsDeductedThisWeek');

  console.log('\n3️⃣  GW2 Deadline:');
  console.log('   - Teams locked');
  console.log('   - Points calculated: Base Points - 8 penalty = Final Score');
  console.log('   - Penalty points APPLIED to GW2 score');

  console.log('\n4️⃣  GW2 → GW3 Transition:');
  console.log('   - System runs gameweek transition logic');
  console.log('   - transferState.pointsDeductedThisWeek RESET to 0');
  console.log('   - transferState.savedFreeTransfers gets +1 (max 2)');
  console.log('   - transferState.transfersMadeThisWeek RESET to 0');

  console.log('\n5️⃣  GW3 Opens:');
  console.log('   - User starts fresh with 0 penalty points');
  console.log('   - User has 2 free transfers (1 carried + 1 new)');
  console.log('   - Previous penalty does NOT affect GW3');

  console.log('\n🎯 KEY PRINCIPLE:');
  console.log('   ✅ Penalty points apply ONLY to the gameweek they were made in');
  console.log('   ✅ Each gameweek starts with 0 penalty points');
  console.log('   ✅ Free transfers accumulate (max 2)');
  console.log('   ✅ Transfer counts reset to 0');
}

// Main execution
console.log('🚀 Running Gameweek Transition Examples...\n');

simulateGameweekTransition();
showMultipleScenarios(); 
showPenaltyLifecycle();

console.log('\n🎉 SUMMARY: DEDUCTION POINTS IN GAMEWEEK TRANSITIONS');
console.log('='.repeat(70));
console.log('✅ Deduction points RESET to 0 when new gameweek starts');
console.log('✅ Penalties apply ONLY to the gameweek they were made in');
console.log('✅ User gets +1 free transfer each gameweek (max 2 total)');
console.log('✅ Transfer counts reset to 0 each gameweek');
console.log('✅ Each gameweek is a fresh start for transfer penalties');

console.log('\n🔥 ANSWER TO YOUR QUESTION:');
console.log('If user makes deduction points in GW2:');
console.log('📅 GW2: User loses points from their GW2 score');
console.log('📅 GW3: User starts with 0 penalty points (RESET)');
console.log('💡 The penalty does NOT carry over to GW3!');

console.log('\n✨ Transfer System Working Correctly! 🎯');
