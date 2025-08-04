import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Simple deadline service - fetches deadline from Firebase and compares with current time
export class DeadlineService {
  
  // Main function: Check if current time < deadline
  static async canMakeActions(gameweekId: number): Promise<{
    allowed: boolean;
    deadline: Date | null;
    timeRemaining: string;
    reason: string;
  }> {
    try {
      console.log(`🔍 Checking deadline for GW${gameweekId}...`);
      
      // Fetch gameweek data from Firebase
      const gameweekRef = doc(db, 'gameweeks', `gw${gameweekId}`);
      const gameweekSnap = await getDoc(gameweekRef);
      
      if (!gameweekSnap.exists()) {
        return {
          allowed: false,
          deadline: null,
          timeRemaining: 'N/A',
          reason: `Gameweek ${gameweekId} not found in database`
        };
      }
      
      const data = gameweekSnap.data();
      const deadline = data.deadline.toDate(); // Convert Firebase Timestamp to Date
      const now = new Date(); // Current time
      
      // Simple logic: current time < deadline = allow actions
      const allowed = now < deadline;
      
      let timeRemaining = '';
      if (allowed) {
        const diffMs = deadline.getTime() - now.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
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
      
      const result = {
        allowed,
        deadline,
        timeRemaining,
        reason: allowed 
          ? `Actions allowed - ${timeRemaining} remaining`
          : 'Deadline has passed - no actions allowed'
      };
      
      console.log(`🕒 GW${gameweekId} Result:`, {
        currentTime: now.toLocaleString(),
        deadline: deadline.toLocaleString(),
        allowed: result.allowed,
        timeRemaining: result.timeRemaining
      });
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error checking deadline for GW${gameweekId}:`, error);
      return {
        allowed: false,
        deadline: null,
        timeRemaining: 'ERROR',
        reason: 'Error checking deadline - actions blocked for safety'
      };
    }
  }
  
  // Check if transfers are allowed
  static async canMakeTransfers(gameweekId: number): Promise<boolean> {
    const result = await this.canMakeActions(gameweekId);
    return result.allowed;
  }
  
  // Check if chips can be activated
  static async canActivateChips(gameweekId: number): Promise<boolean> {
    const result = await this.canMakeActions(gameweekId);
    return result.allowed;
  }
  
  // Check if substitutions are allowed
  static async canMakeSubstitutions(gameweekId: number): Promise<boolean> {
    const result = await this.canMakeActions(gameweekId);
    return result.allowed;
  }
  
  // Check if team can be saved
  static async canSaveTeam(gameweekId: number): Promise<boolean> {
    const result = await this.canMakeActions(gameweekId);
    return result.allowed;
  }
  
  // Get deadline info for display
  static async getDeadlineInfo(gameweekId: number): Promise<{
    deadline: Date | null;
    timeRemaining: string;
    status: 'open' | 'closed';
    statusText: string;
  }> {
    const result = await this.canMakeActions(gameweekId);
    
    return {
      deadline: result.deadline,
      timeRemaining: result.timeRemaining,
      status: result.allowed ? 'open' : 'closed',
      statusText: result.reason
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

  // Fetch the open gameweek deadline from Firestore
  static async getOpenGameweekDeadline() {
      const q = query(collection(db, 'gameweeksDeadline'), where('isOpen', '==', true));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docData = snapshot.docs[0].data();
    return {
      deadline: docData.deadline,
      gw: docData.gw,
      isOpen: docData.isOpen,
      timeRemaining: '', // You can calculate this in the component
    };
  }
}
