// Test script that matches the actual implementation logic
console.log('🔧 ACTUAL IMPLEMENTATION TEST\n');

// This matches the actual calculateTransferCost function
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

// This matches the actual applyTransfer function logic
function simulateApplyTransfer(currentState, gameweek = 2) {
    const newTransfersThisWeek = currentState.transfersMadeThisWeek + 1;
    
    // This is the key: we need to track the ORIGINAL free transfers for this gameweek
    // The issue is that savedFreeTransfers gets depleted, but calculateTransferCost needs the original amount
    
    // Calculate the summary using current savedFreeTransfers
    const summary = calculateTransferCost(
        newTransfersThisWeek,
        currentState.savedFreeTransfers, // This is the problem! It's being depleted
        gameweek
    );
    
    // Deduct FT for this specific transfer
    const canUseFreeTransfer = newTransfersThisWeek <= currentState.savedFreeTransfers;
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

console.log('🎯 TESTING: User with 1 FT makes 3 transfers');
console.log('Expected: FT=0, Points=8');

let userState = {
    transfersMadeThisWeek: 0,
    pointsDeductedThisWeek: 0,
    savedFreeTransfers: 1,
    originalFreeTransfers: 1 // We need to track this!
};

console.log('Initial:', userState);

// Transfer 1
let result1 = simulateApplyTransfer(userState, 2);
userState = result1.newState;
console.log('Transfer 1:', userState, 'Summary:', result1.summary);

// Transfer 2
let result2 = simulateApplyTransfer(userState, 2);
userState = result2.newState;
console.log('Transfer 2:', userState, 'Summary:', result2.summary);

// Transfer 3
let result3 = simulateApplyTransfer(userState, 2);
userState = result3.newState;
console.log('Transfer 3:', userState, 'Summary:', result3.summary);

console.log('\n❌ PROBLEM IDENTIFIED:');
console.log('The calculateTransferCost function needs the ORIGINAL FT count for the gameweek,');
console.log('but savedFreeTransfers gets depleted after each transfer.');
console.log('This causes incorrect point calculations for later transfers.');
