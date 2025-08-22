import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  Timestamp, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
// UserChips interface
export interface UserChips {
  wildcard1UsedGW: number | null;
  wildcard2UsedGW: number | null;
  benchBoostUsedGW: number | null;
  tripleCaptainUsedGW: number | null;
  freeHitUsedGW: number | null;
}

// Wildcard periods
export const WILDCARD_PERIODS = {
  WILDCARD_1: { start: 2, end: 13, name: 'Wildcard 1' },
  WILDCARD_2: { start: 14, end: 27, name: 'Wildcard 2' }
} as const;

// Get user's chips data
export const getUserChips = async (userId: string): Promise<UserChips> => {
  try {
    const chipsRef = doc(db, 'users', userId, 'chips', 'data');
    const chipsSnap = await getDoc(chipsRef);
    
    if (chipsSnap.exists()) {
      return chipsSnap.data() as UserChips;
    }
    
    // Return default chips if none exist
    const defaultChips: UserChips = {
      wildcard1UsedGW: null,
      wildcard2UsedGW: null,
      benchBoostUsedGW: null,
      tripleCaptainUsedGW: null,
      freeHitUsedGW: null
    };
    
    // Create default chips document
    await setDoc(chipsRef, {
      ...defaultChips,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return defaultChips;
  } catch (error) {
    console.error('❌ Error getting user chips:', error);
    // Return default on error
    return {
      wildcard1UsedGW: null,
      wildcard2UsedGW: null,
      benchBoostUsedGW: null,
      tripleCaptainUsedGW: null,
      freeHitUsedGW: null
    };
  }
};

// Check if wildcard is available for current gameweek
export const isWildcardAvailable = async (userId: string, gameweek: number): Promise<{
  wildcard1Available: boolean;
  wildcard2Available: boolean;
  canUseWildcard1: boolean;
  canUseWildcard2: boolean;
}> => {
  try {
    const userChips = await getUserChips(userId);
    
    // Check if gameweek is in wildcard periods
    const inWildcard1Period = gameweek >= WILDCARD_PERIODS.WILDCARD_1.start && gameweek <= WILDCARD_PERIODS.WILDCARD_1.end;
    const inWildcard2Period = gameweek >= WILDCARD_PERIODS.WILDCARD_2.start && gameweek <= WILDCARD_PERIODS.WILDCARD_2.end;
    
    // Check if wildcards have been used
    const wildcard1Used = userChips.wildcard1UsedGW !== null;
    const wildcard2Used = userChips.wildcard2UsedGW !== null;
    
    return {
      wildcard1Available: !wildcard1Used,
      wildcard2Available: !wildcard2Used,
      canUseWildcard1: inWildcard1Period && !wildcard1Used,
      canUseWildcard2: inWildcard2Period && !wildcard2Used
    };
  } catch (error) {
    console.error('❌ Error checking wildcard availability:', error);
    return {
      wildcard1Available: false,
      wildcard2Available: false,
      canUseWildcard1: false,
      canUseWildcard2: false
    };
  }
};

// Use wildcard for current gameweek
export const useWildcard = async (userId: string, gameweek: number, wildcardType: 'wildcard1' | 'wildcard2'): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const availability = await isWildcardAvailable(userId, gameweek);
    
    // Validate wildcard usage
    if (wildcardType === 'wildcard1' && !availability.canUseWildcard1) {
      return {
        success: false,
        error: availability.wildcard1Available 
          ? `Wildcard 1 can only be used between GW${WILDCARD_PERIODS.WILDCARD_1.start}-${WILDCARD_PERIODS.WILDCARD_1.end}`
          : 'Wildcard 1 has already been used'
      };
    }
    
    if (wildcardType === 'wildcard2' && !availability.canUseWildcard2) {
      return {
        success: false,
        error: availability.wildcard2Available 
          ? `Wildcard 2 can only be used between GW${WILDCARD_PERIODS.WILDCARD_2.start}-${WILDCARD_PERIODS.WILDCARD_2.end}`
          : 'Wildcard 2 has already been used'
      };
    }
    
    // Update chips document
    const chipsRef = doc(db, 'users', userId, 'chips', 'data');
    const updateData = {
      [`${wildcardType}UsedGW`]: gameweek,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(chipsRef, updateData);
    
    console.log(`✅ ${wildcardType} used for GW${gameweek} by user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error using wildcard:', error);
    return {
      success: false,
      error: 'Failed to activate wildcard. Please try again.'
    };
  }
};

// Check if any chip is active for gameweek
export const getActiveChips = async (userId: string, gameweek: number): Promise<{
  wildcardActive: boolean;
  benchBoostActive: boolean;
  tripleCaptainActive: boolean;
  freeHitActive: boolean;
  activeChipName?: string;
}> => {
  try {
    const userChips = await getUserChips(userId);
    
    const wildcardActive = userChips.wildcard1UsedGW === gameweek || userChips.wildcard2UsedGW === gameweek;
    const benchBoostActive = userChips.benchBoostUsedGW === gameweek;
    const tripleCaptainActive = userChips.tripleCaptainUsedGW === gameweek;
    const freeHitActive = userChips.freeHitUsedGW === gameweek;
    
    let activeChipName: string | undefined;
    if (wildcardActive) activeChipName = 'Wildcard';
    else if (benchBoostActive) activeChipName = 'Bench Boost';
    else if (tripleCaptainActive) activeChipName = 'Triple Captain';
    else if (freeHitActive) activeChipName = 'Free Hit';
    
    return {
      wildcardActive,
      benchBoostActive,
      tripleCaptainActive,
      freeHitActive,
      activeChipName
    };
  } catch (error) {
    console.error('❌ Error getting active chips:', error);
    return {
      wildcardActive: false,
      benchBoostActive: false,
      tripleCaptainActive: false,
      freeHitActive: false
    };
  }
};

// Get wildcard usage summary
export const getWildcardSummary = async (userId: string): Promise<{
  wildcard1: { used: boolean; gameweek: number | null; period: string };
  wildcard2: { used: boolean; gameweek: number | null; period: string };
}> => {
  try {
    const userChips = await getUserChips(userId);
    
    return {
      wildcard1: {
        used: userChips.wildcard1UsedGW !== null,
        gameweek: userChips.wildcard1UsedGW,
        period: `GW${WILDCARD_PERIODS.WILDCARD_1.start}-${WILDCARD_PERIODS.WILDCARD_1.end}`
      },
      wildcard2: {
        used: userChips.wildcard2UsedGW !== null,
        gameweek: userChips.wildcard2UsedGW,
        period: `GW${WILDCARD_PERIODS.WILDCARD_2.start}-${WILDCARD_PERIODS.WILDCARD_2.end}`
      }
    };
  } catch (error) {
    console.error('❌ Error getting wildcard summary:', error);
    return {
      wildcard1: { used: false, gameweek: null, period: `GW${WILDCARD_PERIODS.WILDCARD_1.start}-${WILDCARD_PERIODS.WILDCARD_1.end}` },
      wildcard2: { used: false, gameweek: null, period: `GW${WILDCARD_PERIODS.WILDCARD_2.start}-${WILDCARD_PERIODS.WILDCARD_2.end}` }
    };
  }
};

// Validate team changes based on deadline and wildcard status
export const validateTeamChange = async (userId: string, gameweek: number, action: string): Promise<{
  allowed: boolean;
  reason?: string;
  wildcardActive?: boolean;
}> => {
  try {
    // Use gameweekDeadlineService for deadline check
    const { GameweekDeadlineService } = await import('./gameweekDeadlineService');

    const canMakeChanges = await GameweekDeadlineService.canMakeChanges(gameweek);
    if (!canMakeChanges.allowed) {
      return {
        allowed: false,
        reason: canMakeChanges.reason
      };
    }
    
    const activeChips = await getActiveChips(userId, gameweek);
    
    return {
      allowed: true,
      wildcardActive: activeChips.wildcardActive
    };
  } catch (error) {
    console.error('❌ Error validating team change:', error);
    return {
      allowed: false,
      reason: 'Error validating team change. Please try again.'
    };
  }
};

// Reset chips for new season (admin function)
export const resetUserChips = async (userId: string): Promise<boolean> => {
  try {
    const chipsRef = doc(db, 'users', userId, 'chips', 'data');
    const defaultChips: UserChips = {
      wildcard1UsedGW: null,
      wildcard2UsedGW: null,
      benchBoostUsedGW: null,
      tripleCaptainUsedGW: null,
      freeHitUsedGW: null
    };
    
    await setDoc(chipsRef, {
      ...defaultChips,
      resetAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Chips reset for user ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error resetting user chips:', error);
    return false;
  }
};
