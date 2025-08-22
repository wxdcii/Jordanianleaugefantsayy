// Simple browser script to reset all users' transfers via API
// Run this in your browser console on your website

async function resetAllUsersTransfers() {
  try {
    console.log('🚀 Starting transfer reset for all users...');
    
    // First, get the current open gameweek
    const gameweekResponse = await fetch('/api/gameweeks/current');
    if (!gameweekResponse.ok) {
      throw new Error('Failed to get current gameweek');
    }
    
    const gameweekData = await gameweekResponse.json();
    const openGameweek = gameweekData.gameweek;
    
    if (!openGameweek) {
      console.log('❌ No open gameweek found');
      return;
    }
    
    console.log(`📊 Resetting transfers for open gameweek: GW${openGameweek}`);
    
    // Get all users (you'll need to implement this endpoint or use Firebase Admin)
    // For now, let's create a batch reset endpoint
    const resetResponse = await fetch('/api/admin/reset-transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameweek: openGameweek,
        freeTransfers: 2,
        resetDeductionPoints: true
      })
    });
    
    if (!resetResponse.ok) {
      throw new Error('Reset API call failed');
    }
    
    const result = await resetResponse.json();
    console.log('✅ Reset completed:', result);
    
  } catch (error) {
    console.error('❌ Error during reset:', error);
    
    // Fallback: Manual reset instructions
    console.log('📝 Manual reset needed. Follow these steps:');
    console.log('1. Go to Firebase Console');
    console.log('2. Navigate to Firestore Database');
    console.log('3. Go to transfers collection');
    console.log('4. For each document, update:');
    console.log('   - transferState.savedFreeTransfers = 2');
    console.log('   - transferState.pointsDeductedThisWeek = 0');
    console.log('   - transferState.transfersMadeThisWeek = 0');
  }
}

// Run the function
resetAllUsersTransfers();
