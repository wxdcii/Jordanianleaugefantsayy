// Test the simplified transfer logic
import { applyTransfer } from './src/lib/fantasyLogic';

console.log('🧪 Testing FIXED transfer logic...\n');

// Test 1: User with 1 free transfer makes first transfer
console.log('=== Test 1: User with 1 FT makes 1 transfer ===');
const state1 = {
  savedFreeTransfers: 1,
  transfersMadeThisWeek: 0,
  pointsDeductedThisWeek: 0,
  wildcardActive: false,
  freeHitActive: false,
  lastGameweekProcessed: 4
};

const result1 = applyTransfer(state1, 4);
console.log('Input:', state1);
console.log('Result:', result1);
console.log('Expected: 0 points deducted, 0 FT remaining\n');

// Test 2: User with 0 free transfers makes transfer
console.log('=== Test 2: User with 0 FT makes 1 transfer ===');
const state2 = {
  savedFreeTransfers: 0,
  transfersMadeThisWeek: 0,
  pointsDeductedThisWeek: 0,
  wildcardActive: false,
  freeHitActive: false,
  lastGameweekProcessed: 4
};

const result2 = applyTransfer(state2, 4);
console.log('Input:', state2);
console.log('Result:', result2);
console.log('Expected: 4 points deducted, 0 FT remaining\n');

// Test 3: User with 2 free transfers makes first transfer
console.log('=== Test 3: User with 2 FT makes 1 transfer ===');
const state3 = {
  savedFreeTransfers: 2,
  transfersMadeThisWeek: 0,
  pointsDeductedThisWeek: 0,
  wildcardActive: false,
  freeHitActive: false,
  lastGameweekProcessed: 4
};

const result3 = applyTransfer(state3, 4);
console.log('Input:', state3);
console.log('Result:', result3);
console.log('Expected: 0 points deducted, 1 FT remaining\n');
