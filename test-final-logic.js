// Test the FINAL corrected logic
console.log('🔧 TESTING FINAL CORRECTED LOGIC\n');

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

function simulateFinalCorrectLogic(currentState) {
    const newTransfersThisWeek = currentState.transfersMadeThisWeek + 1;
    
    // FINAL CORRECTED LOGIC from fantasyLogic.ts
    let originalFreeTransfers;
    if (currentState.transfersMadeThisWeek === 0) {
        // First transfer this week - use current count as the original
        originalFreeTransfers = currentState.savedFreeTransfers;
    } else {
        // Subsequent transfers - reconstruct original count
        const freeTransfersLikelyUsed = Math.min(currentState.transfersMadeThisWeek, 2); // Max 2 FT per gameweek
        originalFreeTransfers = currentState.savedFreeTransfers + freeTransfersLikelyUsed;
    }
    
    const summary = calculateTransferCost(newTransfersThisWeek, originalFreeTransfers);
    
    // Deduct FT for this specific transfer
    const canUseFreeTransfer = newTransfersThisWeek <= originalFreeTransfers;
    const isUsingFreeTransfer = canUseFreeTransfer && (newTransfersThisWeek > currentState.transfersMadeThisWeek);
    
    const newState = {
        ...currentState,
        transfersMadeThisWeek: newTransfersThisWeek,
        pointsDeductedThisWeek: summary.pointsDeducted,
        savedFreeTransfers: isUsingFreeTransfer ? currentState.savedFreeTransfers - 1 : currentState.savedFreeTransfers
    };
    
    return { newState, summary, originalFreeTransfers };
}

console.log('🎯 FINAL TEST: User with 1 FT makes 3 transfers');

let userState = {
    transfersMadeThisWeek: 0,
    pointsDeductedThisWeek: 0,
    savedFreeTransfers: 1
};

console.log('Initial state:', userState);

// Make transfers
for (let i = 1; i <= 3; i++) {
    const result = simulateFinalCorrectLogic(userState);
    userState = result.newState;
    console.log(`Transfer ${i}:`, {
        originalFT: result.originalFreeTransfers,
        state: userState,
        summary: result.summary
    });
}

console.log('\n✅ FINAL VALIDATION:');
console.log(`Free Transfers: ${userState.savedFreeTransfers} (Expected: 0) ${userState.savedFreeTransfers === 0 ? '✅' : '❌'}`);
console.log(`Points Deducted: ${userState.pointsDeductedThisWeek} (Expected: 8) ${userState.pointsDeductedThisWeek === 8 ? '✅' : '❌'}`);

if (userState.savedFreeTransfers === 0 && userState.pointsDeductedThisWeek === 8) {
    console.log('\n🎉 PERFECT! The logic is now completely FIXED!');
} else {
    console.log('\n🔍 Let me analyze what\'s happening...');
    console.log('This might be a fundamental architectural issue that needs a different approach.');
}
