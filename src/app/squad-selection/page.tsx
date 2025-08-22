'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGameweek } from '@/contexts/GameweekContext';
import { fetchAllPlayers } from '@/lib/firebasePlayersService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FormationField from '@/components/FormationField';
import SquadStats from '@/components/SquadStats';
import DeadlineBanner from '@/components/DeadlineBanner';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChipsPanel from '@/components/ChipsPanel';
import DeadlineTimer from '@/components/DeadlineTimer';
import SaveTeamButton from '@/components/SaveTeamButton';
import DeadlineCountdown from '@/components/DeadlineCountdown';
import DeadlineDisplay, { DeadlineStatus, LiveCountdown } from '@/components/DeadlineDisplay';
import TransferInfo from '@/components/TransferInfo';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSocialMediaNotification } from '@/hooks/useSocialMediaNotification';


import {
  saveUserTeam,
  validateBudget,
  calculateTransferPenalty,
  ChipsUsed,
  getDefaultChipsUsed,
  loadChipsFromFirebase,
  UserTransferState,
  getDefaultTransferState,
  loadTransferStateFromFirebase,
  saveTransferStateToFirebase,
  processGameweekStart,
  applyTransfer,
  calculateTransferCost,
  autoResetTransferPenalties,
  activateWildcardTransfer,
  deactivateWildcardTransfer,
  Squad,

} from '@/lib/fantasyLogic';
import { substitutePlayer } from '@/lib/substitutionLogic';
import { UserSquadService } from '@/lib/userSquadService';
import { saveUserSquadToFirebase, getUserSquadFromFirebase } from '@/lib/firebaseSquadService.js';
// Firebase squad service imports - Updated for subcollection structure
import {
  saveUserSquadToSubcollection,
  getUserSquadFromSubcollection,
  updateUserSquadInSubcollection,
  isGameweekOpen,
  type SavedSquad as FirebaseSquad,
  type SquadPlayer as FirebaseSquadPlayer
} from '@/lib/firebase/squadService';
import { GameweekDeadlineService } from '@/lib/gameweekDeadlineService';
import { validateTeamChange, getActiveChips } from '@/lib/wildcardService';
import { initializeUserPoints, saveGameweekPoints } from '@/lib/firebase/pointsService';
import { calculateAndSaveSquadPoints } from '@/lib/firebase/realTimePointsUpdater';

type ViewMode = 'pitch' | 'list';

// Conditional Deadline Display Component - Only shows if gameweek is open
function ConditionalDeadlineDisplay({ language }: { language: 'en' | 'ar' }) {
  const [openGameweek, setOpenGameweek] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOpenGameweek = async () => {
      try {
        const currentGameweek = await GameweekDeadlineService.getCurrentGameweek();
        setOpenGameweek(currentGameweek);
      } catch (error) {
        console.error('Error checking open gameweek:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOpenGameweek();

    // Check every minute for updates
    const interval = setInterval(checkOpenGameweek, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="mb-6 flex justify-center">
        <div className="animate-pulse bg-gray-200 h-16 w-64 rounded-lg"></div>
      </div>
    );
  }

  // Only show if there's an open gameweek
  if (!openGameweek || !openGameweek.isOpen) {
    return null; // Show nothing if no gameweek is open
  }

  return (
    <div className="mb-6 flex justify-center">
      <DeadlineDisplay
        gameweek={openGameweek.gw}
        language={language}
        className="max-w-md"
      />
    </div>
  );
}

interface Player {
  id: string;
  name: string;
  nameAr?: string;
  position: 'GKP' | 'DEF' | 'MID' | 'FWD';
  club: string;
  price: number;
  points: { [key: string]: number }; // gw1, gw2, etc.
  totalPoints: number;
  selected: boolean;
  captain: boolean;
  ownership?: number;
  gameweekStats?: { [key: string]: PlayerGameweekStats };
  kitImage?: string;
}



function getClubLogo(club: string): string {
  const clubMap: { [key: string]: string } = {
    'Al-Ramtha': 'https://tmssl.akamaized.net//images/wappen/head/31180.png?lm=1416237505',
    'Al-Faisaly': 'https://tmssl.akamaized.net//images/wappen/head/13592.png?lm=1684147693',
    'Al-Wehdat': 'https://tmssl.akamaized.net//images/wappen/head/15796.png?lm=1740340001',
    'Al-Hussein Irbid': 'https://tmssl.akamaized.net//images/wappen/head/15795.png?lm=1750956848',
    'Al-Jazeera': 'https://tmssl.akamaized.net//images/wappen/head/22721.png?lm=1666352020',
    'Al-Salt': 'https://tmssl.akamaized.net//images/wappen/head/69471.png?lm=1701013200',
    "Al-Baqa'a": 'https://tmssl.akamaized.net//images/wappen/head/22797.png?lm=1666352020',
    'Shabab Al-Ordon': 'https://tmssl.akamaized.net//images/wappen/head/15832.png?lm=1416235940',
    'Sama Al-Sarhan': 'https://tmssl.akamaized.net//images/wappen/head/93417.png?lm=1637243754',
    'Al-Ahly': 'https://tmssl.akamaized.net//images/wappen/head/22722.png?lm=1680282945'
  };
  return clubMap[club] || 'https://yourdomain.com/clubs/default.png';
}

function getClubKit(club: string): string {
  const kitMap: { [key: string]: string } = {
    'Al-Ramtha': '/images/kits/al-ramtha.png',
    'Al-Faisaly': '/images/kits/al-faisaly.png',
    'Al-Wehdat': '/images/kits/al-wehdat.png',
    'Al-Hussein Irbid': '/images/kits/al-hussein-irbid.png',
    'Al-Jazeera': '/images/kits/al-jazeera.png',
    'Al-Salt': '/images/kits/al-salt.png',
    "Al-Baqa'a": '/images/kits/al-baqaa.png',
    'Shabab Al-Ordon': '/images/kits/shabab-al-ordon.png',
    'Sama Al-Sarhan': '/images/kits/sama-al-sarhan.png',
    'Al-Ahly': '/images/kits/al-ahly.png'
  };
  return kitMap[club] || '';
}
const PlayerKit = ({
  club,
  position,
  size = 'normal',
  className = ''
}: {
  club: string;
  position: string;
  size?: 'small' | 'normal' | 'large';
  className?: string;
}) => {
  const getClubKitColor = (club: string) => {
    const clubColors = {
      'Al-Baqaa': '#000000',
      'Sama Al-Sarhan': '#d18800ff',
      'Al-Salt': '#120568ff',
      'Shabab Al-Ordon': '#de0404ff',
      'Al-Ahly': '#a8f2aeff',
      'Al-Wehdat': '#006400',
      'Al-Ramtha': '#000056ff',
      'Al-Faisaly': '#2fb2e6ff',
      'Al-Jazeera': '#C70000',
      'Al-Hussein Irbid': '#FFD800'
    };
    if (clubColors[club as keyof typeof clubColors]) {
      return clubColors[club as keyof typeof clubColors];
    }
    let hash = 0;
    for (let i = 0; i < club.length; i++) {
      hash = club.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const kitColor = getClubKitColor(club);
  const isGK = position === 'GKP' || position === 'GOALKEEPER';
  const kitImage = getClubKit(club);

  const sizeClasses = {
    small: 'w-12 h-10',
    normal: 'w-16 h-14',
    large: 'w-20 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative flex-shrink-0`}>
      {kitImage ? (
        // Kit image without any background container
        <img 
          src={kitImage} 
          alt={`${club} kit`}
          className="w-full h-full object-contain"
          style={{ border: 'none', outline: 'none', background: 'transparent' }}
          onError={(e) => {
            // Fallback to colored jersey if image fails to load
            e.currentTarget.style.display = 'none';
            const fallbackDiv = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallbackDiv) {
              fallbackDiv.style.display = 'block';
            }
          }}
        />
      ) : null}
      
      {/* Fallback colored jersey (only shown when no kit image) */}
      <div
        className="w-full h-full relative rounded-t-xl shadow-lg"
        style={{
          background: isGK
            ? 'linear-gradient(135deg, #222 60%, #444 100%)'
            : `linear-gradient(135deg, ${kitColor} 60%, #fff 100%)`,
          boxShadow: '0 4px 12px 0 rgba(0,0,0,0.18), 0 1.5px 0 #fff inset',
          display: kitImage ? 'none' : 'block'
        }}
      >
        {/* Jersey collar */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-5 h-2 bg-white/40 rounded-b shadow-sm"></div>
        {/* Jersey sleeves with shadow */}
        <div className="absolute -left-2 top-2 w-4 h-4 rounded-l shadow-md"
          style={{
            background: isGK
              ? 'linear-gradient(90deg, #222 70%, #555 100%)'
              : `linear-gradient(90deg, ${kitColor} 70%, #eee 100%)`
          }}
        ></div>
        <div className="absolute -right-2 top-2 w-4 h-4 rounded-r shadow-md"
          style={{
            background: isGK
              ? 'linear-gradient(270deg, #222 70%, #555 100%)'
              : `linear-gradient(270deg, ${kitColor} 70%, #eee 100%)`
          }}
        ></div>
        {/* Jersey shine highlight */}
        <div className="absolute left-2 top-2 w-2/3 h-2 rounded-full bg-white/10 blur-sm"></div>
       
        {/* Club logo on right chest */}
        <div
          className="absolute"
          style={{
            top: '20%',
            left: '50%',
            transform: 'translate(-50%, 0)',
            zIndex: 20
          }}
        >
          <img
            src={getClubLogo(club)}
            alt={club}
            className="w-6 h-6 object-contain rounded-full shadow-xl"
            style={{
              boxShadow: '0 4px 4px rgba(0,0,0,0.10)',
              borderRadius: '100%'
            }}
          />
        </div>
      </div>
    </div>
  );
};
const EmptyKit = ({ position, onClick }: { position: string; onClick: () => void }) => (
  <button
    className="relative w-16 h-20 bg-gray-200 border-4 border-white rounded-t-2xl rounded-b-xl flex items-center justify-center shadow-lg hover:bg-gray-300 transition"
    onClick={onClick}
    type="button"
  >
    <span className="absolute left-1/2 top-1/2 text-3xl font-bold text-blue-500" style={{ transform: 'translate(-50%, -50%)' }}>+</span>
    <span className="absolute bottom-2 left-1/2 text-xs text-gray-500 font-semibold" style={{ transform: 'translateX(-50%)' }}>
      {position === 'GKP' ? 'GK' : position === 'DEF' ? 'DEF' : position === 'MID' ? 'MID' : 'FWD'}
    </span>
  </button>
);
export default function SquadSelectionPage() {
  const [selectedPositionForAdd, setSelectedPositionForAdd] = useState<string | null>(null);
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { currentGameweek, isDeadlinePassed } = useGameweek();
  
  // Social media notification hook - triggers when user enters squad selection
  const { showNotificationManually } = useSocialMediaNotification(true);

  // FIXED: Use context gameweek directly instead of local state
  const currentGW = currentGameweek?.id || 1;
  const [viewMode, setViewMode] = useState<ViewMode>('pitch');
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');
  const [budget] = useState(100.0);
  const [freeTransfers, setFreeTransfers] = useState(1);
  const [transfersMadeThisWeek, setTransfersMadeThisWeek] = useState(0);
  const [captain, setCaptain] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [openGameweek, setOpenGameweek] = useState<any>(null);

  // Helper function to get the gameweek to use for points display
  const getPointsGameweek = () => {
    // Use open gameweek for points if available, otherwise fall back to display gameweek
    return openGameweek?.isOpen ? openGameweek.gw : currentGW;
  };

  // Helper function to reset chips for a specific gameweek
  const resetChipsForGameweek = (chips: ChipsUsed, targetGameweek: number): ChipsUsed => {
    const resetChips = { ...chips };

    // Chips should only be active in the gameweek they were activated
    Object.keys(resetChips).forEach(chipKey => {
      const chip = resetChips[chipKey as keyof ChipsUsed];

      // IMPORTANT: A chip should only be active if:
      // 1. It was used (chip.used === true)
      // 2. It was used in the current target gameweek (chip.gameweek === targetGameweek)
      // 3. We're currently in that gameweek
      const shouldBeActive = chip.used && chip.gameweek === targetGameweek;

      resetChips[chipKey as keyof ChipsUsed] = {
        used: chip.used, // Keep usage status
        gameweek: chip.gameweek, // Keep the gameweek it was used in
        isActive: shouldBeActive // Only active in its own gameweek
      };
    });

    console.log(`🎮 Reset chips for GW${targetGameweek}:`, {
      targetGameweek,
      resetChips,
      originalChips: chips,
      activeChips: Object.entries(resetChips).filter(([_, chip]) => chip.isActive).map(([key, chip]) => `${key} (GW${chip.gameweek})`),
      chipDetails: Object.entries(resetChips).map(([key, chip]) => ({
        chip: key,
        used: chip.used,
        gameweek: chip.gameweek,
        isActive: chip.isActive,
        shouldBeActive: chip.used && chip.gameweek === targetGameweek
      }))
    });

    return resetChips;
  };
  const [loadingSquad, setLoadingSquad] = useState(false);
  const [squadLoaded, setSquadLoaded] = useState(false);
  const [isDeadlinePassedState, setIsDeadlinePassedState] = useState(false);
  const [wildcardActive, setWildcardActive] = useState(false);

  // Transfer system state
  const [transferMode, setTransferMode] = useState(false);
  const [playerToTransferOut, setPlayerToTransferOut] = useState<string>('');
  const [pendingTransfers, setPendingTransfers] = useState<Array<{out: string, in: string}>>([]);
  
  // Chips state
  const [chipsUsed, setChipsUsed] = useState<ChipsUsed>(getDefaultChipsUsed());

  // Transfer state
  const [transferState, setTransferState] = useState<UserTransferState>(getDefaultTransferState(1, true));

  // Helper function to check if wildcard was deactivated and update transfer state accordingly
  const handleWildcardDeactivation = useCallback((oldChips: ChipsUsed, newChips: ChipsUsed, targetGameweek: number) => {
    const wildcard1WasActive = oldChips.wildcard1.isActive;
    const wildcard2WasActive = oldChips.wildcard2.isActive;
    const wildcard1NowActive = newChips.wildcard1.isActive;
    const wildcard2NowActive = newChips.wildcard2.isActive;

    // Check if any wildcard was deactivated
    if ((wildcard1WasActive && !wildcard1NowActive) || (wildcard2WasActive && !wildcard2NowActive)) {
      console.log('🃏 Wildcard was deactivated, updating transfer state to give 1 free transfer for new gameweek');
      const updatedTransferState = deactivateWildcardTransfer(transferState, targetGameweek);
      console.log('🔄 Updated transfer state after wildcard deactivation:', updatedTransferState);
      setTransferState(updatedTransferState);
    }
  }, [transferState]);

  // Handler for chip activation that also updates transfer state
  const handleChipActivate = useCallback((newChipsUsed: ChipsUsed) => {
    console.log('🎯 Chip activation handler called:', newChipsUsed);
    setChipsUsed(newChipsUsed);
    
    // Check if a wildcard was just activated
    const wildcard1JustActivated = newChipsUsed.wildcard1.isActive && !chipsUsed.wildcard1.isActive;
    const wildcard2JustActivated = newChipsUsed.wildcard2.isActive && !chipsUsed.wildcard2.isActive;
    
    if (wildcard1JustActivated || wildcard2JustActivated) {
      console.log('🃏 Wildcard activated, updating transfer state with 9999 transfers');
      const chipType = wildcard1JustActivated ? 'wildcard1' : 'wildcard2';
      
      // Use the most current transfer state by using a function update
      setTransferState(currentTransferState => {
        const updatedTransferState = activateWildcardTransfer(currentTransferState, chipType);
        console.log('🔄 Updated transfer state after wildcard activation:', {
          oldState: currentTransferState,
          newState: updatedTransferState,
          wildcardNowActive: updatedTransferState.wildcardActive,
          savedFreeTransfers: updatedTransferState.savedFreeTransfers
        });
        
        // Save to Firebase immediately
        if (user) {
          saveTransferStateToFirebase(user.uid, updatedTransferState).catch(error => {
            console.error('Error saving transfer state after wildcard activation:', error);
          });
        }
        
        return updatedTransferState;
      });
    }
  }, [chipsUsed, user]);

  // Watch for wildcard activation and ensure transfer state is updated
  useEffect(() => {
    const currentGameweekId = currentGameweek?.id || 1;
    const wildcard1Active = chipsUsed.wildcard1.isActive && chipsUsed.wildcard1.gameweek === currentGameweekId;
    const wildcard2Active = chipsUsed.wildcard2.isActive && chipsUsed.wildcard2.gameweek === currentGameweekId;
    const anyWildcardActive = wildcard1Active || wildcard2Active;
    
    // If any wildcard is active for current gameweek but transfer state doesn't reflect it
    if (anyWildcardActive && !transferState.wildcardActive) {
      console.log('🔄 Wildcard is active but transfer state not updated. Forcing update.');
      const chipType = wildcard1Active ? 'wildcard1' : 'wildcard2';
      const updatedTransferState = activateWildcardTransfer(transferState, chipType);
      console.log('⚡ Force updating transfer state:', updatedTransferState);
      setTransferState(updatedTransferState);
      
      // Save to Firebase
      if (user) {
        saveTransferStateToFirebase(user.uid, updatedTransferState).catch(error => {
          console.error('Error saving forced transfer state update:', error);
        });
      }
    }
    
    // If no wildcard is active but transfer state says it is
    if (!anyWildcardActive && transferState.wildcardActive) {
      console.log('🔄 No wildcard active but transfer state says it is. Resetting.');
      const updatedTransferState = {
        ...transferState,
        wildcardActive: false,
        savedFreeTransfers: Math.max(1, transferState.savedFreeTransfers >= 9999 ? 1 : transferState.savedFreeTransfers)
      };
      console.log('⚡ Force resetting transfer state:', updatedTransferState);
      setTransferState(updatedTransferState);
      
      if (user) {
        saveTransferStateToFirebase(user.uid, updatedTransferState).catch(error => {
          console.error('Error saving transfer state reset:', error);
        });
      }
    }
  }, [chipsUsed, transferState, currentGameweek?.id, user]);

  // Calculate transfer cost using new system
  const transferCost = useMemo(() => {
    // Determine which gameweek to use for transfer calculations (open gameweek if available)
    const gameweekForTransfers = openGameweek?.isOpen ? openGameweek.gw : (currentGameweek?.id || 1);
    
    // Check if wildcard is active for the open gameweek
    const isWildcard1ActiveForOpenGW = chipsUsed.wildcard1.isActive && 
                                       chipsUsed.wildcard1.gameweek === gameweekForTransfers;
    const isWildcard2ActiveForOpenGW = chipsUsed.wildcard2.isActive && 
                                       chipsUsed.wildcard2.gameweek === gameweekForTransfers;
    const isAnyWildcardActiveForOpenGW = isWildcard1ActiveForOpenGW || isWildcard2ActiveForOpenGW;
    
    // No cost if in GW1, user has unlimited transfers (new user), wildcard is active for open gameweek, or transferState wildcard is active
    const hasUnlimitedTransfers = gameweekForTransfers === 1 || 
                                  transferState.savedFreeTransfers >= 9999 ||
                                  isAnyWildcardActiveForOpenGW ||
                                  transferState.wildcardActive;
    
    if (hasUnlimitedTransfers) {
      console.log('🆓 User has unlimited transfers:', {
        displayGameweek: currentGameweek?.id,
        gameweekForTransfers,
        openGameweek: openGameweek?.gw,
        isOpenGameweek: openGameweek?.isOpen,
        savedFreeTransfers: transferState.savedFreeTransfers,
        wildcard1: {
          active: chipsUsed.wildcard1.isActive,
          gameweek: chipsUsed.wildcard1.gameweek,
          activeForOpenGW: isWildcard1ActiveForOpenGW
        },
        wildcard2: {
          active: chipsUsed.wildcard2.isActive,
          gameweek: chipsUsed.wildcard2.gameweek,
          activeForOpenGW: isWildcard2ActiveForOpenGW
        },
        transferStateWildcardActive: transferState.wildcardActive,
        reason: gameweekForTransfers === 1 ? 'GW1' : 
                transferState.savedFreeTransfers >= 9999 ? 'New user without previous squad' :
                isAnyWildcardActiveForOpenGW ? `Wildcard active for open GW${gameweekForTransfers}` :
                transferState.wildcardActive ? 'Transfer state wildcard active' : 'Unknown'
      });
      return 0;
    }

    // Calculate cost including pending transfers
    const totalTransfers = transferState.transfersMadeThisWeek + pendingTransfers.length;
    
    // Check if wildcard is active - include both chip state and transfer state for immediate response
    const isWildcardActiveNow = isAnyWildcardActiveForOpenGW || transferState.wildcardActive;
    
    const summary = calculateTransferCost(
      totalTransfers,
      transferState.savedFreeTransfers,
      gameweekForTransfers,
      isWildcardActiveNow,
      false // freeHit removed
    );

    console.log('💰 Transfer cost calculation:', {
      gameweekForTransfers,
      totalTransfers,
      savedFreeTransfers: transferState.savedFreeTransfers,
      isWildcardActive: isWildcardActiveNow,
      transferStateWildcardActive: transferState.wildcardActive,
      isAnyWildcardActiveForOpenGW,
      pointsDeducted: summary.pointsDeducted
    });

    return summary.pointsDeducted;
  }, [transferState, chipsUsed, currentGameweek?.id, openGameweek?.gw, openGameweek?.isOpen, pendingTransfers.length]);

  // Load user's saved squad from database
  const loadSavedSquad = useCallback(async () => {
    if (!user || !currentGameweek || squadLoaded) return

    try {
      setLoadingSquad(true)
      console.log(`🔍 Loading saved squad for user ${user.uid}, GW ${currentGameweek.id}`)

      const result = await getUserSquadFromSubcollection(user.uid, currentGameweek.id)

      if (result.success && result.data) {
        const savedSquad = result.data

        // Check if this squad was carried forward from a previous gameweek
        if (result.carriedForward && result.sourceGameweek) {
          console.log(`🔄 Squad carried forward from GW${result.sourceGameweek} to GW${currentGameweek.id}`)
        } else {
          console.log('✅ Found saved squad:', savedSquad)
        }

        // Create a map of saved players for quick lookup
        const savedPlayersMap = new Map()
        savedSquad.players.forEach((player: any) => {
          savedPlayersMap.set(player.playerId, player)
        })

        console.log('🔍 Squad structure:', {
          totalPlayers: savedSquad.players.length,
          captainId: savedSquad.captainId,
          startingPlayers: savedSquad.players.filter((p: any) => p.isStarting).length,
          benchPlayers: savedSquad.players.filter((p: any) => !p.isStarting).length
        })

        // Update players state with saved selections and captain
        setPlayers(prev => prev.map(p => {
          const savedPlayer = savedPlayersMap.get(p.id)
          if (savedPlayer) {
            return {
              ...p,
              selected: true,
              captain: p.id === savedSquad.captainId, // Only the actual captain gets captain=true
            }
          }
          return {
            ...p,
            selected: false,
            captain: false
          }
        }))

        // Set captain state
        if (savedSquad.captainId) {
          setCaptain(savedSquad.captainId)
          console.log('👑 Captain set to:', savedSquad.captainId)
        }

        // The key insight: Since we now save the properly arranged starting XI and bench,
        // we need to create substitutions that will recreate that exact arrangement
        const restoredSubstitutions: { [key: string]: 'starting' | 'bench' } = {}

        // Safely handle players array
        if (savedSquad.players && Array.isArray(savedSquad.players)) {
          savedSquad.players.forEach((player: any) => {
            if (player && player.playerId) {
              if (player.isStarting) {
                restoredSubstitutions[player.playerId] = 'starting'
              } else {
                restoredSubstitutions[player.playerId] = 'bench'
              }
            }
          })
        }

        setSubstitutions(restoredSubstitutions)
        console.log('🔄 Substitutions restored:', restoredSubstitutions)

        // Set formation
        if (savedSquad.formation) {
          setSelectedFormation(savedSquad.formation)
          console.log('⚽ Formation set to:', savedSquad.formation)
        }

        // Set chips if available
        if (savedSquad.chipsUsed) {
          setChipsUsed(savedSquad.chipsUsed)
          console.log('🎮 Chips loaded:', savedSquad.chipsUsed)
        }

        // Set transfer state if available - IMPORTANT: Load the actual saved transfer state
        if (savedSquad.transferState) {
          const loadedTransferState = {
            savedFreeTransfers: savedSquad.transferState.freeTransfers || 1,
            transfersMadeThisWeek: savedSquad.transferState.transfersMade || 0,
            pointsDeductedThisWeek: savedSquad.transferState.transferCost || 0,
            lastGameweekProcessed: currentGameweek.id,
            wildcardActive: savedSquad.chipsUsed?.wildcard1?.isActive || savedSquad.chipsUsed?.wildcard2?.isActive || false,
            freeHitActive: savedSquad.chipsUsed?.freeHit?.isActive || false
          };
          
          setTransferState(loadedTransferState);
          console.log('🔄 Transfer state loaded from saved squad:', loadedTransferState);
          
          // Save this transfer state to the API as well to keep it in sync
          try {
            const syncResponse = await fetch('/api/transfers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.uid,
                gameweekId: currentGameweek.id,
                transferState: loadedTransferState
              })
            });
            
            if (syncResponse.ok) {
              console.log('✅ Transfer state synced to API');
            } else {
              console.warn('⚠️ Failed to sync transfer state to API');
            }
          } catch (error) {
            console.warn('⚠️ Error syncing transfer state to API:', error);
          }
        } else {
          // If no transfer state in saved squad, load from API as fallback
          try {
            const gameweekForTransfers = openGameweek?.isOpen ? openGameweek.gw : currentGameweek.id;
            const transferResponse = await fetch(`/api/transfers?userId=${user.uid}&gameweekId=${gameweekForTransfers}`);
            
            if (transferResponse.ok) {
              const transferData = await transferResponse.json();
              setTransferState(transferData.transferState);
              console.log('🔄 Transfer state loaded from API (fallback):', transferData.transferState);
            } else {
              // Use default state as last resort
              const defaultState = getDefaultTransferState(currentGameweek.id);
              setTransferState(defaultState);
              console.log('🔄 Using default transfer state (no saved data):', defaultState);
            }
          } catch (error) {
            console.warn('⚠️ Error loading transfer state from API, using default:', error);
            const defaultState = getDefaultTransferState(currentGameweek.id);
            setTransferState(defaultState);
          }
        }

        console.log(`✅ Squad loaded successfully! ${savedSquad.players.length} players selected`)

        // Show brief success notification with carry-forward info
        let message: string;
        if (result.carriedForward && result.sourceGameweek) {
          message = language === 'ar'
            ? `🔄 تم نقل فريقك من الجولة ${result.sourceGameweek} إلى الجولة ${currentGameweek.id}`
            : `🔄 Squad carried forward from Gameweek ${result.sourceGameweek} to ${currentGameweek.id}`
        } else {
          message = language === 'ar'
            ? `✅ تم تحميل فريقك المحفوظ للجولة ${currentGameweek.id}`
            : `✅ Loaded your saved squad for Gameweek ${currentGameweek.id}`
        }

        console.log(message)

        // Optional: Show a brief toast notification (you can implement a toast system later)
        // For now, we'll just log it to avoid interrupting the user experience

      } else {
        console.log('ℹ️ No saved squad found for this gameweek')
      }

    } catch (error) {
      console.error('💥 Error loading saved squad:', error)
    } finally {
      setLoadingSquad(false)
      setSquadLoaded(true)
    }
  }, [user, currentGameweek, squadLoaded, language])



  // Load chips and transfer state from Firebase on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (user && currentGameweek) {
        try {
          // Determine which gameweek to use for transfers (open gameweek if available)
          const gameweekForTransfers = openGameweek?.isOpen ? openGameweek.gw : currentGameweek.id;

          console.log(`📊 Loading user data for GW${gameweekForTransfers} (open: ${openGameweek?.isOpen})`);

          // Load chips for the appropriate gameweek
          const userChips = await loadChipsFromFirebase(user.uid);

          // Reset chip activation states based on current gameweek
          const gameweekChips = resetChipsForGameweek(userChips, gameweekForTransfers);

          // Handle wildcard deactivation and update transfer state
          handleWildcardDeactivation(userChips, gameweekChips, gameweekForTransfers);

          // If any chips were deactivated, save the updated state back to Firebase
          const hasChanges = Object.keys(gameweekChips).some(chipKey => {
            const originalChip = userChips[chipKey as keyof ChipsUsed];
            const resetChip = gameweekChips[chipKey as keyof ChipsUsed];
            return originalChip.isActive !== resetChip.isActive;
          });

          if (hasChanges) {
            console.log(`🔄 Saving updated chip states to Firebase for GW${gameweekForTransfers}`);
            try {
              await fetch('/api/chips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.uid,
                  chipsUsed: gameweekChips,
                  currentGameweek: gameweekForTransfers
                })
              });
            } catch (error) {
              console.warn('Failed to save updated chip states:', error);
            }
          }

          console.log(`🎮 Loaded and reset chips for GW${gameweekForTransfers}:`, gameweekChips);
          setChipsUsed(gameweekChips);

          // NOTE: Transfer state will be loaded from saved squad in loadSavedSquad function
          // Only load from API if no saved squad exists (first time user)
          console.log(`ℹ️ Transfer state will be loaded from saved squad or defaulted in loadSavedSquad`);

          // Load saved squad will be called separately and will handle transfer state
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      }
    };

    loadUserData();
  }, [user, currentGameweek, openGameweek, handleWildcardDeactivation]);



  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayerDetails, setSelectedPlayerDetails] = useState<Player | null>(null);
  const [clubs, setClubs] = useState<string[]>([]);
  
  // Filters
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('totalPoints');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 15]);
  const [ownershipRange, setOwnershipRange] = useState([0, 100]);

  const [playerGameweekStats, setPlayerGameweekStats] = useState<{[playerId: string]: any[]}>({});

  // Add substitution state
  const [substitutionMode, setSubstitutionMode] = useState(false)
  const [selectedForSub, setSelectedForSub] = useState<{ playerId: string; isStarting: boolean } | null>(null)

  // Substitution validation function
  const validateSubstitution = (startingPlayerId: string, benchPlayerId: string) => {
    const startingPlayer = selectedPlayers.find(p => p.id === startingPlayerId)
    const benchPlayer = selectedPlayers.find(p => p.id === benchPlayerId)
    
    if (!startingPlayer || !benchPlayer) return { valid: false, error: 'Player not found' }
    
    // GK can only be substituted with GK
    if (startingPlayer.position === 'GKP' && benchPlayer.position !== 'GKP') {
      return { valid: false, error: 'Goalkeeper can only be substituted with another goalkeeper' }
    }
    
    if (benchPlayer.position === 'GKP' && startingPlayer.position !== 'GKP') {
      return { valid: false, error: 'Goalkeeper can only substitute another goalkeeper' }
    }
    
    // If both players are goalkeepers, allow the substitution
    if (startingPlayer.position === 'GKP' && benchPlayer.position === 'GKP') {
      return { valid: true }
    }
    
    // For non-GK substitutions, check formation rules
    const currentStarting = selectedPlayers.slice(0, 11)
    const newStarting = currentStarting.map(p => 
      p.id === startingPlayerId ? benchPlayer : p
    )
    
    const positionCounts = {
      GKP: newStarting.filter(p => p.position === 'GKP').length,
      DEF: newStarting.filter(p => p.position === 'DEF').length,
      MID: newStarting.filter(p => p.position === 'MID').length,
      FWD: newStarting.filter(p => p.position === 'FWD').length
    }
    
    // Debug logging
    console.log('Position validation:', {
      currentStarting: currentStarting.map(p => ({ name: p.nameAr || p.name, position: p.position })),
      newStarting: newStarting.map(p => ({ name: p.nameAr || p.name, position: p.position })),
      positionCounts,
      startingPlayer: { name: startingPlayer.nameAr || startingPlayer.name, position: startingPlayer.position },
      benchPlayer: { name: benchPlayer.nameAr || benchPlayer.name, position: benchPlayer.position }
    })
    
    // Validate formation rules
    if (positionCounts.GKP !== 1) {
      return { valid: false, error: `Must have exactly 1 goalkeeper in starting 11 (found ${positionCounts.GKP})` }
    }
    
    if (positionCounts.DEF < 3 || positionCounts.DEF > 5) {
      return { valid: false, error: 'Must have 3-5 defenders in starting 11' }
    }
    
    if (positionCounts.MID < 2 || positionCounts.MID > 5) {
      return { valid: false, error: 'Must have 2-5 midfielders in starting 11' }
    }
    
    if (positionCounts.FWD < 1 || positionCounts.FWD > 3) {
      return { valid: false, error: 'Must have 1-3 forwards in starting 11' }
    }
    
    return { valid: true }
  }

  // Add position tracking state
  const [playerPositions, setPlayerPositions] = useState<{[playerId: string]: number}>({})

  // Add substitution tracking state
  const [substitutions, setSubstitutions] = useState<{[playerId: string]: 'starting' | 'bench'}>({})

  // Get properly arranged players with substitution tracking
  const getArrangedPlayers = () => {
    const allSelected = players.filter(p => p.selected)
    
    if (allSelected.length === 0) return { starting: [], bench: [] }
    
    // Group by position
    const byPosition = {
      GKP: allSelected.filter(p => p.position === 'GKP'),
      DEF: allSelected.filter(p => p.position === 'DEF'),
      MID: allSelected.filter(p => p.position === 'MID'),
      FWD: allSelected.filter(p => p.position === 'FWD')
    }
    
    // Initial default arrangement (before any substitutions)
    const defaultStarting = [
      ...byPosition.GKP.slice(0, 1),  // 1 GK
      ...byPosition.DEF.slice(0, 4),  // 4 DEF
      ...byPosition.MID.slice(0, 4),  // 4 MID
      ...byPosition.FWD.slice(0, 2)   // 2 FWD
    ]
    
    // Default bench: GK has dedicated spot, others are flexible
    const defaultBenchGK = byPosition.GKP.slice(1, 2) // Only 2nd GK
    const defaultBenchOutfield = [
      ...byPosition.DEF.slice(4),     // 5th DEF
      ...byPosition.MID.slice(4),     // 5th MID  
      ...byPosition.FWD.slice(2)      // 3rd FWD
    ]
    
    // Apply substitutions
    const finalStarting: Player[] = []
    const finalBenchGK: Player[] = []
    const finalBenchOutfield: Player[] = []
    
    // Process all selected players
    allSelected.forEach(player => {
      const substitutionStatus = substitutions[player.id]
      
      if (substitutionStatus === 'starting') {
        // Player was moved to starting via substitution
        finalStarting.push(player)
      } else if (substitutionStatus === 'bench') {
        // Player was moved to bench via substitution
        if (player.position === 'GKP') {
          finalBenchGK.push(player)
        } else {
          finalBenchOutfield.push(player)
        }
      } else {
        // No substitution - use default position
        const isInDefaultStarting = defaultStarting.some(p => p.id === player.id)
        if (isInDefaultStarting) {
          finalStarting.push(player)
        } else {
          // Default bench position
          if (player.position === 'GKP') {
            finalBenchGK.push(player)
          } else {
            finalBenchOutfield.push(player)
          }
        }
      }
    })
    
    // Combine bench (GK first, then outfield players)
    const finalBench = [...finalBenchGK, ...finalBenchOutfield]
    
    // SAFETY CHECK: Ensure exactly 11 starting players
    const maxStartingPlayers = 11
    const validStarting = finalStarting.slice(0, maxStartingPlayers)
    
    // If we have more than 11 starting players, move extras to bench
    const extraPlayers = finalStarting.slice(maxStartingPlayers)
    const saferBench = [...finalBench, ...extraPlayers]
    
    console.log(`🔍 Player arrangement: Starting=${validStarting.length}, Bench=${saferBench.length}, Total=${validStarting.length + saferBench.length}`)
    
    if (validStarting.length > 11) {
      console.warn(`⚠️ WARNING: More than 11 starting players detected! Limiting to 11.`)
    }
    
    return { 
      starting: validStarting, 
      bench: saferBench 
    }
  }

  // Use arranged players instead of simple slice
  const arrangedPlayers = getArrangedPlayers()
  const selectedPlayers = [...arrangedPlayers.starting, ...arrangedPlayers.bench]
  const totalCost = selectedPlayers.reduce((sum, p) => sum + p.price, 0);
  const totalValue = totalCost; // Same as totalCost, just different name for consistency
  const remainingBudget = budget - totalCost;

  // Calculate dynamic formation based on actual starting 11 players
  const currentFormation = (() => {
    const startingPlayers = arrangedPlayers.starting
    const counts = {
      gkp: startingPlayers.filter(p => p.position === 'GKP').length,
      def: startingPlayers.filter(p => p.position === 'DEF').length,
      mid: startingPlayers.filter(p => p.position === 'MID').length,
      fwd: startingPlayers.filter(p => p.position === 'FWD').length
    }
    
    const formationString = `${counts.def}-${counts.mid}-${counts.fwd}`
    
    return {
      formation: formationString,
      def: counts.def,
      mid: counts.mid,
      fwd: counts.fwd,
      gkp: counts.gkp
    }
  })()

  // Simplified handleSubstitution function
  const handleSubstitution = (playerId: string, isStarting: boolean) => {
    if (!selectedForSub) {
      setSelectedForSub({ playerId, isStarting })
      return
    }
    
    if (selectedForSub.isStarting === isStarting) {
      setSelectedForSub({ playerId, isStarting })
      return
    }
    
    const startingPlayerId = selectedForSub.isStarting ? selectedForSub.playerId : playerId
    const benchPlayerId = selectedForSub.isStarting ? playerId : selectedForSub.playerId
    
    // Find the players
    const startingPlayer = selectedPlayers.find(p => p.id === startingPlayerId)
    const benchPlayer = selectedPlayers.find(p => p.id === benchPlayerId)
    
    if (!startingPlayer || !benchPlayer) {
      alert('Player not found')
      return
    }
    
    // GK validation
    if (startingPlayer.position === 'GKP' && benchPlayer.position !== 'GKP') {
      alert('Goalkeeper can only be substituted with another goalkeeper')
      return
    }
    
    if (benchPlayer.position === 'GKP' && startingPlayer.position !== 'GKP') {
      alert('Goalkeeper can only substitute another goalkeeper')
      return
    }
    
    // Simulate the substitution to validate formation
    const tempSubstitutions = {
      ...substitutions,
      [startingPlayerId]: 'bench' as const,
      [benchPlayerId]: 'starting' as const
    }
    
    // Calculate new formation with temp substitutions
    const allSelected = players.filter(p => p.selected)
    const tempStarting = allSelected.filter(player => {
      const currentPos = substitutions[player.id]
      const newPos = tempSubstitutions[player.id]
      
      if (newPos) return newPos === 'starting'
      if (currentPos) return currentPos === 'starting'
      
      // Default position logic
      const byPosition = {
        GKP: allSelected.filter(p => p.position === 'GKP'),
        DEF: allSelected.filter(p => p.position === 'DEF'),
        MID: allSelected.filter(p => p.position === 'MID'),
        FWD: allSelected.filter(p => p.position === 'FWD')
      }
      
      const initialStarting = [
        ...byPosition.GKP.slice(0, 1),
        ...byPosition.DEF.slice(0, 4),
        ...byPosition.MID.slice(0, 4),
        ...byPosition.FWD.slice(0, 2)
      ]
      
      return initialStarting.some(p => p.id === player.id)
    })
    
    const newCounts = {
      gkp: tempStarting.filter(p => p.position === 'GKP').length,
      def: tempStarting.filter(p => p.position === 'DEF').length,
      mid: tempStarting.filter(p => p.position === 'MID').length,
      fwd: tempStarting.filter(p => p.position === 'FWD').length
    }
    
    // Validate formation
    if (newCounts.gkp !== 1 || newCounts.def < 3 || newCounts.def > 5 || 
        newCounts.mid < 3 || newCounts.mid > 5 || newCounts.fwd < 1 || newCounts.fwd > 3) {
      alert('Invalid formation after substitution')
      return
    }
    
    // Apply the substitution
    setSubstitutions(tempSubstitutions)
    
    console.log('Substitution completed:', {
      startingPlayer: startingPlayer.nameAr,
      benchPlayer: benchPlayer.nameAr,
      newFormation: `${newCounts.def}-${newCounts.mid}-${newCounts.fwd}`
    })
    
    setSubstitutionMode(false)
    setSelectedForSub(null)
  }

  // Check if player is selected for substitution
  const isSelectedForSub = (playerId: string, isStarting: boolean) => {
    return selectedForSub?.playerId === playerId && selectedForSub?.isStarting === isStarting
  }

  // Fetch player gameweek stats
  const fetchPlayerGameweekStats = async (playerId: string) => {
    try {
      // Mock gameweek stats for now
      const mockStats = Array.from({ length: 5 }, (_, i) => ({
        gameweek_number: i + 1,
        total_points: Math.floor(Math.random() * 15),
        goals: Math.floor(Math.random() * 3),
        assists: Math.floor(Math.random() * 2),
        clean_sheets: Math.random() > 0.7 ? 1 : 0
      }));
      
      setPlayerGameweekStats(prev => ({
        ...prev,
        [playerId]: mockStats
      }));
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }
  };

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch from Firebase
      const firebasePlayers = await fetchAllPlayers();
      
      const transformedPlayers = firebasePlayers.map(player => {
        // Normalize position from database
        let normalizedPosition: 'GKP' | 'DEF' | 'MID' | 'FWD';
        const pos = player.position.toLowerCase();
        
        if (pos.includes('goalkeeper') || pos === 'gkp') {
          normalizedPosition = 'GKP';
        } else if (pos.includes('defender') || pos === 'def') {
          normalizedPosition = 'DEF';
        } else if (pos.includes('midfielder') || pos === 'mid') {
          normalizedPosition = 'MID';
        } else if (pos.includes('forward') || pos === 'fwd') {
          normalizedPosition = 'FWD';
        } else {
          // Fallback - keep original and convert to uppercase
          normalizedPosition = player.position.toUpperCase() as 'GKP' | 'DEF' | 'MID' | 'FWD';
        }
        
        return {
          ...player,
          position: normalizedPosition,
          selected: false,
          captain: false,
          ownership: Math.random() * 100,
          points: player.points || {}, // Keep the original points object
          totalPoints: player.totalPoints || 0, // Ensure totalPoints is included
          club: player.club, // Make sure club is preserved
        };
      });
      
      setPlayers(transformedPlayers);
      
      // Extract unique clubs from players data
      const uniqueClubs = [...new Set(firebasePlayers.map(p => p.club))].sort();
      setClubs(uniqueClubs);
      
    } catch (error) {
      console.error('Error fetching players:', error);
      setPlayers([]);
      setClubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Automatic squad loading - triggers when all prerequisites are ready
  useEffect(() => {
    // Only attempt loading if we have user, gameweek, players loaded, and haven't loaded squad yet
    const shouldLoad = user && currentGameweek && !squadLoaded && !loadingSquad && !loading && players.length > 0

    if (shouldLoad) {
      console.log('🎯 Auto-loading saved squad...')
      loadSavedSquad();
    }
  }, [user, currentGameweek, squadLoaded, loadingSquad, loadSavedSquad, loading, players.length]);

  // Reset squad loaded flag when gameweek changes to allow loading new gameweek's squad
  useEffect(() => {
    if (currentGameweek) {
      setSquadLoaded(false);
    }
  }, [currentGameweek]);

  // Track open gameweek for save functionality
  useEffect(() => {
    const checkOpenGameweek = async () => {
      try {
        const openGW = await GameweekDeadlineService.getCurrentGameweek();
        setOpenGameweek(openGW);
      } catch (error) {
        console.error('Error checking open gameweek:', error);
      }
    };

    checkOpenGameweek();

    // Check every minute for updates
    const interval = setInterval(checkOpenGameweek, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check deadline and wildcard status using gameweeksDeadline collection
  useEffect(() => {
    const checkDeadlineAndWildcard = async () => {
      if (!user) return;

      try {
        // Check if there's any open gameweek (not just the current display gameweek)
        const currentOpenGameweek = await GameweekDeadlineService.getCurrentGameweek();

        // Check chips for the open gameweek (not display gameweek)
        const gameweekForChips = currentOpenGameweek?.isOpen ? currentOpenGameweek.gw : currentGW;
        const activeChips = await getActiveChips(user.uid, gameweekForChips);

        // Set deadline passed state based on whether there's an open gameweek
        const hasOpenGameweek = currentOpenGameweek && currentOpenGameweek.isOpen;
        setIsDeadlinePassedState(!hasOpenGameweek);
        setWildcardActive(activeChips.wildcardActive);

        console.log(`🕒 Deadline Status Check:`, {
          displayGameweek: currentGW,
          openGameweek: currentOpenGameweek?.gw || 'none',
          isOpen: currentOpenGameweek?.isOpen || false,
          canSave: hasOpenGameweek,
          chipsCheckedForGW: gameweekForChips,
          wildcardActive: activeChips.wildcardActive,
          benchBoostActive: activeChips.benchBoostActive,
          tripleCaptainActive: activeChips.tripleCaptainActive
        });

        // Show user-friendly message if no open gameweek
        if (!hasOpenGameweek) {
          console.log(`🚫 No open gameweek available for saving`);
        }
      } catch (error) {
        console.error('Error checking deadline and wildcard:', error);
        // If there's an error, assume deadline passed to be safe
        setIsDeadlinePassedState(true);
      }
    };

    checkDeadlineAndWildcard();

    // Check every minute
    const interval = setInterval(checkDeadlineAndWildcard, 60000);
    return () => clearInterval(interval);
  }, [user, currentGW]);

  // Warn user about unsaved pending transfers when leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingTransfers.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have pending transfers that haven\'t been confirmed. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pendingTransfers]);

  // Helper function to get current gameweek points instead of total points
  const getGameweekPoints = (player: Player, gameweek: number) => {
    if (!player.points || typeof player.points !== 'object') return 0;
    const gameweekKey = `gw${gameweek}`;
    return player.points[gameweekKey] || 0;
  };

  const getCurrentGameweekPoints = (player: Player) => {
    const currentGW = openGameweek?.gw || 1;
    return getGameweekPoints(player, currentGW);
  };

  // Add club limit validation
  const validateClubLimit = (playerId: string, currentSquad: Player[]) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return false;
    
    const clubCount = currentSquad.filter(p => p.club === player.club).length;
    console.log('Club validation:', {
      player: player.name,
      club: player.club,
      clubCount,
      limit: 3
    });
    
    return clubCount < 3; // Max 3 players per club
  };

  // Add price range filter
  const filteredPlayers = players.filter(player => {
    // Position filter - handle different position formats
    let matchesPosition = selectedPosition === 'all';
    
    if (!matchesPosition) {
      const playerPos = player.position.toUpperCase();
      const selectedPos = selectedPosition.toUpperCase();
      
      matchesPosition = 
        playerPos === selectedPos ||
        (selectedPos === 'GKP' && (playerPos === 'GOALKEEPER' || playerPos === 'GKP')) ||
        (selectedPos === 'DEF' && (playerPos === 'DEFENDER' || playerPos === 'DEF')) ||
        (selectedPos === 'MID' && (playerPos === 'MIDFIELDER' || playerPos === 'MID')) ||
        (selectedPos === 'FWD' && (playerPos === 'FORWARD' || playerPos === 'FWD'));
    }
    
    const matchesClub = selectedClub === 'all' || player.club === selectedClub;
    const matchesSearch = searchTerm === '' || 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.nameAr && player.nameAr.toLowerCase().includes(searchTerm.toLowerCase())) ||
      player.club.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = player.price >= priceRange[0] && player.price <= priceRange[1];
    
    return matchesPosition && matchesClub && matchesSearch && matchesPrice;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price': return b.price - a.price;
      case 'totalPoints': return b.totalPoints - a.totalPoints;
      case 'ownership': return (b.ownership || 0) - (a.ownership || 0);
      case 'name': return (a.nameAr || a.name).localeCompare(b.nameAr || b.name);
      default: return 0;
    }
  });

  // Get club-specific kit colors
  const getClubKitColor = (club: string) => {
    const clubColors = {
       'Al-Baqaa': '#000000',        // Black
  'Sama Al-Sarhan': '#d18800ff',  // Orange
  'Al-Salt': '#120568ff  ',      // Light Gray
  'Shabab Al-Ordon': '#de0404ff', // Blue
 'Al-Ahly': '#a8f2aeff', // Pale greenish-white (white with a hint of green)
  'Al-Wehdat': '#006400',       // Dark Green
  'Al-Ramtha SC': '#000056ff',    // Blue
  'Al-Faisaly SC': '#2fb2e6ff',   // Sky Blue
  'Al-Jazeera': '#C70000 ', // Red
  'Al-Hussein Irbid': '#FFD800'    // Yellow
    };

    // Generate consistent color based on club name hash if not in predefined colors
    if (clubColors[club as keyof typeof clubColors]) {
      return clubColors[club as keyof typeof clubColors];
    }

    let hash = 0;
    for (let i = 0; i < club.length; i++) {
      hash = club.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Handle player click
  const handlePlayerSelect = (playerId: string) => {
    console.log('handlePlayerSelect called with:', playerId);
    
    const player = players.find(p => p.id === playerId);
    if (!player) {
      console.log('Player not found');
      return;
    }

    console.log('Setting selected player:', player.nameAr || player.name);
    setSelectedPlayerDetails(player);
    setShowPlayerModal(true);
    
    // Fetch gameweek stats when modal opens
    fetchPlayerGameweekStats(playerId);
  };

  // Add player to squad (complete transfer)
  const addPlayerToSquad = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // If this is a replacement (transfer)
    if (playerToTransferOut) {
      const playerOut = players.find(p => p.id === playerToTransferOut);

      // Validate same position
      if (playerOut && playerOut.position !== player.position) {
        alert('Must replace with same position player');
        return;
      }

      // Check budget after transfer
      const newCost = totalCost - (playerOut?.price || 0) + player.price;
      if (newCost > budget) {
        alert(`Transfer exceeds budget by ${(newCost - budget).toFixed(1)}M`);
        return;
      }

      if (!user || !currentGameweek) {
        alert('User or gameweek not available');
        return;
      }

      try {
        console.log('🔄 Processing direct transfer:', {
          playerOut: playerOut?.nameAr || playerOut?.name,
          playerIn: player.nameAr || player.name,
          currentTransferState: transferState
        });

        // Call the transfer API to process the transfer
        const transferResponse = await fetch('/api/transfers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            playerOutId: playerToTransferOut,
            playerInId: playerId,
            gameweekId: openGameweek?.isOpen ? openGameweek.gw : currentGameweek.id
          })
        });

        if (!transferResponse.ok) {
          const errorData = await transferResponse.json();
          throw new Error(errorData.error || 'Transfer failed');
        }

        const transferResult = await transferResponse.json();
        console.log('✅ Transfer API result:', transferResult);

        // Update local state based on API response
        setTransferState(transferResult.transferState);

        // Update players state - remove old player, add new player
        setPlayers(prev => prev.map(p => {
          if (p.id === playerToTransferOut) {
            return { ...p, selected: false, captain: false };
          }
          if (p.id === playerId) {
            return { ...p, selected: true };
          }
          return p;
        }));

        // Clear captain if removing captain
        if (captain === playerToTransferOut) {
          setCaptain('');
        }

        // Update substitutions state to ensure new player is in correct position
        const updatedSubstitutions = { ...substitutions };
        
        // If the old player had a specific substitution position, remove it
        if (updatedSubstitutions[playerToTransferOut]) {
          delete updatedSubstitutions[playerToTransferOut];
        }
        
        // If the old player was manually placed in starting XI, put new player there too
        if (substitutions[playerToTransferOut] === 'starting') {
          updatedSubstitutions[playerId] = 'starting';
        }
        // If the old player was manually placed on bench, put new player there too
        else if (substitutions[playerToTransferOut] === 'bench') {
          updatedSubstitutions[playerId] = 'bench';
        }
        
        setSubstitutions(updatedSubstitutions);
        console.log('🔄 Updated substitutions after transfer:', updatedSubstitutions);

        // 🔥 CRITICAL: Save the updated squad immediately with new transfer state
        if (openGameweek?.isOpen) {
          console.log('💾 Saving squad immediately after transfer...');
          
          // Recreate arranged players with the updated state
          const currentSelectedPlayers = players.filter(p => p.selected || p.id === playerId).filter(p => p.id !== playerToTransferOut);
          
          const userSquadData = {
            userId: user.uid,
            gameweekId: openGameweek.gw,
            players: currentSelectedPlayers.map(p => ({
              playerId: p.id,
              name: p.name,
              nameAr: p.nameAr || p.name,
              position: p.position,
              club: p.club,
              price: p.price,
              isCaptain: p.id === captain && p.id !== playerToTransferOut,
              isStarting: substitutions[p.id] === 'starting' || (!substitutions[p.id] && ['GKP', 'DEF', 'MID', 'FWD'].includes(p.position)),
              benchPosition: substitutions[p.id] === 'bench' ? 1 : null,
              points: p.totalPoints
            })),
            formation: selectedFormation,
            captainId: captain !== playerToTransferOut ? captain : '',
            totalValue: currentSelectedPlayers.reduce((sum, p) => sum + p.price, 0),
            transferCost: transferResult.transferState.pointsDeductedThisWeek,
            chipsUsed: {
              wildcard1: {
                used: chipsUsed.wildcard1.used,
                gameweek: chipsUsed.wildcard1.gameweek,
                isActive: chipsUsed.wildcard1.isActive || false
              },
              wildcard2: {
                used: chipsUsed.wildcard2.used,
                gameweek: chipsUsed.wildcard2.gameweek,
                isActive: chipsUsed.wildcard2.isActive || false
              },
              benchBoost: {
                used: chipsUsed.benchBoost.used,
                gameweek: chipsUsed.benchBoost.gameweek,
                isActive: chipsUsed.benchBoost.isActive || false
              },
              tripleCaptain: {
                used: chipsUsed.tripleCaptain.used,
                gameweek: chipsUsed.tripleCaptain.gameweek,
                isActive: chipsUsed.tripleCaptain.isActive || false
              },
              freeHit: {
                used: chipsUsed.freeHit?.used || false,
                gameweek: chipsUsed.freeHit?.gameweek || null,
                isActive: chipsUsed.freeHit?.isActive || false
              }
            },
            transferState: {
              transfersMade: transferResult.transferState.transfersMadeThisWeek,
              freeTransfers: transferResult.transferState.savedFreeTransfers,
              transferCost: transferResult.transferState.pointsDeductedThisWeek,
              pendingTransfers: []
            },
            isValid: true,
            validationErrors: [],
            deadline: `GW${openGameweek.gw} deadline`,
            isSubmitted: false
          };

          // Save to Firebase
          const firebaseResult = await saveUserSquadToSubcollection(user.uid, openGameweek.gw, userSquadData);
          
          if (firebaseResult.success) {
            console.log('✅ Squad saved successfully after transfer!');
          } else {
            console.error('❌ Failed to save squad after transfer');
          }
        }

        // Force a re-render to ensure UI updates
        console.log('🔄 Transfer completed, forcing UI refresh');
        
        // Show success message
        alert(`Transfer completed! ${playerOut?.nameAr || playerOut?.name} → ${player.nameAr || player.name}. Cost: ${transferResult.summary?.pointsDeducted || 0} points`);

        setPlayerToTransferOut('');
        setShowPlayerModal(false);
        
        // Force component re-render by updating a state and reloading squad
        setTimeout(async () => {
          console.log('🔄 Post-transfer state check:', {
            playersSelected: players.filter(p => p.selected).length,
            newPlayerSelected: players.find(p => p.id === playerId)?.selected,
            substitutions: substitutions
          });
          
          // Force reload the squad from Firebase to ensure UI is in sync
          if (user && openGameweek?.isOpen) {
            console.log('🔄 Force reloading squad after transfer to ensure UI sync...');
            setSquadLoaded(false); // This will trigger loadSavedSquad again
          }
        }, 500);
        
        return;

      } catch (error) {
        console.error('Transfer error:', error);
        alert('Transfer failed. Please try again.');
        return;
      }
    }

    // Regular add player validation (for initial squad building)
    const currentSelected = players.filter(p => p.selected);
    const positionCount = currentSelected.filter(p => p.position === player.position).length;
    const maxByPosition = { GKP: 2, DEF: 5, MID: 5, FWD: 3 };
    
    if (currentSelected.length >= 15) {
      alert('Cannot select more than 15 players');
      return;
    }

    if (positionCount >= (maxByPosition[player.position] || 0)) {
      alert(`Cannot select more than ${maxByPosition[player.position]} ${player.position} players`);
      return;
    }

    if (!validateClubLimit(playerId, currentSelected)) {
      alert('Cannot select more than 3 players from the same club');
      return;
    }

    if (totalCost + player.price > budget) {
      alert(`Exceeds budget limit. You need ${(totalCost + player.price - budget).toFixed(1)}M more`);
      return;
    }

    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, selected: true } : p
    ));
    
    setShowPlayerModal(false);
  };

  // Remove player from squad (start transfer)
  const removePlayerFromSquad = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    // Remove player and clear captain if needed
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, selected: false, captain: false } : p
    ));
    if (captain === playerId) setCaptain('');
    
    // Set as player to replace
    setPlayerToTransferOut(playerId);
    setShowPlayerModal(false);
    
    alert(`${player.nameAr || player.name} removed. Now select a replacement player.`);
  };

  // Get validation message for UI
  const getValidationMessage = (player: Player) => {
    if (!player || player.selected) return '';
    
    const currentSelected = players.filter(p => p.selected);
    
    // Check squad limit
    if (currentSelected.length >= 15) return 'Squad full (15/15)';
    
    // Check budget
    if (totalCost + player.price > budget) {
      return `Over budget by ${(totalCost + player.price - budget).toFixed(1)}M ${language === 'ar' ? 'د.أ' : 'JOD'}`;
    }
    
    // Check position limit
    const positionCount = currentSelected.filter(p => p.position === player.position).length;
    const maxByPosition = { 
      GKP: 2, GOALKEEPER: 2,
      DEF: 5, DEFENDER: 5,
      MID: 5, MIDFIELDER: 5,
      FWD: 3, FORWARD: 3
    };
    if (positionCount >= (maxByPosition[player.position] || 0)) {
      return `Max ${maxByPosition[player.position]} ${player.position} players`;
    }
    
    // Check club limit
    const clubCount = currentSelected.filter(p => p.club === player.club).length;
    if (clubCount >= 3) return 'Max 3 players per club';
    
    return '';
  };

  // Get players by position for formation
  const getPlayersByPosition = () => {
    const selected = players.filter(p => p.selected);
    return {
      GKP: selected.filter(p => p.position === 'GKP'),
      DEF: selected.filter(p => p.position === 'DEF'),
      MID: selected.filter(p => p.position === 'MID'),
      FWD: selected.filter(p => p.position === 'FWD')
    };
  };

  const positionPlayers = getPlayersByPosition();

  const uniqueClubs = [...new Set(players.map(p => p.club))];

  // Handle captain selection
  const handleCaptainSelection = (playerId: string) => {
    if (isDeadlinePassedState) return;

    console.log('Captain selection - Player ID:', playerId);
    console.log('Current captain:', captain);

    // Check if player is in starting XI
    const isInStartingXI = arrangedPlayers.starting.some((p: any) => p.id === playerId);

    if (!isInStartingXI) {
      alert(language === 'ar'
        ? 'يمكن فقط اختيار قائد من التشكيلة الأساسية (11 لاعب)'
        : 'Can only captain players in the starting XI (11 players)'
      );
      return;
    }

    // If clicking on current captain, remove captain
    if (captain === playerId) {
      console.log('Removing captain');
      setPlayers(prev => prev.map(p => ({
        ...p,
        captain: false
      })));
      setCaptain('');
    } else {
      console.log('Setting new captain to:', playerId);
      // Set new captain
      setPlayers(prev => prev.map(p => ({
        ...p,
        captain: p.id === playerId
      })));
      setCaptain(playerId);
    }

    console.log('Captain after update:', playerId);
    setShowPlayerModal(false);
  };



  // 💾 ENHANCED SAVE FUNCTION: Save to the open gameweek (isOpen == true)
  const handleSaveTeam = async () => {
    if (!user || saving) return

    // Check if user is authenticated
    if (!user.uid) {
      alert(language === 'ar' ? 
        'يرجى تسجيل الدخول أولاً' : 
        'Please log in first');
      return;
    }

    try {
      setSaving(true)

      // First, check which gameweek is currently open
      console.log('🔍 Checking for open gameweek...');
      const openGameweek = await GameweekDeadlineService.getCurrentGameweek();

      if (!openGameweek || !openGameweek.isOpen) {
        alert(language === 'ar' ?
          'لا توجد جولة مفتوحة حالياً للحفظ' :
          'No gameweek is currently open for saving'
        );
        return;
      }

      const targetGameweek = openGameweek.gw;
      console.log(`🎯 Saving to open gameweek: GW${targetGameweek}`);

      // Check if user can make changes to this gameweek
      const canMakeChanges = await GameweekDeadlineService.canMakeChanges(targetGameweek);
      if (!canMakeChanges.allowed) {
        alert(language === 'ar' ?
          `لا يمكن حفظ التغييرات: ${canMakeChanges.reason}` :
          `Cannot save changes: ${canMakeChanges.reason}`
        );
        return;
      }

      const selectedPlayers = players.filter(p => p.selected)

      // Debug: Check player data
      console.log('Selected players for save:', selectedPlayers.map(p => ({
        id: p.id,
        name: p.name,
        club: p.club,
        position: p.position
      })))

      // Validate team
      if (selectedPlayers.length !== 15) {
        alert(language === 'ar' ? 'يجب اختيار 15 لاعباً' : 'Must select 15 players')
        return
      }

      if (!captain) {
        alert(language === 'ar' ? 'يجب اختيار قائد' : 'Must select captain')
        return
      }

      // Convert players for validation - map club to team for fantasyLogic compatibility
      const playersForValidation = selectedPlayers.map(p => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr || p.name, // Ensure nameAr is not undefined
        team: p.club, // Map club to team for fantasyLogic.ts compatibility
        teamAr: p.club, // Add teamAr as well
        price: p.price,
        position: p.position,
        points: p.totalPoints,
        available: true, // Assume all selected players are available
        projectedPoints: p.totalPoints,
        selected: p.selected,
        captain: p.captain,
        jerseyColor: undefined,
        teamLogo: undefined
      }))

      if (!validateBudget(playersForValidation, budget)) {
        alert(language === 'ar' ? 'تجاوز الميزانية المحددة' : 'Exceeds budget limit')
        return
      }

      // Get the properly arranged players with substitutions applied
      const arrangedPlayers = getArrangedPlayers()

      console.log('💾 Saving arranged players:', {
        startingCount: arrangedPlayers.starting.length,
        benchCount: arrangedPlayers.bench.length,
        totalPlayers: arrangedPlayers.starting.length + arrangedPlayers.bench.length,
        startingPlayers: arrangedPlayers.starting.map(p => ({ id: p.id, name: p.nameAr || p.name, position: p.position })),
        benchPlayers: arrangedPlayers.bench.map(p => ({ id: p.id, name: p.nameAr || p.name, position: p.position }))
      })

      // Create squad object with properly arranged players
      const squad: Squad = {
        starting: arrangedPlayers.starting.map(p => ({
          id: p.id,
          name: p.nameAr || p.name,
          nameAr: p.nameAr || p.name,
          team: p.club,
          teamAr: p.club,
          price: p.price,
          position: p.position,
          points: p.totalPoints,
          available: true,
          projectedPoints: p.totalPoints,
          selected: p.selected,
          captain: p.captain,
          jerseyColor: undefined,
          teamLogo: undefined
        })),
        bench: arrangedPlayers.bench.map(p => ({
          id: p.id,
          name: p.nameAr || p.name,
          nameAr: p.nameAr || p.name,
          team: p.club,
          teamAr: p.club,
          price: p.price,
          position: p.position,
          points: p.totalPoints,
          available: true,
          projectedPoints: p.totalPoints,
          selected: p.selected,
          captain: p.captain,
          jerseyColor: undefined,
          teamLogo: undefined
        })),
        captain,
        formation: selectedFormation
      }

      // Save team with comprehensive data (existing system)
      // Note: substitutions array is empty since current substitutions format doesn't match expected Substitution interface
      await saveUserTeam(
        user.uid,
        squad,
        selectedFormation,
        chipsUsed,
        targetGameweek,
        transferState,
        [], // Empty substitutions array - current format doesn't match expected interface
        // transferCost removed - now stored only in transferState.pointsDeductedThisWeek
        `GW${targetGameweek} deadline`
      )

      // Also save to new UserSquad collection with properly arranged players
      const allArrangedPlayers = [...arrangedPlayers.starting, ...arrangedPlayers.bench]

      console.log('📊 All arranged players for Firebase save:', {
        totalCount: allArrangedPlayers.length,
        startingCount: arrangedPlayers.starting.length,
        benchCount: arrangedPlayers.bench.length,
        allPlayerIds: allArrangedPlayers.map(p => ({
          id: p.id,
          name: p.name,
          nameAr: p.nameAr || p.name,
          position: p.position
        }))
      });

      const userSquadData = {
        userId: user.uid,
        gameweekId: targetGameweek,
        players: allArrangedPlayers.map(p => ({
          playerId: p.id,
          name: p.name, // English name
          nameAr: p.nameAr || p.name, // Arabic name (fallback to English)
          position: p.position,
          club: p.club,
          price: p.price,
          isCaptain: p.id === captain,
          isStarting: arrangedPlayers.starting.some(sp => sp.id === p.id),
          benchPosition: arrangedPlayers.bench.findIndex(bp => bp.id === p.id) + 1 || null,
          points: p.totalPoints
        })),
        formation: selectedFormation,
        captainId: captain,

        totalValue,
        transferCost: transferCost || 0, // Ensure transferCost is never undefined
        chipsUsed: {
          wildcard1: {
            used: chipsUsed.wildcard1.used,
            gameweek: chipsUsed.wildcard1.gameweek,
            isActive: chipsUsed.wildcard1.isActive || false
          },
          wildcard2: {
            used: chipsUsed.wildcard2.used,
            gameweek: chipsUsed.wildcard2.gameweek,
            isActive: chipsUsed.wildcard2.isActive || false
          },
          benchBoost: {
            used: chipsUsed.benchBoost.used,
            gameweek: chipsUsed.benchBoost.gameweek,
            isActive: chipsUsed.benchBoost.isActive || false
          },
          tripleCaptain: {
            used: chipsUsed.tripleCaptain.used,
            gameweek: chipsUsed.tripleCaptain.gameweek,
            isActive: chipsUsed.tripleCaptain.isActive || false
          },
          freeHit: {
            used: chipsUsed.freeHit?.used || false,
            gameweek: chipsUsed.freeHit?.gameweek || null,
            isActive: chipsUsed.freeHit?.isActive || false
          }
        },
        transferState: {
          transfersMade: transferState.transfersMadeThisWeek,
          freeTransfers: transferState.savedFreeTransfers,
          transferCost: transferState.pointsDeductedThisWeek,
          pendingTransfers: []
        },
        isValid: true,
        validationErrors: [],
        deadline: `GW${targetGameweek} deadline`,
        isSubmitted: false
      }

      // Save to Firebase subcollection using the new service
      console.log(`💾 Saving to Firebase subcollection for GW${targetGameweek}...`)
      const firebaseResult = await saveUserSquadToSubcollection(user.uid, targetGameweek, userSquadData)

      if (!firebaseResult.success) {
        throw new Error('Failed to save squad to Firebase')
      }

      console.log('✅ Squad saved to Firebase subcollection:', firebaseResult)

      // Mark user as having saved their first squad (for transfer system)
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          hasEverSavedSquad: true,
          lastSquadSaveDate: new Date()
        })
        console.log('✅ Marked user as having saved first squad')
        console.log('🔄 User will transition to normal transfer rules in next gameweek')
        
      } catch (error) {
        console.warn('⚠️ Failed to update user first squad flag (non-critical):', error)
      }

      // Calculate and save points for this gameweek
      try {
        console.log(`🎯 Calculating points for user ${user.uid}, GW${targetGameweek}...`)
        const pointsResult = await calculateAndSaveSquadPoints(user.uid, targetGameweek) as any

        if (pointsResult.success) {
          console.log(`✅ Points calculated and saved: ${pointsResult.points} points!`)
        } else {
          console.warn('⚠️ Error calculating points:', pointsResult.message)
        }
      } catch (pointsError) {
        console.warn('⚠️ Error calculating points (non-critical):', pointsError)
        // Don't fail the save if points calculation fails
      }

      alert(language === 'ar' ? 'تم حفظ الفريق بنجاح!' : 'Team saved successfully!')

    } catch (error) {
      console.error('Save team error:', error)

      // Show more specific error messages
      let errorMessage = ''
      if (error instanceof Error) {
        // Firebase specific errors
        if (error.message.includes('permission-denied')) {
          errorMessage = language === 'ar' ? 
            'ليس لديك صلاحية لحفظ البيانات. تأكد من تسجيل الدخول.' : 
            'Permission denied. Please make sure you are logged in.';
        } else if (error.message.includes('network-request-failed')) {
          errorMessage = language === 'ar' ? 
            'فشل في الاتصال بالإنترنت. تحقق من الاتصال.' : 
            'Network error. Please check your internet connection.';
        } else if (error.message.includes('تشكيلة غير صحيحة')) {
          errorMessage = error.message // Show the specific validation error
        } else {
          errorMessage = language === 'ar' ? 
            `خطأ في الحفظ: ${error.message}` : 
            `Save error: ${error.message}`;
        }
      } else {
        errorMessage = language === 'ar' ? 'فشل في حفظ الفريق' : 'Failed to save team'
      }

      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // Get formation configuration
  const getFormationConfig = (formation: string) => {
    const configs = {
      '4-4-2': { def: 4, mid: 4, fwd: 2 },
      '4-3-3': { def: 4, mid: 3, fwd: 3 },
      '3-4-3': { def: 3, mid: 4, fwd: 3 },
      '3-5-2': { def: 3, mid: 5, fwd: 2 },
      '5-3-2': { def: 5, mid: 3, fwd: 2 },
      '5-4-1': { def: 5, mid: 4, fwd: 1 },
      '4-5-1': { def: 4, mid: 5, fwd: 1 }
    }
    return configs[formation as keyof typeof configs] || { def: 4, mid: 4, fwd: 2 }
  }
  
  const formationConfig = getFormationConfig(selectedFormation)

  // Get players arranged by actual positions in starting 11
  const getFormationPlayers = () => {
    const startingPlayers = arrangedPlayers.starting
    
    // SAFETY CHECK: Ensure we never show more than 11 players on pitch
    if (startingPlayers.length > 11) {
      console.error(`🚨 CRITICAL: ${startingPlayers.length} players in starting XI! Should be 11 max.`)
      // Emergency fix: take only first 11 players
      const safeStarting = startingPlayers.slice(0, 11)
      return {
        gkp: safeStarting.filter(p => p.position === 'GKP'),
        def: safeStarting.filter(p => p.position === 'DEF'),
        mid: safeStarting.filter(p => p.position === 'MID'),
        fwd: safeStarting.filter(p => p.position === 'FWD')
      }
    }
    
    return {
      gkp: startingPlayers.filter(p => p.position === 'GKP'),
      def: startingPlayers.filter(p => p.position === 'DEF'),
      mid: startingPlayers.filter(p => p.position === 'MID'),
      fwd: startingPlayers.filter(p => p.position === 'FWD')
    }
  }
  
  const formationPlayers = getFormationPlayers()

  // Handle transfer out (remove player from squad)
  const handleTransferOut = (playerId: string) => {
    if (!transferMode) return;
    
    setPlayerToTransferOut(playerId);
    setShowPlayerModal(false);
    
    // Show message to select replacement
    alert('Now select a replacement player from the list');
  };

  // Handle transfer in (add new player)
  const handleTransferIn = (newPlayerId: string) => {
    if (!playerToTransferOut) return;
    
    const playerOut = players.find(p => p.id === playerToTransferOut);
    const playerIn = players.find(p => p.id === newPlayerId);
    
    if (!playerOut || !playerIn) return;
    
    // Validate transfer
    if (playerOut.position !== playerIn.position) {
      alert('Must replace player with same position');
      return;
    }
    
    // Check budget
    const newCost = totalCost - playerOut.price + playerIn.price;
    if (newCost > budget) {
      alert(`Transfer exceeds budget by £${(newCost - budget).toFixed(1)}m`);
      return;
    }
    
    // Add to pending transfers
    setPendingTransfers(prev => [...prev, { out: playerToTransferOut, in: newPlayerId }]);
    
    // Update squad temporarily
    setPlayers(prev => prev.map(p => {
      if (p.id === playerToTransferOut) return { ...p, selected: false };
      if (p.id === newPlayerId) return { ...p, selected: true };
      return p;
    }));
    
    // Clear transfer out selection
    setPlayerToTransferOut('');
    setShowPlayerModal(false);
  };

  // Confirm all transfers
  const confirmTransfers = async () => {
    if (pendingTransfers.length === 0) return;
    
    try {
      console.log('🔄 Confirming transfers:', {
        pendingTransfersCount: pendingTransfers.length,
        currentTransferState: transferState,
        wildcardActive: transferState.wildcardActive,
        savedFreeTransfers: transferState.savedFreeTransfers,
        pointsDeductedBefore: transferState.pointsDeductedThisWeek
      });
      
      // Apply each transfer using the new transfer system
      let updatedTransferState = { ...transferState };
      
      for (let i = 0; i < pendingTransfers.length; i++) {
        console.log(`📦 Processing transfer ${i + 1}/${pendingTransfers.length}:`, {
          beforeState: updatedTransferState,
          wildcardActive: updatedTransferState.wildcardActive
        });
        
        const { newState, summary } = applyTransfer(updatedTransferState, currentGameweek?.id || 1);
        
        console.log(`✅ Transfer ${i + 1} processed:`, {
          summary,
          newState,
          pointsDeducted: summary.pointsDeducted,
          wildcardUsed: summary.wildcardUsed
        });
        
        updatedTransferState = newState;
      }
      
      console.log('🎯 Final transfer state after all transfers:', updatedTransferState);
      
      // Update the transfer state locally
      setTransferState(updatedTransferState);
      
      // 🔥 CRITICAL FIX: Save the updated squad with new transfer state immediately
      if (user && openGameweek?.isOpen) {
        console.log('💾 Saving updated squad with new transfer state...');
        
        const allArrangedPlayers = [...arrangedPlayers.starting, ...arrangedPlayers.bench];
        
        const userSquadData = {
          userId: user.uid,
          gameweekId: openGameweek.gw,
          players: allArrangedPlayers.map(p => ({
            playerId: p.id,
            name: p.name,
            nameAr: p.nameAr || p.name,
            position: p.position,
            club: p.club,
            price: p.price,
            isCaptain: p.id === captain,
            isStarting: arrangedPlayers.starting.some(sp => sp.id === p.id),
            benchPosition: arrangedPlayers.bench.findIndex(bp => bp.id === p.id) + 1 || null,
            points: p.totalPoints
          })),
          formation: selectedFormation,
          captainId: captain,
          totalValue,
          transferCost: updatedTransferState.pointsDeductedThisWeek, // Use updated transfer cost
          chipsUsed: {
            wildcard1: {
              used: chipsUsed.wildcard1.used,
              gameweek: chipsUsed.wildcard1.gameweek,
              isActive: chipsUsed.wildcard1.isActive || false
            },
            wildcard2: {
              used: chipsUsed.wildcard2.used,
              gameweek: chipsUsed.wildcard2.gameweek,
              isActive: chipsUsed.wildcard2.isActive || false
            },
            benchBoost: {
              used: chipsUsed.benchBoost.used,
              gameweek: chipsUsed.benchBoost.gameweek,
              isActive: chipsUsed.benchBoost.isActive || false
            },
            tripleCaptain: {
              used: chipsUsed.tripleCaptain.used,
              gameweek: chipsUsed.tripleCaptain.gameweek,
              isActive: chipsUsed.tripleCaptain.isActive || false
            },
            freeHit: {
              used: chipsUsed.freeHit?.used || false,
              gameweek: chipsUsed.freeHit?.gameweek || null,
              isActive: chipsUsed.freeHit?.isActive || false
            }
          },
          transferState: {
            transfersMade: updatedTransferState.transfersMadeThisWeek,
            freeTransfers: updatedTransferState.savedFreeTransfers,
            transferCost: updatedTransferState.pointsDeductedThisWeek,
            pendingTransfers: []
          },
          isValid: true,
          validationErrors: [],
          deadline: `GW${openGameweek.gw} deadline`,
          isSubmitted: false
        };

        // Save to Firebase immediately to persist the transfer changes
        const firebaseResult = await saveUserSquadToSubcollection(user.uid, openGameweek.gw, userSquadData);
        
        if (firebaseResult.success) {
          console.log('✅ Squad with updated transfer state saved successfully!');
        } else {
          console.error('❌ Failed to save squad with updated transfer state');
        }
      }
      
      // Clear pending transfers
      setPendingTransfers([]);
      setTransferMode(false);
      
      const finalCost = updatedTransferState.pointsDeductedThisWeek;
      alert(`${pendingTransfers.length} transfer(s) confirmed! Cost: ${finalCost} points`);
    } catch (error) {
      console.error('Failed to confirm transfers:', error);
      alert('Failed to confirm transfers');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DeadlineBanner />

        {/* Loading Squad Overlay */}
        {loadingSquad && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
                <span className="text-lg font-medium">
                  {language === 'ar' ? 'جارٍ تحميل فريقك المحفوظ...' : 'Loading your saved squad...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          {/* Active Gameweek Display */}
          <div className="mb-6 flex items-center justify-center">
            <div className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg rounded-lg shadow-lg">
              GAMEWEEK {openGameweek?.isOpen ? openGameweek.gw : currentGW}
              {openGameweek?.isOpen && (
                <span className="ml-2 text-xs bg-green-400 text-green-900 px-2 py-1 rounded-full">
                  OPEN
                </span>
              )}
              {(!openGameweek?.isOpen) && (
                <span className="ml-2 text-xs bg-red-400 text-red-900 px-2 py-1 rounded-full">
                  CLOSED
                </span>
              )}
            </div>
          </div>

          {/* Deadline Display - Only show if gameweek is open */}
          <ConditionalDeadlineDisplay language={language} />
          {/* Home Button */}
          <div className="mb-6">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="flex items-center gap-2 hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {language === 'ar' ? 'الصفحة الرئيسية' : 'Home'}
            </Button>
          </div>








          {/* Transfer Information */}
          <TransferInfo
            transferState={transferState}
            gameweekId={openGameweek?.isOpen ? openGameweek.gw : (currentGameweek?.id || 1)}
            chipsUsed={chipsUsed}
          />

          {/* Pending Transfers Confirmation */}
          {pendingTransfers.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    {language === 'ar' ? 'انتباه: لديك تحويلات معلقة' : 'Attention: You have pending transfers'}
                  </h3>
                  <p className="text-yellow-700 text-sm">
                    {language === 'ar' 
                      ? `${pendingTransfers.length} تحويل(ات) في انتظار التأكيد. يجب تأكيدها لحفظها.`
                      : `${pendingTransfers.length} transfer(s) pending confirmation. They must be confirmed to be saved.`
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setPendingTransfers([]);
                      setTransferMode(false);
                      // Reload the page to reset to saved squad
                      window.location.reload();
                    }}
                    variant="outline"
                    className="bg-white hover:bg-gray-50"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={confirmTransfers}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {language === 'ar' ? 'تأكيد التحويلات' : 'Confirm Transfers'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-600">Bank</div>
              <div className="font-bold text-green-600">{remainingBudget.toFixed(1)}M</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Starting XI Pts</div>
              <div className={`font-bold ${arrangedPlayers.starting.length !== 11 ? 'text-red-600' : ''}`}>
                {arrangedPlayers.starting.reduce((sum, player) => {
                  const basePoints = getCurrentGameweekPoints(player);
                  const isCaptain = captain === player.id;
                  const isTriple = chipsUsed.tripleCaptain.isActive;
                  const finalPoints = isCaptain ? basePoints * (isTriple ? 3 : 2) : basePoints;
                  return sum + finalPoints;
                }, 0) - transferCost}
                <span className={`text-xs ml-1 ${arrangedPlayers.starting.length !== 11 ? 'text-red-500' : 'text-gray-500'}`}>
                  ({arrangedPlayers.starting.length}/11)
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Bench Pts</div>
              <div className={`font-bold ${chipsUsed.benchBoost.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                {(() => {
                  const benchPlayers = arrangedPlayers.bench;
                  const benchPoints = benchPlayers.reduce((sum, player) => {
                    const basePoints = getCurrentGameweekPoints(player);
                    return sum + basePoints;
                  }, 0);
                  return benchPoints;
                })()}
                {chipsUsed.benchBoost.isActive && <span className="text-xs ml-1">✓</span>}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Pts</div>
              <div className="font-bold">
                {(() => {
                  // Starting XI points (FIXED: use arrangedPlayers.starting instead of selectedPlayers)
                  const startingPoints = arrangedPlayers.starting.reduce((sum, player) => {
                    const basePoints = getCurrentGameweekPoints(player);
                    const isCaptain = captain === player.id;
                    const isTriple = chipsUsed.tripleCaptain.isActive;
                    const finalPoints = isCaptain ? basePoints * (isTriple ? 3 : 2) : basePoints;
                    return sum + finalPoints;
                  }, 0);

                  // Bench points (only count if Bench Boost is active)
                  const benchPoints = chipsUsed.benchBoost.isActive
                    ? arrangedPlayers.bench.reduce((sum, player) => {
                        const basePoints = getCurrentGameweekPoints(player);
                        return sum + basePoints;
                      }, 0)
                    : 0;

                  return startingPoints + benchPoints - transferCost;
                })()}
              </div>
            </div>
          </div>

          {/* Warning for incorrect number of starting players */}
          {arrangedPlayers.starting.length !== 11 && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-600 font-bold mr-2">⚠️</span>
                <div>
                  <p className="text-red-800 font-medium">
                    {language === 'ar' 
                      ? `خطأ: لديك ${arrangedPlayers.starting.length} لاعبين في التشكيلة الأساسية (يجب أن يكون 11)`
                      : `Error: You have ${arrangedPlayers.starting.length} players in starting XI (should be 11)`
                    }
                  </p>
                  <p className="text-red-600 text-sm mt-1">
                    {language === 'ar'
                      ? 'يرجى تعديل التشكيلة لتحتوي على 11 لاعب فقط'
                      : 'Please adjust your formation to have exactly 11 players'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}




          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Side - Chips Panel and Deadline */}
            <div className="lg:col-span-1 space-y-4">


              {/* Chips Panel */}
              <ChipsPanel
                chipsUsed={chipsUsed}
                transferState={transferState}
                onChipActivate={handleChipActivate}
                disabled={saving || isDeadlinePassedState}
              />
            </div>

            {/* Formation Field - Center */}
            <div className="lg:col-span-2">
              {/* Substitution Controls */}
              <div className="mb-6 text-center">
                <Button
                  onClick={() => {
                    setSubstitutionMode(!substitutionMode)
                    setSelectedForSub(null)
                  }}
                  className={`mr-4 ${substitutionMode ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {language === 'ar'
                    ? (substitutionMode ? 'إلغاء التبديل' : 'إجراء تبديل')
                    : (substitutionMode ? 'Cancel Substitution' : 'Make Substitution')}
                </Button>
                
                {substitutionMode && (
                  <div className="mt-4 p-4 bg-yellow-500/20 rounded-lg">
                    <p className="text-gray-800 text-sm">
                      {!selectedForSub 
                        ? 'Click a player to start substitution' 
                        : selectedForSub.isStarting
                        ? 'Now click a substitute to bring on'
                        : 'Now click a starting player to substitute out'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Football Pitch */}
              <div className="relative bg-gradient-to-b from-green-400 to-green-500 rounded-lg p-8 mb-6 min-h-[600px]">
                {/* Pitch markings */}
                <div className="absolute inset-4 border-2 border-white rounded-lg">
                  {/* Center circle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                  
                  {/* Goal areas */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-8 border-2 border-white border-t-0"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-8 border-2 border-white border-b-0"></div>
                  
                  {/* Penalty areas */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-16 border-2 border-white border-t-0"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-16 border-2 border-white border-b-0"></div>
                </div>

                {/* Players Formation - 4-4-2 */}
                <div className="relative h-full flex flex-col justify-between py-16">
                 {/* Forwards - Grid positioned like Premier League Fantasy */}
<div className="grid grid-cols-5 gap-4 mb-16 max-w-md mx-auto">
  {formationPlayers.fwd.map((player, i) => {
    // Position forwards based on formation
    let colStart = 'col-start-3'; // Default center
    if (formationPlayers.fwd.length === 2) {
      colStart = i === 0 ? 'col-start-2' : 'col-start-4';
    } else if (formationPlayers.fwd.length === 3) {
      colStart = i === 0 ? 'col-start-1' : i === 1 ? 'col-start-3' : 'col-start-5';
    }

    return (
      <div
        key={`fwd-${i}`}
        className={`text-center relative cursor-pointer hover:scale-105 transition-transform ${colStart} ${
          substitutionMode && player && isSelectedForSub(player.id, true) ? 'ring-4 ring-yellow-400' : ''
        }`}
        onClick={() => {
          if (substitutionMode) {
            handleSubstitution(player.id, true)
          } else {
            handlePlayerSelect(player.id)
          }
        }}
      >
        {captain === player.id && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center z-10">
            <span className="text-xs font-bold text-black">C</span>
          </div>
        )}

        <div className="relative w-20 h-28 mx-auto mb-2">
          <PlayerKit
            club={player.club}
            position={player.position}
            size="large"
            className="w-full h-full"
          />
        </div>

        <div className="bg-white rounded px-2 py-1 text-xs font-medium shadow">
          <div className="font-bold">{(player.nameAr || player.name).split(' ')[0]}</div>
          <div className="text-gray-600">
            {(() => {
              const basePoints = getCurrentGameweekPoints(player);
              const isCaptain = captain === player.id;
              const isTriple = chipsUsed.tripleCaptain.isActive;
              const finalPoints = isCaptain ? basePoints * (isTriple ? 3 : 2) : basePoints;
              return finalPoints;
            })()}pts
          </div>
        </div>
      </div>
    );
  })}
</div>

                  {/* Midfielders - Grid positioned like Premier League Fantasy */}
                  <div className="grid grid-cols-5 gap-4 mb-16 max-w-md mx-auto">
                    {formationPlayers.mid.map((player, i) => {
                      // Position midfielders based on formation
                      let colStart = 'col-start-3'; // Default center
                      if (formationPlayers.mid.length === 3) {
                        colStart = i === 0 ? 'col-start-2' : i === 1 ? 'col-start-3' : 'col-start-4';
                      } else if (formationPlayers.mid.length === 4) {
                        colStart = i === 0 ? 'col-start-1' : i === 1 ? 'col-start-2' : i === 2 ? 'col-start-4' : 'col-start-5';
                      } else if (formationPlayers.mid.length === 5) {
                        colStart = i === 0 ? 'col-start-1' : i === 1 ? 'col-start-2' : i === 2 ? 'col-start-3' : i === 3 ? 'col-start-4' : 'col-start-5';
                      }

                      return (
                        <div
                          key={`mid-${i}`}
                          className={`text-center relative cursor-pointer hover:scale-105 transition-transform ${colStart} ${
                            substitutionMode && player && isSelectedForSub(player.id, true) ? 'ring-4 ring-yellow-400' : ''
                          }`}
                          onClick={() => {
                            if (substitutionMode) {
                              handleSubstitution(player.id, true)
                            } else {
                              handlePlayerSelect(player.id)
                            }
                          }}
                        >
                          {captain === player.id && (
                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center z-10">
                              <span className="text-xs font-bold text-black">C</span>
                            </div>
                          )}

                          <div className="relative w-20 h-28 mx-auto mb-2">
                            <PlayerKit
                              club={player.club}
                              position={player.position}
                              size="large"
                              className="w-full h-full"
                            />
                           
                          </div>

                          <div className="bg-white rounded px-2 py-1 text-xs font-medium shadow">
                            <div className="font-bold">{(player.nameAr || player.name).split(' ')[0]}</div>
                            <div className="text-gray-600">
                              {(() => {
                                const basePoints = getCurrentGameweekPoints(player);
                                const isCaptain = captain === player.id;
                                const isTriple = chipsUsed.tripleCaptain.isActive;
                                const finalPoints = isCaptain ? basePoints * (isTriple ? 3 : 2) : basePoints;
                                return finalPoints;
                              })()}pts
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Defenders - Grid positioned like Premier League Fantasy */}
                  <div className="grid grid-cols-5 gap-4 mb-16 max-w-md mx-auto">
                    {formationPlayers.def.map((player, i) => {
                      // Position defenders based on formation
                      let colStart = 'col-start-3'; // Default center
                      if (formationPlayers.def.length === 3) {
                        colStart = i === 0 ? 'col-start-2' : i === 1 ? 'col-start-3' : 'col-start-4';
                      } else if (formationPlayers.def.length === 4) {
                        colStart = i === 0 ? 'col-start-1' : i === 1 ? 'col-start-2' : i === 2 ? 'col-start-4' : 'col-start-5';
                      } else if (formationPlayers.def.length === 5) {
                        colStart = i === 0 ? 'col-start-1' : i === 1 ? 'col-start-2' : i === 2 ? 'col-start-3' : i === 3 ? 'col-start-4' : 'col-start-5';
                      }

                      return (
                        <div
                          key={`def-${i}`}
                          className={`text-center relative cursor-pointer hover:scale-105 transition-transform ${colStart} ${
                            substitutionMode && player && isSelectedForSub(player.id, true) ? 'ring-4 ring-yellow-400' : ''
                          }`}
                          onClick={() => {
                            if (substitutionMode) {
                              handleSubstitution(player.id, true)
                            } else {
                              handlePlayerSelect(player.id)
                            }
                          }}
                        >
                          {captain === player.id && (
                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center z-10">
                              <span className="text-xs font-bold text-black">C</span>
                            </div>
                          )}

                          <div className="relative w-20 h-28 mx-auto mb-2">
                            <PlayerKit
                              club={player.club}
                              position={player.position}
                              size="large"
                              className="w-full h-full"
                            />
                          
                          </div>

                          <div className="bg-white rounded px-2 py-1 text-xs font-medium shadow">
                            <div className="font-bold">{(player.nameAr || player.name).split(' ')[0]}</div>
                            <div className="text-gray-600">
                              {(() => {
                                const basePoints = getCurrentGameweekPoints(player);
                                const isCaptain = captain === player.id;
                                const isTriple = chipsUsed.tripleCaptain.isActive;
                                const finalPoints = isCaptain ? basePoints * (isTriple ? 3 : 2) : basePoints;
                                return finalPoints;
                              })()}pts
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Goalkeeper - 1 player */}
                  <div className="flex justify-center">
                    {Array.from({ length: 1 }).map((_, i) => {
                      const player = selectedPlayers.filter(p => p.position === 'GKP')[i];
                      return (
                        <div 
                          key={`gkp-${i}`} 
                          className={`text-center relative ${player ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${
                            substitutionMode && player && isSelectedForSub(player.id, true) ? 'ring-4 ring-yellow-400' : ''
                          }`}
                          onClick={() => {
                            if (player) {
                              if (substitutionMode) {
                                handleSubstitution(player.id, true)
                              } else {
                                handlePlayerSelect(player.id)
                              }
                            }
                          }}
                        >
                          {player ? (
                            <>
                              {captain === player.id && (
                                <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center z-10">
                                  <span className="text-xs font-bold text-black text-black">C</span>
                                </div>
                              )}
                              
                              <div className="relative w-20 h-28 mx-auto mb-2">
                                <PlayerKit 
                                  club={player.club} 
                                  position={player.position}
                                  size="large"
                                  className="w-full h-full"
                                />
                               
                              </div>
                              
                              <div className="bg-white rounded px-2 py-1 text-xs font-medium shadow">
                                <div className="font-bold">{(player.nameAr || player.name).split(' ')[0]}</div>
                                <div className="text-gray-600">
                                  {(() => {
                                    const basePoints = getCurrentGameweekPoints(player);
                                    const isCaptain = captain === player.id;
                                    const isTriple = chipsUsed.tripleCaptain.isActive;
                                    const finalPoints = isCaptain ? basePoints * (isTriple ? 3 : 2) : basePoints;
                                    return finalPoints;
                                  })()}pts
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-16 h-20 bg-gray-400 rounded-lg flex items-center justify-center border-2 border-white mb-2 opacity-50">
                                <span className="text-white text-xs">GKP</span>
                              </div>
                              <div className="bg-white rounded px-2 py-1 text-xs">
                                <div className="text-gray-400">Empty</div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Substitutes */}
              <div className={`text-white p-4 rounded-lg ${chipsUsed.benchBoost.isActive ? 'bg-green-600 border-2 border-green-400' : 'bg-gray-800'}`}>
                <h3 className="text-sm font-bold mb-2 flex items-center justify-center gap-2">
                  {language === 'ar' ? 'البدلاء' : 'Substitutes'}
                  {chipsUsed.benchBoost.isActive && (
                    <span className="bg-white text-green-600 px-2 py-1 rounded text-xs font-medium">
                      {language === 'ar' ? 'نشط' : 'ACTIVE'}
                    </span>
                  )}
                </h3>
                {chipsUsed.benchBoost.isActive && (
                  <p className="text-center text-xs text-green-100 mb-3">
                    {language === 'ar'
                      ? 'البدلاء سيحصلون على نقاط!'
                      : 'Bench players will earn points!'}
                  </p>
                )}
                <div className="flex justify-center space-x-4">
                  {/* Sub GK - Dedicated spot */}
                  {(() => {
                    const subGK = arrangedPlayers.bench.find(p => p.position === 'GKP');
                    return subGK ? (
                      <div 
                        className={`cursor-pointer hover:scale-105 transition-transform flex flex-col items-center ${
                          substitutionMode && isSelectedForSub(subGK.id, false) ? 'ring-4 ring-yellow-400 rounded' : ''
                        }`}
                        onClick={() => {
                          if (substitutionMode) {
                            handleSubstitution(subGK.id, false)
                          } else {
                            handlePlayerSelect(subGK.id)
                          }
                        }}
                      >
                        <div className="relative">
                          {/* Background container */}
                          <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl shadow-lg border-2 border-white/30 transform -translate-y-1 w-16 h-20"></div>
                          
                          {/* Player kit */}
                          <div className="relative z-10 p-1">
                            <PlayerKit club={subGK.club} position={subGK.position} size="normal" />
                          </div>
                        </div>
                        
                        {/* Player info */}
                        <div className="mt-2 text-center">
                          <div className="text-white text-sm font-bold">
                            {(subGK.nameAr || subGK.name).split(' ')[0]}
                          </div>
                          <div className="text-blue-400 text-xs font-medium">
                            {getCurrentGameweekPoints(subGK)} pts
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white text-black rounded px-1 py-0.5 text-xs">
                        <div className="text-gray-400">Empty</div>
                      </div>
                    );
                  })()}

                  {/* Flexible outfield spots */}
                  {[1, 2, 3].map((spotIndex) => {
                    const outfieldBench = arrangedPlayers.bench.filter(p => p.position !== 'GKP');
                    const player = outfieldBench[spotIndex - 1];
                    
                    return (
                      <div key={`bench-${spotIndex}`}>
                        {player ? (
                          <div 
                            className={`cursor-pointer hover:scale-105 transition-transform flex flex-col items-center ${
                              substitutionMode && isSelectedForSub(player.id, false) ? 'ring-4 ring-yellow-400 rounded' : ''
                            }`}
                            onClick={() => {
                              if (substitutionMode) {
                                handleSubstitution(player.id, false)
                              } else {
                                handlePlayerSelect(player.id)
                              }
                            }}
                          >
                            <div className="relative">
                              {/* Background container */}
                              <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl shadow-lg border-2 border-white/30 transform -translate-y-1 w-16 h-20"></div>
                              
                              {/* Player kit */}
                              <div className="relative z-10 p-1">
                                <PlayerKit club={player.club} position={player.position} size="normal" />
                              </div>
                            </div>
                            
                            {/* Player info */}
                            <div className="mt-2 text-center">
                              <div className="text-white text-sm font-bold">
                                {(player.nameAr || player.name).split(' ')[0]}
                              </div>
                              <div className="text-blue-400 text-xs font-medium">
                                {getCurrentGameweekPoints(player)} pts
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white text-black rounded px-1 py-0.5 text-xs">
                            <div className="text-gray-400">Empty</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Player List - Right Side */}
            <div className="lg:col-span-1 space-y-4">
              {/* Filters */}
              <div className="bg-blue-400 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block text-white text-sm mb-1 font-medium">المركز</label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full p-2 rounded border-0 focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="all">كل المراكز</option>
                    <option value="GKP">حراس المرمى</option>
                    <option value="DEF">مدافعون</option>
                    <option value="MID">وسط</option>
                    <option value="FWD">مهاجمون</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white text-sm mb-1 font-medium">النادي</label>
                  <select
                    value={selectedClub}
                    onChange={(e) => setSelectedClub(e.target.value)}
                    className="w-full p-2 rounded border-0 focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="all">اختر النادي</option>
                    {uniqueClubs.map(club => (
                      <option key={club} value={club}>{club}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-white text-sm mb-1 font-medium">ترتيب حسب</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2 rounded border-0 focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="totalPoints">مجموع النقاط</option>
                    <option value="price">السعر</option>
                    <option value="name">الاسم</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white text-sm mb-1 font-medium">الاسم</label>
                  <input
                    type="text"
                    placeholder="ابحث بالاسم"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 rounded border-0 focus:ring-2 focus:ring-blue-300 placeholder-gray-400"
                  />
                </div>
              </div>

  {/* قائمة اللاعبين */}
<div className="bg-white rounded-lg overflow-hidden shadow-sm w-[420px] mx-auto">
  <div className="bg-gray-100 p-3 flex text-gray-700 text-sm font-semibold border-b">
    <div className="w-56">الاسم</div>
    <div className="w-36 text-center">المركز</div>
    <div className="w-24 text-center">د.أ</div>
    <div className="w-20 text-center">النقاط</div>
    <div className="w-36 text-center">النادي</div>
  </div>
  
  <div className="max-h-96 overflow-y-auto">
    {loading ? (
      <div className="p-4 text-center text-gray-500">جاري تحميل اللاعبين...</div>
    ) : filteredPlayers.length === 0 ? (
      <div className="p-4 text-center text-gray-500">لا يوجد لاعبين</div>
    ) : (
      filteredPlayers.map(player => (
        <div
          key={player.id}
          onClick={() => {
            console.log('تم اختيار اللاعب:', player.nameAr || player.name);
            handlePlayerSelect(player.id);
          }}
          className={`flex p-4 mb-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${
            player.selected ? 'bg-blue-50 border-blue-200' : ''
          }`}
        >
          <div className="w-56 flex items-center gap-4">
            <PlayerKit 
              club={player.club} 
              position={player.position}
              size="normal"
              className="shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">{player.nameAr || player.name}</div>
              <div className="text-xs text-gray-500">{player.club}</div>
            </div>
          </div>
          <div className="w-36 text-center text-gray-700 font-medium flex items-center justify-center">
            {player.position === 'GKP' ? 'حارس' : player.position === 'DEF' ? 'مدافع' : player.position === 'MID' ? 'وسط' : 'مهاجم'}
          </div>
          <div className="w-24 text-center text-gray-900 font-semibold flex items-center justify-center">
            {player.price.toFixed(1)} د.أ
          </div>
          <div className="w-20 text-center text-gray-900 font-semibold flex items-center justify-center">
            {player.totalPoints} نقطة
          </div>
          <div className="w-36 text-center text-gray-700 font-medium flex items-center justify-center">
            {player.club}
          </div>
        </div>
      ))
    )}
  </div>
</div>
              {/* Save Team Button */}
              <div className="space-y-2">
                {/* Show which gameweek will be saved to */}
                {openGameweek && openGameweek.isOpen && (
                  <div className="text-center text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-2">
                    {language === 'ar' ?
                      `سيتم حفظ التشكيلة للجولة ${openGameweek.gw}` :
                      `Squad will be saved to Gameweek ${openGameweek.gw}`
                    }
                  </div>
                )}

                {(!openGameweek || !openGameweek.isOpen) && (
                  <div className="text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                    {language === 'ar' ?
                      'لا توجد جولة مفتوحة للحفظ حالياً' :
                      'No gameweek is currently open for saving'
                    }
                  </div>
                )}

                <SaveTeamButton
                  onSave={handleSaveTeam}
                  disabled={saving || isDeadlinePassedState || !openGameweek || !openGameweek.isOpen}
                  isValid={selectedPlayers.length === 15 && !!captain && totalValue <= budget}
                  validationErrors={[
                    ...(selectedPlayers.length !== 15 ? [`Must select exactly 15 players (currently ${selectedPlayers.length})`] : []),
                    ...(!captain ? ['Must select a captain'] : []),
                    ...(totalValue > budget ? [`Budget exceeded by ${(totalValue - budget).toFixed(1)}M`] : []),
                    ...(!openGameweek || !openGameweek.isOpen ? ['No gameweek is open for saving'] : [])
                  ]}
                  playerCount={selectedPlayers.length}
                  hasCaptain={!!captain}
                  totalValue={totalValue}
                  budget={budget}
                />
              </div>


            </div>
          </div>
        </div>
      </div>

      {/* Player Modal - Better Design */}
      {showPlayerModal && selectedPlayerDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
            {/* Header with close button */}
            <div className="relative p-4 border-b">
              <button 
                onClick={() => setShowPlayerModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Player Card Content */}
            <div className="p-6 text-center">
              {/* Player Avatar */}
              <div className="mb-4 flex justify-center">
                <div className="relative">
                  <PlayerKit 
                    club={selectedPlayerDetails.club} 
                    position={selectedPlayerDetails.position}
                    size="large"
                    className="w-20 h-24 shadow-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl drop-shadow-lg">
                      {selectedPlayerDetails.name.split(' ')[0].charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>


             {/* Player Name */}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {selectedPlayerDetails.nameAr || selectedPlayerDetails.name}
              </h2>

              {/* Position Badge */}
              <div className="mb-3">
                <span className="inline-block bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  {selectedPlayerDetails.position === 'GKP' ? 'Goalkeeper' : 
                   selectedPlayerDetails.position === 'DEF' ? 'Defender' :
                   selectedPlayerDetails.position === 'MID' ? 'Midfielder' : 'Forward'}
                </span>
              </div>

              {/* Club Name */}
              <p className="text-gray-600 mb-6 font-medium">
                {selectedPlayerDetails.club}
              </p>

              {/* Stats Row */}
              <div className="flex justify-between items-center mb-6 px-4">
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-1">Points:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedPlayerDetails.totalPoints}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-1">Price:</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedPlayerDetails.price.toFixed(1)}M {language === 'ar' ? 'د.أ' : 'JOD'}
                  </p>
                </div>
              </div>




              {/* --- Player Gameweek Stats Table --- */}
              <div className="mb-6">
                <p className="text-gray-500 text-sm mb-3">
                  {language === 'ar' ? 'إحصائيات هذه الجولة ' : 'this Gameweek Stats'}
                </p>
                {(() => {
                  if (!selectedPlayerDetails) return null;

                  const gwKey = `gw${getPointsGameweek()}`;
                  console.log('DEBUG gwKey:', gwKey);
  console.log('DEBUG gameweekStats:', selectedPlayerDetails.gameweekStats);
  console.log('DEBUG rawStats:', selectedPlayerDetails.gameweekStats?.[gwKey]);
                  // Defensive: always fallback to default stats, and ensure all values are numbers
                  const rawStats = (selectedPlayerDetails.gameweekStats?.[gwKey] ?? {}) as Partial<PlayerGameweekStats>;
                  const stats: PlayerGameweekStats = {
  goals: rawStats.goals ?? 0,
  assists: rawStats.assists ?? 0,
  yellowCards: rawStats.yellowCards ?? 0,
  redCards: rawStats.redCards ?? 0,
  ownGoals: rawStats.ownGoals ?? 0,
  minutesPlayed: rawStats.minutesPlayed ?? 0,
  bonusPoints: rawStats.bonusPoints ?? 0,
  cleanSheets: rawStats.cleanSheets ?? 0,
  savePoints: rawStats.savePoints ?? 0,
  goalsConceded: rawStats.goalsConceded ?? 0,
  penaltySave: rawStats.penaltySave ?? 0,
  penaltyMiss: rawStats.penaltyMiss ?? 0
};
const statRows: { key: StatKey; label: string }[] = [
  { key: 'minutesPlayed', label: language === 'ar' ? 'دقائق اللعب' : 'Minutes Played' },
  { key: 'goals', label: language === 'ar' ? 'الأهداف' : 'Goals' },
  { key: 'assists', label: language === 'ar' ? 'صناعة الأهداف' : 'Assists' },
  { key: 'cleanSheets', label: language === 'ar' ? 'شباك نظيفة' : 'Clean Sheets' },
  { key: 'yellowCards', label: language === 'ar' ? 'بطاقات صفراء' : 'Yellow Cards' },
  { key: 'redCards', label: language === 'ar' ? 'بطاقات حمراء' : 'Red Cards' },
  { key: 'ownGoals', label: language === 'ar' ? 'أهداف عكسية' : 'Own Goals' },
  { key: 'bonusPoints', label: language === 'ar' ? 'نقاط إضافية' : 'Bonus Points' },
  { key: 'savePoints', label: language === 'ar' ? 'تصديات الحارس' : 'Saves' },
  { key: 'goalsConceded', label: language === 'ar' ? 'أهداف استقبلت' : 'Goals Conceded' },
  { key: 'penaltySave', label: language === 'ar' ? 'تصدي لركلة جزاء' : 'Penalty Save' },
  { key: 'penaltyMiss', label: language === 'ar' ? 'إضاعة ركلة جزاء' : 'Penalty Miss' }
];

return (
 <table className="w-full text-lg mb-5 border rounded-lg overflow-hidden">
  <thead>
    <tr className="bg-blue-100">
      <th className="p-3 font-semibold text-gray-700">{language === 'ar' ? 'الإحصائية' : 'Statistic'}</th>
      <th className="p-3 font-semibold text-gray-700 text-center">{language === 'ar' ? 'القيمة' : 'Value'}</th>
      <th className="p-3 font-semibold text-gray-700 text-center">{language === 'ar' ? 'النقاط' : 'Points'}</th>
    </tr>
  </thead>
  <tbody>
    {statRows
      .filter(row => stats[row.key as StatKey] !== 0)
      .map((row, idx) => (
        <tr key={row.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
          <td className="p-3">{row.label}</td>
          <td className="text-center p-3 text-lg font-bold text-gray-900">{stats[row.key as StatKey]}</td>
          <td className="text-center p-3 text-lg font-bold text-blue-600">
            {getStatPoints(row.key as StatKey, stats[row.key as StatKey], selectedPlayerDetails.position)}
          </td>
        </tr>
      ))}
    {/* Total row */}
    <tr className="bg-yellow-100">
      <td className="font-bold p-3">{language === 'ar' ? 'المجموع' : 'Total'}</td>
      <td></td>
      <td className="text-center font-bold text-1xl text-yellow-700 p-3">
        {calculateTotalGameweekPoints(stats, selectedPlayerDetails.position)}
      </td>
    </tr>
  </tbody>
</table>
  
);





                })()}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {selectedPlayerDetails.selected ? (
                  <>
                    {/* Captain Selection - Only for Starting XI */}
                    {(() => {
                      const isInStartingXI = arrangedPlayers.starting.some((p: any) => p.id === selectedPlayerDetails.id);

                      return isInStartingXI ? (
                        <div className="mb-3">
                          <button
                            onClick={() => handleCaptainSelection(selectedPlayerDetails.id)}
                            disabled={isDeadlinePassedState}
                            className={`w-full py-2 px-3 rounded text-sm font-semibold transition-colors ${
                              captain === selectedPlayerDetails.id
                                ? 'bg-yellow-400 text-black'
                                : 'bg-gray-200 hover:bg-yellow-200 text-gray-800 disabled:opacity-50'
                            }`}
                          >
                            {captain === selectedPlayerDetails.id ? '★ Captain' : 'Make Captain'}
                          </button>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <div className="w-full py-2 px-3 rounded text-sm bg-gray-100 text-gray-500 text-center">
                            {language === 'ar'
                              ? 'القائد يجب أن يكون من التشكيلة الأساسية'
                              : 'Captain must be from starting XI'
                            }
                          </div>
                        </div>
                      );
                    })()}

                    {/* Remove from Squad Button */}
                    <button
                      onClick={() => removePlayerFromSquad(selectedPlayerDetails.id)}
                      disabled={isDeadlinePassedState}
                      className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-2 px-4 rounded font-medium transition-colors"
                    >
                      {language === 'ar' ? 'إزالة من الفريق' : 'Remove from Squad'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => addPlayerToSquad(selectedPlayerDetails.id)}
                    disabled={isDeadlinePassedState || getValidationMessage(selectedPlayerDetails) !== ''}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded font-medium transition-colors"
                  >
                    {getValidationMessage(selectedPlayerDetails) || (language === 'ar' ? 'إضافة للفريق' : 'Add to Squad')}
                  </button>
                )}
              </div>

              {/* Squad Status */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Squad: {selectedPlayers.length}/15</span>
                  <span>Budget: £{remainingBudget.toFixed(1)}m left</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

// Define stat types for player gameweek stats
type StatKey =
  | 'goals'
  | 'assists'
  | 'yellowCards'
  | 'redCards'
  | 'ownGoals'
  | 'minutesPlayed'
  | 'bonusPoints'
  | 'cleanSheets'
  | 'savePoints'
  | 'goalsConceded'
  | 'penaltySave'
  | 'penaltyMiss';

type PlayerGameweekStats = {
  [K in StatKey]: number;
};




function getStatPoints(stat: StatKey, value: number, position: Player['position']): number {
  switch (stat) {
    case 'minutesPlayed':
      if (value >= 60) return 2;
      if (value > 0) return 1;
      return 0;
    case 'goals':
      if (position === 'FWD') return value * 4;
      if (position === 'MID') return value * 5;
      if (position === 'DEF' || position === 'GKP') return value * 6;
      return 0;
    case 'assists':
      return value * 3;
    case 'cleanSheets':
      if (position === 'DEF' || position === 'GKP') return value * 4;
      if (position === 'MID') return value * 1;
      return 0;
    case 'savePoints':
      return position === 'GKP' ? Math.floor(value / 3) : 0;
    case 'goalsConceded':
      return (position === 'DEF' || position === 'GKP') ? -Math.floor(value / 2) : 0;
    case 'penaltySave':
      return position === 'GKP' ? value * 5 : 0;
    case 'penaltyMiss':
      return value * -3;
    case 'redCards':
      return value * -3;
    case 'bonusPoints':
      return value; // 1 point per bonus, matches your DB
    default:
      return 0;
  }
}

function calculateTotalGameweekPoints(stats: PlayerGameweekStats, position: Player['position']): number {
  let total = 0;
  Object.keys(stats).forEach((key) => {
    const statKey = key as StatKey;
    const value = stats[statKey];
    total += getStatPoints(statKey, value, position);
  });
  return total;
}















































