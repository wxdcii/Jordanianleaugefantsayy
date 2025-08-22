// TEST MATCHING ACTUAL IMPLEMENTATION
console.log('🔧 TESTING ACTUAL IMPLEMENTATION LOGIC\n');

// This matches the actual calculateTransferCost function
function calculateTransferCost(transfersThisWeek, savedFreeTransfers) {
    const freeTransfersUsed = Math.min(transfersThisWeek, savedFreeTransfers);
    const paidTransfers = Math.max(0, transfersThisWeek - freeTransfersUsed);
    const pointsDeducted = paidTransfers * 4;

    return {
        transfersMade: transfersThisWeek,
        freeTransfersUsed,
        paidTransfers,
        pointsDeducted
    };
}

// This matches the actual applyTransfer logic
function simulateActualApplyTransfer(currentState) {
    const newTransfersThisWeek = currentState.transfersMadeThisWeek + 1;
    
    // Use the fixed logic from fantasyLogic.ts
    const isFirstTransferThisWeek = currentState.transfersMadeThisWeek === 0;
    const originalFreeTransfers = isFirstTransferThisWeek ? 
        currentState.savedFreeTransfers : 
        Math.max(1, currentState.savedFreeTransfers + currentState.transfersMadeThisWeek);
    
    // Calculate summary using TOTAL transfers and ORIGINAL FT count
    const summary = calculateTransferCost(newTransfersThisWeek, originalFreeTransfers);
    
    // Deduct FT for this specific transfer
    const canUseFreeTransfer = newTransfersThisWeek <= originalFreeTransfers;
    const isUsingFreeTransfer = canUseFreeTransfer && (newTransfersThisWeek > currentState.transfersMadeThisWeek);
    
    const newState = {
        ...currentState,
        transfersMadeThisWeek: newTransfersThisWeek,
        pointsDeductedThisWeek: summary.pointsDeducted, // This is the TOTAL cumulative points
        savedFreeTransfers: isUsingFreeTransfer ? currentState.savedFreeTransfers - 1 : currentState.savedFreeTransfers
    };
    
    return { newState, summary };
}

console.log('🎯 ACTUAL TEST: User with 1 FT makes 3 transfers');

let userState = {
    transfersMadeThisWeek: 0,
    pointsDeductedThisWeek: 0,
    savedFreeTransfers: 1
};

console.log('Initial state:', userState);

// Make transfers and see what happens
for (let i = 1; i <= 3; i++) {
    const result = simulateActualApplyTransfer(userState);
    userState = result.newState;
    console.log(`Transfer ${i}:`, {
        state: userState,
        summary: result.summary
    });
}

console.log('\n✅ FINAL RESULT:');
console.log(`Free Transfers: ${userState.savedFreeTransfers} (Expected: 0) ${userState.savedFreeTransfers === 0 ? '✅' : '❌'}`);
console.log(`Points Deducted: ${userState.pointsDeductedThisWeek} (Expected: 8) ${userState.pointsDeductedThisWeek === 8 ? '✅' : '❌'}`);

if (userState.savedFreeTransfers === 0 && userState.pointsDeductedThisWeek === 8) {
    console.log('\n🎉 SUCCESS! The actual implementation logic is CORRECT!');
} else {
    console.log('\n❌ The logic still needs work...');
}
