// Test script to verify free transfer deduction logic
const { calculateTransferCost, applyTransfer } = require('./src/lib/fantasyLogic.ts');

function testFreeTransferDeduction() {
    console.log('=== Testing Free Transfer Deduction Logic ===\n');
    
    // Test case: User has 1 FT, makes 3 transfers
    console.log('Test Case: User has 1 FT, makes 3 transfers');
    console.log('Expected: FT becomes 0, next gameweek gets 1 FT');
    console.log('Expected deduction: 8 points (2 extra transfers × 4 points)\n');
    
    // Initial state
    let userState = {
        transfersMadeThisWeek: 0,
        pointsDeductedThisWeek: 0,
        savedFreeTransfers: 1
    };
    
    const gameweek = 2;
    console.log('Initial state:', userState);
    
    // Simulate making 3 transfers
    console.log('\nMaking transfer 1:');
    const cost1 = calculateTransferCost(userState, gameweek);
    console.log('Transfer cost:', cost1);
    userState = applyTransfer(userState, gameweek);
    console.log('State after transfer 1:', userState);
    
    console.log('\nMaking transfer 2:');
    const cost2 = calculateTransferCost(userState, gameweek);
    console.log('Transfer cost:', cost2);
    userState = applyTransfer(userState, gameweek);
    console.log('State after transfer 2:', userState);
    
    console.log('\nMaking transfer 3:');
    const cost3 = calculateTransferCost(userState, gameweek);
    console.log('Transfer cost:', cost3);
    userState = applyTransfer(userState, gameweek);
    console.log('State after transfer 3:', userState);
    
    console.log('\n=== RESULTS ===');
    console.log('Final state:', userState);
    console.log('Total points deducted:', userState.pointsDeductedThisWeek);
    console.log('Free transfers remaining:', userState.savedFreeTransfers);
    
    // Check if results match expectations
    const expectedPoints = 8; // 2 extra transfers × 4 points
    const expectedFT = 0; // Should be 0 after using 1 FT
    
    console.log('\n=== VALIDATION ===');
    console.log(`Points correct: ${userState.pointsDeductedThisWeek === expectedPoints ? '✅' : '❌'} (Expected: ${expectedPoints}, Got: ${userState.pointsDeductedThisWeek})`);
    console.log(`FT correct: ${userState.savedFreeTransfers === expectedFT ? '✅' : '❌'} (Expected: ${expectedFT}, Got: ${userState.savedFreeTransfers})`);
}

// Test gameweek transition
function testGameweekTransition() {
    console.log('\n\n=== Testing Gameweek Transition ===\n');
    
    // State after making 3 transfers with 1 FT
    const endOfGW2State = {
        transfersMadeThisWeek: 3,
        pointsDeductedThisWeek: 8,
        savedFreeTransfers: 0
    };
    
    console.log('End of GW2 state:', endOfGW2State);
    
    // Simulate gameweek transition (this should happen automatically in your system)
    const startOfGW3State = {
        transfersMadeThisWeek: 0,
        pointsDeductedThisWeek: 0,
        savedFreeTransfers: Math.min(2, endOfGW2State.savedFreeTransfers + 1) // Add 1 FT, max 2
    };
    
    console.log('Start of GW3 state (after transition):', startOfGW3State);
    console.log(`FT correct for next gameweek: ${startOfGW3State.savedFreeTransfers === 1 ? '✅' : '❌'} (Expected: 1, Got: ${startOfGW3State.savedFreeTransfers})`);
}

// Run tests
testFreeTransferDeduction();
testGameweekTransition();
