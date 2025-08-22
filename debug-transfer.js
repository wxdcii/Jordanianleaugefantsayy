// Simple test to debug the transfer issue
import { calculateTransferCost, applyTransfer } from './src/lib/fantasyLogic.ts';

// Test scenario: User has 1 free transfer, makes 1 transfer
const initialState = {
  savedFreeTransfers: 1,
  transfersMadeThisWeek: 0,
  pointsDeductedThisWeek: 0,
  wildcardActive: false,
  freeHitActive: false,
  lastGameweekProcessed: 4
};

console.log('🧪 Testing transfer logic...');
console.log('Initial state:', initialState);

// Test the cost calculation directly
const costResult = calculateTransferCost(1, 1, 4, false, false);
console.log('Direct cost calculation (1 transfer, 1 FT):', costResult);

// Test the apply transfer function
const applyResult = applyTransfer(initialState, 4);
console.log('Apply transfer result:', applyResult);

// Expected: 0 points deducted since user has 1 free transfer

// Test scenario 2: User makes second transfer (should cost points)
console.log('\n🧪 Testing second transfer...');
const secondApplyResult = applyTransfer(applyResult.newState, 4);
console.log('Second transfer result:', secondApplyResult);

// Expected: 4 points deducted since no free transfers left
