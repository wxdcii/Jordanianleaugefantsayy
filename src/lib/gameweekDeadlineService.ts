import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Define a reusable Gameweek interface
interface Gameweek {
  gw: number;
  startDate: string;
  deadline: string;
  isOpen: boolean;
}

// Deadline service using gameweeksDeadline collection
export class GameweekDeadlineService {
  
  // Get current active gameweek (first one where isOpen == true)
  static async getCurrentGameweek(): Promise<Gameweek | null> {
    try {
      console.log('🔍 Getting current gameweek where isOpen == true...');
      
      const gameweeksRef = collection(db, 'gameweeksDeadline');
      const q = query(gameweeksRef, where('isOpen', '==', true), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data: Gameweek = doc.data() as Gameweek;
        console.log('✅ Found current gameweek:', data);
        return data as Gameweek;
      }
      
      console.log('❌ No open gameweek found');
      return null;
    } catch (error) {
      console.error('❌ Error getting current gameweek:', error);
      return null;
    }
  }

  // Get a specific gameweek by ID
  static async getGameweekById(gameweekId: number): Promise<Gameweek | null> {
    try {
      console.log(`🔍 Getting gameweek ${gameweekId} from database...`);

      const gameweekRef = doc(db, 'gameweeksDeadline', gameweekId.toString());
      const gameweekSnap = await getDoc(gameweekRef);

      if (!gameweekSnap.exists()) {
        console.log(`⚠️ Gameweek ${gameweekId} not found`);
        return null;
      }

      const data = gameweekSnap.data() as Gameweek;
      console.log(`✅ Found gameweek ${gameweekId}: isOpen=${data.isOpen}`);
      return data;
    } catch (error) {
      console.error(`❌ Error getting gameweek ${gameweekId}:`, error);
      return null;
    }
  }

  // Check if current time is before deadline
  static async isBeforeDeadline(gameweekId: number): Promise<boolean> {
    try {
      console.log(`🔍 Checking if before deadline for GW${gameweekId}...`);
      
      const gameweekRef = doc(db, 'gameweeksDeadline', gameweekId.toString());
      const gameweekSnap = await getDoc(gameweekRef);
      
      if (!gameweekSnap.exists()) {
        console.error(`❌ Gameweek ${gameweekId} not found`);
        return false;
      }
      
      const data = gameweekSnap.data() as Gameweek;
      const now = new Date();
      const deadline = new Date(data.deadline);
      
      const isBeforeDeadline = now < deadline;
      
      console.log(`🕒 GW${gameweekId} Deadline Check:`, {
        now: now.toISOString(),
        deadline: deadline.toISOString(),
        isBeforeDeadline,
        isOpen: data.isOpen
      });
      
      return isBeforeDeadline;
    } catch (error) {
      console.error(`❌ Error checking deadline for GW${gameweekId}:`, error);
      return false;
    }
  }
  
  // Main function: Check if changes are allowed (before deadline AND isOpen)
  static async canMakeChanges(gameweekId: number): Promise<{
    allowed: boolean;
    reason: string;
    timeLeft: number; // milliseconds until deadline
    deadline: Date | null;
    isOpen: boolean;
  }> {  
    try {
      console.log(`🔍 Checking if changes allowed for GW${gameweekId}...`);
      
      const gameweekRef = doc(db, 'gameweeksDeadline', gameweekId.toString());
      const gameweekSnap = await getDoc(gameweekRef);
      
      if (!gameweekSnap.exists()) {
        return {
          allowed: false,
          reason: `Gameweek ${gameweekId} not found`,
          timeLeft: 0,
          deadline: null,
          isOpen: false
        };
      }
      
      const data = gameweekSnap.data() as Gameweek;
      const now = new Date();
      const deadline = new Date(data.deadline);
      const timeLeft = deadline.getTime() - now.getTime();
      
      const isBeforeDeadline = now < deadline;
      const isOpen = data.isOpen || false;
      const allowed = isBeforeDeadline && isOpen;
      
      let reason = '';
      if (!isOpen) {
        reason = 'Gameweek is not open yet';
      } else if (!isBeforeDeadline) {
        reason = 'Deadline passed. You cannot make changes this gameweek.';
      } else {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        reason = `Time until deadline: ${hours}h ${minutes}m`;
      }
      
      console.log(`🕒 GW${gameweekId} Changes Check:`, {
        now: now.toISOString(),
        deadline: deadline.toISOString(),
        isBeforeDeadline,
        isOpen,
        allowed,
        reason
      });
      
      return {
        allowed,
        reason,
        timeLeft: Math.max(0, timeLeft),
        deadline,
        isOpen
      };
    } catch (error) {
      console.error(`❌ Error checking if changes allowed for GW${gameweekId}:`, error);
      return {
        allowed: false,
        reason: 'Error checking deadline',
        timeLeft: 0,
        deadline: null,
        isOpen: false
      };
    }
  }
  
  // Helper functions for UI
  static async canMakeTransfers(gameweekId: number): Promise<boolean> {
    const result = await this.canMakeChanges(gameweekId);
    return result.allowed;
  }
  
  static async canSelectCaptain(gameweekId: number): Promise<boolean> {
    const result = await this.canMakeChanges(gameweekId);
    return result.allowed;
  }
  
  static async canMakeSubstitutions(gameweekId: number): Promise<boolean> {
    const result = await this.canMakeChanges(gameweekId);
    return result.allowed;
  }
  
  static async canActivateChips(gameweekId: number): Promise<boolean> {
    const result = await this.canMakeChanges(gameweekId);
    return result.allowed;
  }
  
  static async canSaveTeam(gameweekId: number): Promise<boolean> {
    const result = await this.canMakeChanges(gameweekId);
    return result.allowed;
  }
  
  // Get deadline info for display
  static async getDeadlineInfo(gameweekId: number): Promise<{
    deadline: Date | null;
    timeRemaining: string;
    status: 'open' | 'closed';
    statusText: string;
    isOpen: boolean;
  }> {
    const result = await this.canMakeChanges(gameweekId);
    
    let timeRemaining = '';
    if (result.timeLeft > 0) {
      const days = Math.floor(result.timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((result.timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((result.timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        timeRemaining = `${days}d ${hours}h`;
      } else if (hours > 0) {
        timeRemaining = `${hours}h ${minutes}m`;
      } else {
        timeRemaining = `${minutes}m`;
      }
    } else {
      timeRemaining = 'EXPIRED';
    }
    
    return {
      deadline: result.deadline,
      timeRemaining,
      status: result.allowed ? 'open' : 'closed',
      statusText: result.reason,
      isOpen: result.isOpen
    };
  }
  
  // Format deadline for display
  static formatDeadline(deadline: Date, language: 'en' | 'ar' = 'en'): string {
    if (!deadline) return '';
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    };
    
    if (language === 'ar') {
      return deadline.toLocaleDateString('ar-EG', options);
    } else {
      return deadline.toLocaleDateString('en-US', options);
    }
  }
  
  // Get time remaining text for UI
  static getTimeRemainingText(timeRemaining: string, language: 'en' | 'ar' = 'en'): string {
    if (timeRemaining === 'EXPIRED') {
      return language === 'ar' ? 'انتهى الوقت' : 'Time Expired';
    }
    
    if (timeRemaining === 'ERROR' || timeRemaining === 'N/A') {
      return language === 'ar' ? 'غير متاح' : 'Not Available';
    }
    
    return timeRemaining;
  }
  
  // Get status color for UI
  static getStatusColor(status: 'open' | 'closed'): string {
    return status === 'open'
      ? 'text-green-600 bg-green-50 border-green-200'
      : 'text-red-600 bg-red-50 border-red-200';
  }

  // Check if a specific gameweek is open
  static async isGameweekOpen(gameweekNumber: number): Promise<boolean> {
    try {
      const gameweekDocRef = doc(db, 'gameweeksDeadline', gameweekNumber.toString());
      const gameweekDoc = await getDoc(gameweekDocRef);

      if (gameweekDoc.exists()) {
        const data = gameweekDoc.data();
        return data.isOpen === true;
      }

      return false;
    } catch (error) {
      console.error(`❌ Error checking if gameweek ${gameweekNumber} is open:`, error);
      return false;
    }
  }

  // Check if any gameweek in a range is open (for wildcard availability)
  static async isAnyGameweekOpenInRange(startGW: number, endGW: number): Promise<boolean> {
    try {
      const gameweeksRef = collection(db, 'gameweeksDeadline');
      const querySnapshot = await getDocs(gameweeksRef);

      // Filter in JavaScript to avoid complex composite index requirements
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const gw = data.gw;
        const isOpen = data.isOpen;

        if (gw >= startGW && gw <= endGW && isOpen === true) {
          console.log(`✅ Found open gameweek in range: GW${gw}`);
          return true;
        }
      }

      console.log(`❌ No open gameweeks found in range GW${startGW}-${endGW}`);
      return false;
    } catch (error) {
      console.error(`❌ Error checking if any gameweek in range ${startGW}-${endGW} is open:`, error);
      return false;
    }
  }
}
