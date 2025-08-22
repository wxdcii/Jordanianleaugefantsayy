import { db } from '../firebase';
import { GameweekPointsService } from '../gameweekPointsService';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  getDoc,
  deleteDoc,
  limit,
  writeBatch
} from 'firebase/firestore';

export interface League {
  id: string;
  name: string;
  code: string; // 6-digit join code
  type: 'classic' | 'head_to_head';
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
  maxMembers: number;
  description?: string;
  adminName: string;
  memberCount: number;
  startGameweek: number; // Gameweek from which points calculation starts
}

export interface LeagueMember {
  id: string;
  userId: string;
  teamName: string;
  managerName: string;
  joinedAt: Date;
  totalPoints: number;
  currentRank: number;
  previousRank?: number;
  lastGameweekPoints: number;
  movement: number; // +3, -1, 0, etc.
}

export interface LeagueStanding {
  leagueId: string;
  gameweek: number;
  standings: LeagueMember[];
  lastUpdated: Date;
}

export class LeagueService {
  // Create a new private league
  static async createLeague(leagueData: {
    name: string;
    description?: string;
    createdBy: string;
    adminName: string;
    maxMembers?: number;
    startGameweek: number;
  }) {
    const code = this.generateLeagueCode();
    
    const league = {
      ...leagueData,
      code,
      type: 'classic' as const,
      createdAt: new Date(),
      isPublic: false,
      maxMembers: leagueData.maxMembers || 100,
      memberCount: 1,
      startGameweek: leagueData.startGameweek
    };
    
    const docRef = await addDoc(collection(db, 'leagues'), league);
    
    // Add creator as first member
    await this.joinLeague(docRef.id, leagueData.createdBy, leagueData.adminName, 'Admin Team');
    
    return { id: docRef.id, ...league };
  }
  
  // Join league with code
  static async joinLeague(leagueId: string, userId: string, managerName: string, teamName: string) {
    // Check if user already in league
    const existingQuery = query(
      collection(db, 'leagues', leagueId, 'members'),
      where('userId', '==', userId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      throw new Error('You are already a member of this league');
    }
    
    // Check league capacity
    const leagueDoc = await getDoc(doc(db, 'leagues', leagueId));
    if (!leagueDoc.exists()) {
      throw new Error('League not found');
    }
    
    const league = leagueDoc.data();
    const membersSnapshot = await getDocs(collection(db, 'leagues', leagueId, 'members'));
    
    if (membersSnapshot.size >= league.maxMembers) {
      throw new Error('League is full');
    }
    
    const memberData = {
      userId,
      teamName,
      managerName,
      joinedAt: new Date(),
      totalPoints: 0,
      currentRank: 0,
      previousRank: 0,
      lastGameweekPoints: 0,
      movement: 0
    };
    
    await addDoc(collection(db, 'leagues', leagueId, 'members'), memberData);
    
    // Update league member count
    await updateDoc(doc(db, 'leagues', leagueId), {
      memberCount: membersSnapshot.size + 1
    });
    
    return memberData;
  }
  
  // Find league by code
  static async findLeagueByCode(code: string) {
    const leaguesQuery = query(
      collection(db, 'leagues'),
      where('code', '==', code.toUpperCase()),
      limit(1)
    );
    
    const snapshot = await getDocs(leaguesQuery);
    
    if (snapshot.empty) {
      throw new Error('League not found with this code');
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  
  // Get user's leagues
  static async getUserLeagues(userId: string) {
    const leagues = [];
    
    // Get all leagues where user is a member
    const leaguesSnapshot = await getDocs(collection(db, 'leagues'));
    
    for (const leagueDoc of leaguesSnapshot.docs) {
      const membersQuery = query(
        collection(db, 'leagues', leagueDoc.id, 'members'),
        where('userId', '==', userId)
      );
      
      const memberSnapshot = await getDocs(membersQuery);
      
      if (!memberSnapshot.empty) {
        const league = { id: leagueDoc.id, ...leagueDoc.data() };
        const member = memberSnapshot.docs[0].data();
        
        leagues.push({
          ...league,
          userRank: member.currentRank,
          userPoints: member.totalPoints,
          userMovement: member.movement
        });
      }
    }
    
    return leagues;
  }
  
  // Get league standings
  static async getLeagueStandings(leagueId: string) {
    console.log('🏆 Getting league standings for league:', leagueId);
    
    // First get league details to get the startGameweek
    const leagueDoc = await getDoc(doc(db, 'leagues', leagueId));
    if (!leagueDoc.exists()) {
      throw new Error('League not found');
    }
    
    const leagueData = leagueDoc.data();
    const startGameweek = leagueData.startGameweek || 1;
    
    console.log(`📊 League starts from GW${startGameweek}`);

    // Get current gameweek to fetch last gameweek points
    const deadlinesSnapshot = await getDocs(query(
      collection(db, 'gameweeksDeadline'),
      orderBy('gameweek', 'desc'),
      limit(1)
    ));
    
    let currentGameweek = 1;
    if (!deadlinesSnapshot.empty) {
      currentGameweek = deadlinesSnapshot.docs[0].data().gameweek;
    }
    
    const membersSnapshot = await getDocs(
      collection(db, 'leagues', leagueId, 'members')
    );
    
    const standings: any[] = [];
    
    for (const memberDoc of membersSnapshot.docs) {
      const member = memberDoc.data();
      console.log('Processing league member:', {
        memberId: memberDoc.id,
        memberData: member,
        userId: member.userId
      });
      
      // Calculate total points from startGameweek onwards
      let totalPoints = 0;
      let lastGameweekPoints = 0;
      
      try {
        console.log(`Calculating points from GW${startGameweek} for user:`, member.userId);
        totalPoints = await this.calculateUserPointsFromGameweek(member.userId, startGameweek);
        console.log(`Points from GW${startGameweek} onwards:`, totalPoints);

        // Get last gameweek points
        if (currentGameweek > 1) {
          const lastGwPointsResult = await GameweekPointsService.getGameweekPoints(member.userId, currentGameweek - 1);
          if (lastGwPointsResult.success && lastGwPointsResult.data) {
            lastGameweekPoints = lastGwPointsResult.data.points;
          }
        }
      } catch (error) {
        console.error(`Error calculating league-specific points for ${member.userId}:`, error);
      }
      
      standings.push({
        id: memberDoc.id,
        userId: member.userId,
        teamName: member.teamName,
        managerName: member.managerName,
        totalPoints,
        lastGameweekPoints,
        currentRank: 0, // Will be set after sorting
        previousRank: member.currentRank || 0,
        joinedAt: member.joinedAt,
        leagueStartGameweek: startGameweek
      });
    }
    
    // Sort by total points and assign ranks
    standings.sort((a, b) => b.totalPoints - a.totalPoints);
    standings.forEach((standing, index) => {
      standing.currentRank = index + 1;
    });
    
    console.log('Final league standings:', standings);
    return standings;
  }
  
  // Update league standings after gameweek
  // Test function to verify user data retrieval
  static async testUserDataRetrieval(userId: string) {
    try {
      console.log('Testing user data retrieval for:', userId);
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User exists! Data:', JSON.stringify(userData, null, 2));
        console.log('totalPoints field:', userData.totalPoints);
        return userData;
      } else {
        console.log('User document does not exist');
        return null;
      }
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  static async updateLeagueStandings(leagueId: string, gameweek: number) {
    console.log(`🏆 Updating league standings for league ${leagueId}, GW${gameweek}`);
    
    // Get league details to get the startGameweek
    const leagueDoc = await getDoc(doc(db, 'leagues', leagueId));
    if (!leagueDoc.exists()) {
      throw new Error('League not found');
    }
    
    const leagueData = leagueDoc.data();
    const startGameweek = leagueData.startGameweek || 1;
    
    console.log(`📊 League starts from GW${startGameweek}`);
    
    const membersSnapshot = await getDocs(
      collection(db, 'leagues', leagueId, 'members')
    );
    
    const standings: any[] = [];
    
    for (const memberDoc of membersSnapshot.docs) {
      const member = memberDoc.data();
      console.log('Processing league member:', {
        memberId: memberDoc.id,
        memberData: member,
        userId: member.userId
      });
      
      // Calculate total points from startGameweek onwards
      let totalPoints = 0;
      
      try {
        console.log(`Calculating points from GW${startGameweek} for user:`, member.userId);
        totalPoints = await this.calculateUserPointsFromGameweek(member.userId, startGameweek);
        console.log(`Points from GW${startGameweek} onwards:`, totalPoints);
      } catch (error) {
        console.error(`Error calculating league-specific points for ${member.userId}:`, error);
      }
      
      standings.push({
        id: memberDoc.id,
        userId: member.userId,
        teamName: member.teamName,
        managerName: member.managerName,
        totalPoints,
        currentRank: 0, // Will be set after sorting
        previousRank: member.currentRank || 0,
        joinedAt: member.joinedAt
      });
    }
    
    // Sort by total points and assign ranks
    standings.sort((a, b) => b.totalPoints - a.totalPoints);
    standings.forEach((standing, index) => {
      standing.currentRank = index + 1;
    });
    
    // Update each member's current rank
    const batch = writeBatch(db);
    
    standings.forEach((standing) => {
      const memberRef = doc(db, 'leagues', leagueId, 'members', standing.id);
      batch.update(memberRef, {
        currentRank: standing.currentRank,
        totalPoints: standing.totalPoints,
        lastUpdated: new Date()
      });
    });
    
    await batch.commit();
    
    console.log(`✅ Updated standings for league ${leagueId}`);
    return standings;
  }
  
  // Update all leagues after gameweek
  static async updateAllLeagueStandings(gameweek: number) {
    console.log(`🏆 Updating all league standings for GW${gameweek}`);
    
    const leaguesSnapshot = await getDocs(collection(db, 'leagues'));
    
    for (const leagueDoc of leaguesSnapshot.docs) {
      await this.updateLeagueStandings(leagueDoc.id, gameweek);
    }
    
    console.log(`✅ Updated ${leaguesSnapshot.size} leagues for GW${gameweek}`);
  }
  
  // Leave league
  static async leaveLeague(leagueId: string, userId: string) {
    const membersQuery = query(
      collection(db, 'leagues', leagueId, 'members'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(membersQuery);
    
    if (!snapshot.empty) {
      await deleteDoc(snapshot.docs[0].ref);
      
      // Update member count
      const leagueRef = doc(db, 'leagues', leagueId);
      const leagueDoc = await getDoc(leagueRef);
      const currentCount = leagueDoc.data()?.memberCount || 0;
      
      await updateDoc(leagueRef, {
        memberCount: Math.max(0, currentCount - 1)
      });
    }
  }
  
  // Get league details
  static async getLeagueDetails(leagueId: string) {
    const leagueDoc = await getDoc(doc(db, 'leagues', leagueId));
    
    if (!leagueDoc.exists()) {
      throw new Error('League not found');
    }
    
    return { id: leagueDoc.id, ...leagueDoc.data() };
  }
  
  // Get available gameweeks for league creation
  static async getAvailableGameweeks(): Promise<{ gw: number; name: string; deadline: string; isOpen: boolean }[]> {
    try {
      const gameweeksRef = collection(db, 'gameweeksDeadline');
      const querySnapshot = await getDocs(gameweeksRef);
      
      const gameweeks: { gw: number; name: string; deadline: string; isOpen: boolean }[] = [];
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        gameweeks.push({
          gw: data.gw,
          name: `Gameweek ${data.gw}`,
          deadline: data.deadline,
          isOpen: data.isOpen || false
        });
      });
      
      // Sort by gameweek number
      gameweeks.sort((a, b) => a.gw - b.gw);
      
      return gameweeks;
    } catch (error) {
      console.error('Error fetching gameweeks:', error);
      return [];
    }
  }
  
  // Calculate total points from a specific gameweek onwards for a user
  static async calculateUserPointsFromGameweek(userId: string, startGameweek: number): Promise<number> {
    try {
      const gameweekPointsRef = collection(db, 'users', userId, 'GameweekPoints');
      const querySnapshot = await getDocs(gameweekPointsRef);
      
      let totalPoints = 0;
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const gameweekNumber = data.gameweekNumber || parseInt(doc.id.replace('gw', ''));
        
        // Only count points from startGameweek onwards
        if (gameweekNumber >= startGameweek) {
          totalPoints += data.points || 0;
        }
      });
      
      return totalPoints;
    } catch (error) {
      console.error(`Error calculating points from GW${startGameweek} for user ${userId}:`, error);
      return 0;
    }
  }
  
  private static generateLeagueCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
