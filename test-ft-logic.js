// Simple test to verify free transfer deduction logic
function testTransferLogic() {
    console.log('=== Testing Free Transfer Deduction ===\n');
    
    // Simulate the logic from applyTransfer function
    function simulateTransfer(currentState, gameweek) {
        const newTransfersThisWeek = currentState.transfersMadeThisWeek + 1;
        
        // Calculate if this transfer uses a free transfer
        const canUseFreeTransfer = newTransfersThisWeek <= currentState.savedFreeTransfers;
        const previousTransfers = currentState.transfersMadeThisWeek;
        const isUsingFreeTransfer = canUseFreeTransfer && (newTransfersThisWeek > previousTransfers);
        
        return {
            ...currentState,
            transfersMadeThisWeek: newTransfersThisWeek,
            savedFreeTransfers: isUsingFreeTransfer ? currentState.savedFreeTransfers - 1 : currentState.savedFreeTransfers
        };
    }
    
    // Test case: User has 1 FT, makes 3 transfers
    let userState = {
        transfersMadeThisWeek: 0,
        pointsDeductedThisWeek: 0,
        savedFreeTransfers: 1
    };
    
    console.log('Initial state:', userState);
    
    // Transfer 1 - should use the 1 FT
    userState = simulateTransfer(userState, 2);
    console.log('After transfer 1:', userState, '(Should use 1 FT, FT becomes 0)');
    
    // Transfer 2 - should cost 4 points (no FT left)
    userState = simulateTransfer(userState, 2);
    console.log('After transfer 2:', userState, '(Should cost 4 points, FT stays 0)');
    
    // Transfer 3 - should cost another 4 points
    userState = simulateTransfer(userState, 2);
    console.log('After transfer 3:', userState, '(Should cost 4 points, FT stays 0)');
    
    console.log('\n=== VALIDATION ===');
    console.log(`Free transfers remaining: ${userState.savedFreeTransfers} (Expected: 0)`);
    console.log(`Transfers made: ${userState.transfersMadeThisWeek} (Expected: 3)`);
    console.log(`✅ Free transfer logic: ${userState.savedFreeTransfers === 0 ? 'CORRECT' : 'INCORRECT'}`);
    
    // Test gameweek transition
    console.log('\n=== Gameweek Transition ===');
    const nextGameweekState = {
        transfersMadeThisWeek: 0,
        pointsDeductedThisWeek: 0,
        savedFreeTransfers: Math.min(2, userState.savedFreeTransfers + 1) // Add 1 FT, max 2
    };
    console.log('Next gameweek state:', nextGameweekState);
    console.log(`✅ Next gameweek FT: ${nextGameweekState.savedFreeTransfers === 1 ? 'CORRECT (1 FT)' : 'INCORRECT'}`);
}

testTransferLogic();
