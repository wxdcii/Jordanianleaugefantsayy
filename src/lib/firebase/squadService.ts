import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// Types for squad data - Updated to match your Firebase structure
export interface SquadPlayer {
  playerId: string;
  name: string;
  position: 'GKP' | 'DEF' | 'MID' | 'FWD';
  club: string;
  price: number;
  points: number;
  isCaptain: boolean;
  isStarting: boolean;
  benchPosition?: number | null;
}

export interface ChipsUsed {
  benchBoost: { gameweek: number | null; isActive: boolean; used: boolean };
  freeHit: { gameweek: number | null; isActive: boolean; used: boolean };
  tripleCaptain: { gameweek: number | null; isActive: boolean; used: boolean };
  wildcard1: { gameweek: number | null; isActive: boolean; used: boolean };
  wildcard2: { gameweek: number | null; isActive: boolean; used: boolean };
}

export interface Transfer {
  playerOut: string;
  playerIn: string;
  cost: number;
  timestamp: string;
}

export interface TransferState {
  transfersMade: number;
  freeTransfers: number;
  transferCost: number;
  pendingTransfers: Transfer[];
}

export interface SavedSquad {
  userId: string;
  gameweekId: number;
  players: SquadPlayer[];
  formation: string;
  captainId: string;
  totalValue: number;
  transferCost: number;
  chipsUsed: ChipsUsed;
  transferState: TransferState;
  substitutions?: { [playerId: string]: 'starting' | 'bench' };
  isValid: boolean;
  validationErrors: string[];
  deadline: string;
  isSubmitted: boolean;
  createdAt?: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 🔍 GET LAST SAVED SQUAD: Get the most recent squad from any previous gameweek
 */
export async function getLastSavedSquad(userId: string, currentGameweek: number): Promise<{
  success: boolean;
  data?: SavedSquad;
  sourceGameweek?: number;
  error?: string;
}> {
  try {
    console.log(`🔍 Looking for last saved squad before GW${currentGameweek} for user ${userId}`);

    const squadsRef = collection(db, 'users', userId, 'squads');
    const querySnapshot = await getDocs(squadsRef);

    let lastSquad: SavedSquad | null = null;
    let lastGameweek = 0;

    // Find the most recent gameweek with a saved squad (before current gameweek)
    for (const doc of querySnapshot.docs) {
      const squadData = doc.data() as SavedSquad;
      const squadGameweek = squadData.gameweekId;

      // Only consider gameweeks before the current one
      if (squadGameweek < currentGameweek && squadGameweek > lastGameweek) {
        lastSquad = squadData;
        lastGameweek = squadGameweek;
      }
    }

    if (lastSquad) {
      console.log(`✅ Found last saved squad from GW${lastGameweek} for user ${userId}`);
      return {
        success: true,
        data: lastSquad,
        sourceGameweek: lastGameweek
      };
    } else {
      console.log(`⚠️ No previous squad found for user ${userId} before GW${currentGameweek}`);
      return {
        success: false,
        error: 'No previous squad found'
      };
    }
  } catch (error) {
    console.error('❌ Error getting last saved squad:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to clean undefined values from objects (Firebase doesn't allow undefined)
function cleanFirebaseData(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirebaseData(item));
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirebaseData(value);
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * 💾 SAVE SQUAD: Save to users/{userId}/squads/{gwX} subcollection
 */
export async function saveUserSquadToSubcollection(
  userId: string,
  gameweek: number,
  squadData: Omit<SavedSquad, 'userId' | 'gameweekId' | 'updatedAt'>
): Promise<{ success: boolean; message: string; squadId?: string }> {
  try {
    console.log(`💾 Saving squad to users/${userId}/squads/gw${gameweek}`);
    
    // Create document reference: users/{userId}/squads/gw{X}
    const squadDocRef = doc(db, 'users', userId, 'squads', `gw${gameweek}`);
    
    // Prepare squad document
    const squadDoc: SavedSquad = {
      userId,
      gameweekId: gameweek,
      ...squadData,
      updatedAt: serverTimestamp() as Timestamp,
      // Add createdAt only if it's a new document
      ...(squadData.createdAt ? {} : { createdAt: serverTimestamp() as Timestamp })
    };

    // Clean undefined values before saving to Firebase
    const cleanedData = cleanFirebaseData(squadDoc);

    console.log('🧹 Cleaned data for Firebase:', {
      hasSubstitutions: !!cleanedData.substitutions,
      substitutionsType: typeof cleanedData.substitutions,
      playersCount: cleanedData.players?.length,
      gameweekId: cleanedData.gameweekId
    });

    // Save to Firestore subcollection (will overwrite if exists)
    await setDoc(squadDocRef, cleanedData);
    
    console.log(`✅ Squad saved successfully to subcollection: gw${gameweek}`);
    return {
      success: true,
      message: 'Squad saved successfully',
      squadId: `gw${gameweek}`
    };
    
  } catch (error) {
    console.error('❌ Error saving squad to subcollection:', error);
    return {
      success: false,
      message: 'Failed to save squad'
    };
  }
}

/**
 * 📥 LOAD SQUAD: Load from users/{userId}/squads/{gwX} subcollection
 * If no squad exists for current gameweek, automatically carry forward last saved squad
 */
export async function getUserSquadFromSubcollection(
  userId: string,
  gameweek: number
): Promise<{ success: boolean; data?: SavedSquad; message?: string; carriedForward?: boolean; sourceGameweek?: number }> {
  try {
    console.log(`📥 Loading squad from users/${userId}/squads/gw${gameweek}`);

    const squadDocRef = doc(db, 'users', userId, 'squads', `gw${gameweek}`);
    const snap = await getDoc(squadDocRef);

    if (snap.exists()) {
      const data = snap.data() as SavedSquad;
      console.log(`✅ Squad loaded: ${data.players.length} players, formation: ${data.formation}`);
      return {
        success: true,
        data: data,
        carriedForward: false
      };
    } else {
      console.log(`ℹ️ No saved squad found for gw${gameweek}, looking for last saved squad to carry forward...`);

      // Try to get the last saved squad from previous gameweeks
      const lastSquadResult = await getLastSavedSquad(userId, gameweek);

      if (lastSquadResult.success && lastSquadResult.data) {
        console.log(`🔄 Carrying forward squad from GW${lastSquadResult.sourceGameweek} to GW${gameweek}`);
        console.log(`🧹 Resetting transfer penalties but accumulating free transfers`);

        // Create a new squad based on the last saved one, but for the current gameweek
        const carriedForwardSquad: SavedSquad = {
          ...lastSquadResult.data,
          gameweekId: gameweek, // Update to current gameweek
          isSubmitted: false,   // Reset submission status
          updatedAt: serverTimestamp() as Timestamp // Update timestamp
        };

        // Clean the data before saving to avoid undefined values
        const cleanSquadData = {
          players: carriedForwardSquad.players || [],
          formation: carriedForwardSquad.formation || '3-4-3',
          captainId: carriedForwardSquad.captainId || '',
          totalValue: carriedForwardSquad.totalValue || 0,
          transferCost: 0, // Reset transfer cost for new gameweek
          chipsUsed: carriedForwardSquad.chipsUsed || {
            wildcard1: { used: false, gameweek: null, isActive: false },
            wildcard2: { used: false, gameweek: null, isActive: false },
            benchBoost: { used: false, gameweek: null, isActive: false },
            tripleCaptain: { used: false, gameweek: null, isActive: false }
          },
          transferState: {
            // Accumulate free transfers but reset penalties
            freeTransfers: Math.min(5, (carriedForwardSquad.transferState?.freeTransfers || 0) + 1),
            transfersMade: 0,        // Reset transfers count
            transferCost: 0,         // Reset penalty points
            pendingTransfers: []     // Reset pending transfers
          },
          substitutions: carriedForwardSquad.substitutions || undefined,
          isValid: carriedForwardSquad.isValid !== undefined ? carriedForwardSquad.isValid : true,
          validationErrors: carriedForwardSquad.validationErrors || [],
          deadline: carriedForwardSquad.deadline || '',
          isSubmitted: false
        };

        // Automatically save the carried forward squad for the current gameweek
        const saveResult = await saveUserSquadToSubcollection(userId, gameweek, cleanSquadData);

        if (saveResult.success) {
          console.log(`✅ Squad successfully carried forward from GW${lastSquadResult.sourceGameweek} to GW${gameweek}`);
          return {
            success: true,
            data: carriedForwardSquad,
            carriedForward: true,
            sourceGameweek: lastSquadResult.sourceGameweek,
            message: `Squad carried forward from Gameweek ${lastSquadResult.sourceGameweek}`
          };
        } else {
          console.error(`❌ Failed to save carried forward squad: ${saveResult.message}`);
          return {
            success: false,
            message: 'Failed to carry forward squad'
          };
        }
      } else {
        console.log(`⚠️ No previous squad found to carry forward for user ${userId}`);
        return {
          success: false,
          message: 'No saved squad found'
        };
      }
    }

  } catch (error) {
    console.error('❌ Error loading squad from subcollection:', error);
    return {
      success: false,
      message: 'Failed to load squad'
    };
  }
}

/**
 * 🔄 UPDATE SQUAD: Update existing squad in subcollection
 */
export async function updateUserSquadInSubcollection(
  userId: string,
  gameweek: number,
  updates: Partial<Omit<SavedSquad, 'userId' | 'gameweekId' | 'updatedAt'>>
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🔄 Updating squad in users/${userId}/squads/gw${gameweek}`);
    
    // Load existing squad
    const existingResult = await getUserSquadFromSubcollection(userId, gameweek);
    if (!existingResult.success || !existingResult.data) {
      return {
        success: false,
        message: 'No existing squad found to update'
      };
    }

    // Merge updates with existing data
    const updatedSquad: SavedSquad = {
      ...existingResult.data,
      ...updates,
      updatedAt: serverTimestamp() as Timestamp
    };

    // Save updated squad
    const squadDocRef = doc(db, 'users', userId, 'squads', `gw${gameweek}`);
    await setDoc(squadDocRef, updatedSquad);
    
    console.log(`✅ Squad updated successfully: gw${gameweek}`);
    return {
      success: true,
      message: 'Squad updated successfully'
    };
    
  } catch (error) {
    console.error('❌ Error updating squad in subcollection:', error);
    return {
      success: false,
      message: 'Failed to update squad'
    };
  }
}

/**
 * 📋 Get all saved squads for a user (history)
 */
export async function getUserSquadHistory(userId: string): Promise<SavedSquad[]> {
  try {
    console.log(`📋 Loading squad history for user ${userId}`);
    
    const squadsCollectionRef = collection(db, 'users', userId, 'squads');
    const querySnapshot = await getDocs(squadsCollectionRef);
    
    const squads: SavedSquad[] = [];
    querySnapshot.forEach((doc) => {
      squads.push(doc.data() as SavedSquad);
    });
    
    // Sort by gameweek
    squads.sort((a, b) => a.gameweekId - b.gameweekId);
    
    console.log(`✅ Loaded ${squads.length} saved squads`);
    return squads;
    
  } catch (error) {
    console.error('❌ Error loading squad history:', error);
    return [];
  }
}

/**
 * 🗑️ Delete a saved squad (if needed)
 */
export async function deleteUserSquadFromSubcollection(
  userId: string, 
  gameweek: number
): Promise<{ success: boolean; message: string }> {
  try {
    const squadDocRef = doc(db, 'users', userId, 'squads', `gw${gameweek}`);
    await setDoc(squadDocRef, {}, { merge: false });
    
    return {
      success: true,
      message: 'Squad deleted successfully'
    };
    
  } catch (error) {
    console.error('❌ Error deleting squad:', error);
    return {
      success: false,
      message: 'Failed to delete squad'
    };
  }
}

/**
 * 🕒 Check if gameweek is open for editing (using gameweeksDeadline collection)
 */
export async function isGameweekOpen(gameweek: number): Promise<boolean> {
  try {
    const docRef = doc(db, 'gameweeksDeadline', `gw${gameweek}`);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      const data = snap.data();
      
      // Check if deadline has passed
      const now = new Date();
      const deadline = data.deadline.toDate();
      
      return data.isOpen && now < deadline;
    }
    
    // If no deadline document exists, assume it's open
    return true;
    
  } catch (error) {
    console.error('❌ Error checking gameweek status:', error);
    return false;
  }
}
