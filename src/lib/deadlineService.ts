import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Interface for time remaining
export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

/**
 * Check if the deadline for a gameweek has passed
 * @param gameweek The gameweek number
 * @returns Promise<boolean> True if deadline has passed, false otherwise
 */
export async function isDeadlinePassed(gameweek: number): Promise<boolean> {
  try {
    // Fetch gameweek data from Firebase
    const gameweekRef = doc(db, 'gameweeksDeadline', gameweek.toString());
    const gameweekSnap = await getDoc(gameweekRef);
    
    if (!gameweekSnap.exists()) {
      console.error(`Gameweek ${gameweek} not found in database`);
      return true; // Default to passed if gameweek not found
    }
    
    const data = gameweekSnap.data();
    const deadlineStr = data.deadline;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    
    return now > deadline;
  } catch (error) {
    console.error('Error checking deadline:', error);
    return true; // Default to passed on error
  }
}

/**
 * Get the time remaining until the deadline
 * @param gameweek The gameweek number
 * @returns Promise<TimeRemaining> Object with days, hours, minutes, seconds, and totalMs
 */
export async function getTimeUntilDeadline(gameweek: number): Promise<TimeRemaining> {
  try {
    // Fetch gameweek data from Firebase
    const gameweekRef = doc(db, 'gameweeksDeadline', gameweek.toString());
    const gameweekSnap = await getDoc(gameweekRef);
    
    if (!gameweekSnap.exists()) {
      console.error(`Gameweek ${gameweek} not found in database`);
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    }
    
    const data = gameweekSnap.data();
    const deadlineStr = data.deadline;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    
    // If deadline has passed, return zeros
    if (now > deadline) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    }
    
    // Calculate time difference
    const diffMs = deadline.getTime() - now.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return {
      days,
      hours,
      minutes,
      seconds,
      totalMs: diffMs
    };
  } catch (error) {
    console.error('Error getting time until deadline:', error);
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }
}

/**
 * Format the time remaining as a string
 * @param timeRemaining TimeRemaining object
 * @returns string Formatted time string
 */
export function formatTimeRemaining(timeRemaining: TimeRemaining): string {
  const { days, hours, minutes, seconds } = timeRemaining;
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}
