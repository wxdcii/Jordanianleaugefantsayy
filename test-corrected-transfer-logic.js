// Test the CORRECTED free transfer logic
console.log('🔧 CORRECTED FREE TRANSFER LOGIC TEST\n');

function calculateTransferCost(transfersThisWeek, savedFreeTransfers, gameweek = 2) {
    if (gameweek === 1 || savedFreeTransfers >= 9999) {
        return {
            transfersMade: transfersThisWeek,
            freeTransfersUsed: transfersThisWeek,
            paidTransfers: 0,
            pointsDeducted: 0
        };
    }

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

function simulateCorrectApplyTransfer(currentState, gameweek = 2) {
    const newTransfersThisWeek = currentState.transfersMadeThisWeek + 1;
    
    // CORRECT FIX: Calculate how many free transfers we had at the start of this gameweek
    const freeTransfersUsedThisWeek = Math.min(currentState.transfersMadeThisWeek, 
        currentState.savedFreeTransfers + currentState.transfersMadeThisWeek);
    const originalFreeTransfersThisWeek = currentState.savedFreeTransfers + freeTransfersUsedThisWeek;
    
    const summary = calculateTransferCost(
        newTransfersThisWeek,
        originalFreeTransfersThisWeek, // Use the corrected original FT count
        gameweek
    );
    
    // Deduct FT for this specific transfer
    const canUseFreeTransfer = newTransfersThisWeek <= originalFreeTransfersThisWeek;
    const previousTransfers = currentState.transfersMadeThisWeek;
    const isUsingFreeTransfer = canUseFreeTransfer && (newTransfersThisWeek > previousTransfers);
    
    const newState = {
        ...currentState,
        transfersMadeThisWeek: newTransfersThisWeek,
        pointsDeductedThisWeek: summary.pointsDeducted,
        savedFreeTransfers: isUsingFreeTransfer ? currentState.savedFreeTransfers - 1 : currentState.savedFreeTransfers
    };
    
    return { newState, summary };
}

console.log('🎯 TESTING: User with 1 FT makes 3 transfers (CORRECTED)');
console.log('Expected: FT=0, Points=8 (2 extra transfers × 4 points)');

let userState = {
    transfersMadeThisWeek: 0,
    pointsDeductedThisWeek: 0,
    savedFreeTransfers: 1
};

console.log('Initial:', userState);

// Transfer 1
let result1 = simulateCorrectApplyTransfer(userState, 2);
userState = result1.newState;
console.log('Transfer 1:', userState);
console.log('  Summary:', result1.summary);

// Transfer 2  
let result2 = simulateCorrectApplyTransfer(userState, 2);
userState = result2.newState;
console.log('Transfer 2:', userState);
console.log('  Summary:', result2.summary);

// Transfer 3
let result3 = simulateCorrectApplyTransfer(userState, 2);
userState = result3.newState;
console.log('Transfer 3:', userState);
console.log('  Summary:', result3.summary);

console.log('\n✅ FINAL VALIDATION:');
console.log(`Free Transfers: ${userState.savedFreeTransfers} (Expected: 0) ${userState.savedFreeTransfers === 0 ? '✅' : '❌'}`);
console.log(`Points Deducted: ${userState.pointsDeductedThisWeek} (Expected: 8) ${userState.pointsDeductedThisWeek === 8 ? '✅' : '❌'}`);
console.log(`Transfers Made: ${userState.transfersMadeThisWeek} (Expected: 3) ${userState.transfersMadeThisWeek === 3 ? '✅' : '❌'}`);

if (userState.savedFreeTransfers === 0 && userState.pointsDeductedThisWeek === 8 && userState.transfersMadeThisWeek === 3) {
    console.log('\n🎉 SUCCESS: Free transfer deduction logic is now FIXED!');
} else {
    console.log('\n❌ Still needs more work...');
}
