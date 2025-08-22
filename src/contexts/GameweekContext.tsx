'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Gameweek {
  id: number
  name: string
  deadline: string
  startDate: string
  isActive: boolean
  isOpen: boolean
}

interface ChipUsage {
  used: boolean
  gameweek: number | null
  isActive: boolean
}

interface ChipsUsed {
  wildcard1: ChipUsage
  wildcard2: ChipUsage
  benchBoost: ChipUsage
  tripleCaptain: ChipUsage
  freeHit: ChipUsage
}

interface GameweekContextType {
  currentGameweek: Gameweek | null;
  loading: boolean;
  timeUntilDeadline: string;
  isDeadlinePassed: boolean;
  canMakeChanges: boolean;
  isGameweekOpen: boolean;
  refreshGameweek: () => Promise<void>;
  // Chip management
  deactivateChipsForGameweek: (userId: string, gameweekId: number) => Promise<ChipsUsed | null>;
}

const GameweekContext = createContext<GameweekContextType | undefined>(undefined)

// All gameweek data is now retrieved from the database
// No hardcoded schedule needed

export function GameweekProvider({ children }: { children: ReactNode }) {
  const [currentGameweek, setCurrentGameweek] = useState<Gameweek | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeUntilDeadline, setTimeUntilDeadline] = useState('')
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false)
  const [isGameweekOpenState, setIsGameweekOpenState] = useState(false)

  // Calculate time until deadline
  const calculateTimeUntilDeadline = (deadline: string): string => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diff = deadlineDate.getTime() - now.getTime()

    if (diff <= 0) {
      return 'Deadline passed'
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  // All gameweek logic is now database-driven
  // No hardcoded functions needed

  // Update timer every minute - always shows the active/open gameweek
  useEffect(() => {
    const updateTimer = async () => {
      try {
        // Import here to avoid circular dependency
        const { GameweekDeadlineService } = await import('@/lib/gameweekDeadlineService');

        // Get current open gameweek from database
        const openGameweek = await GameweekDeadlineService.getCurrentGameweek();

        if (openGameweek) {
          const gw = {
            id: openGameweek.gw,
            name: `Gameweek ${openGameweek.gw}`,
            startDate: openGameweek.startDate,
            deadline: openGameweek.deadline,
            isActive: true,
            isOpen: openGameweek.isOpen
          };

          setCurrentGameweek(gw);

          const timeLeft = calculateTimeUntilDeadline(gw.deadline);
          setTimeUntilDeadline(timeLeft);

          const now = new Date();
          const deadline = new Date(gw.deadline);
          setIsDeadlinePassed(now > deadline);

          // Set gameweek open state
          setIsGameweekOpenState(gw.isOpen);

          console.log(`🎯 Dynamic gameweek context: GW${openGameweek.gw} is current (isOpen: ${openGameweek.isOpen})`);
          console.log(`📊 Context set currentGameweek.id to: ${gw.id}`);
        } else {
          // No open gameweek found in database
          console.log('⚠️ No open gameweek found in database');
          setCurrentGameweek(null);
          setTimeUntilDeadline('No active gameweek');
          setIsDeadlinePassed(true);
          setIsGameweekOpenState(false);
        }
      } catch (error) {
        console.error('❌ Error loading dynamic gameweek:', error);
        // Set error state
        setCurrentGameweek(null);
        setTimeUntilDeadline('Error loading gameweek');
        setIsDeadlinePassed(true);
        setIsGameweekOpenState(false);
      }

      setLoading(false);
    }

    // Update immediately
    updateTimer();

    // Update every 2 minutes to check for gameweek changes
    const interval = setInterval(updateTimer, 120000);

    return () => clearInterval(interval);
  }, [])

  const refreshGameweek = async () => {
    setLoading(true)

    try {
      // Import here to avoid circular dependency
      const { GameweekDeadlineService } = await import('@/lib/gameweekDeadlineService');

      // Get current open gameweek from database
      const openGameweek = await GameweekDeadlineService.getCurrentGameweek();

      if (openGameweek) {
        const gw = {
          id: openGameweek.gw,
          name: `Gameweek ${openGameweek.gw}`,
          startDate: openGameweek.startDate,
          deadline: openGameweek.deadline,
          isActive: true,
          isOpen: openGameweek.isOpen
        };

        setCurrentGameweek(gw);

        const timeLeft = calculateTimeUntilDeadline(gw.deadline);
        setTimeUntilDeadline(timeLeft);

        const now = new Date();
        const deadline = new Date(gw.deadline);
        setIsDeadlinePassed(now > deadline);
        setIsGameweekOpenState(gw.isOpen);

        console.log(`🔄 Refreshed gameweek context: GW${openGameweek.gw}`);
      } else {
        console.log('⚠️ No open gameweek found during refresh');
        setCurrentGameweek(null);
        setTimeUntilDeadline('No active gameweek');
        setIsDeadlinePassed(true);
        setIsGameweekOpenState(false);
      }
    } catch (error) {
      console.error('❌ Error refreshing gameweek:', error);
      setCurrentGameweek(null);
      setTimeUntilDeadline('Error loading gameweek');
      setIsDeadlinePassed(true);
      setIsGameweekOpenState(false);
    }

    setLoading(false)
  }

  const canMakeChanges = !isDeadlinePassed && !loading

  // Function to deactivate chips when gameweek changes
  const deactivateChipsForGameweek = async (userId: string, gameweekId: number) => {
    try {
      const response = await fetch('/api/chips/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          gameweekId
        }),
      })

      if (!response.ok) {
        console.error('Failed to deactivate chips')
        return null
      }

      const data = await response.json()
      return data.chipsUsed
    } catch (error) {
      console.error('Error deactivating chips:', error)
      return null
    }
  }

  const value = {
    currentGameweek,
    loading,
    timeUntilDeadline,
    isDeadlinePassed,
    canMakeChanges,
    isGameweekOpen: isGameweekOpenState,
    refreshGameweek,
    deactivateChipsForGameweek
  }

  return (
    <GameweekContext.Provider value={value}>
      {children}
    </GameweekContext.Provider>
  )
}

export function useGameweek() {
  const context = useContext(GameweekContext)
  if (context === undefined) {
    throw new Error('useGameweek must be used within a GameweekProvider')
  }
  return context
}





