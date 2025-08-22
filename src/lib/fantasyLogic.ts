// Stub for getPlayerById - replace with real database lookup as needed
export async function getPlayerById(playerId: string): Promise<Player | null> {
  // TODO: Replace with actual database lookup
  return null;
}
// Fantasy Football Game Logic for Jordan Pro League
// منطق لعبة فانتازي الدوري الأردني

import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore'
import { db } from './firebase'

export interface Player {
  id: string;
  name: string;
  nameAr: string;
  team: string;
  teamAr: string;
  price: number;
  position: 'GKP' | 'DEF' | 'MID' | 'FWD';
  points: number;
  available?: boolean;
  projectedPoints?: number;
  selected?: boolean;
  captain?: boolean;
  jerseyColor?: string;
  teamLogo?: string;
  club?: string;
  totalPoints?: number;
}

export interface ChipUsage {
  used: boolean
  gameweek: number | null
  isActive?: boolean
}

export interface ChipsUsed {
  wildcard1: ChipUsage
  wildcard2: ChipUsage
  benchBoost: ChipUsage
  tripleCaptain: ChipUsage
  freeHit: ChipUsage
}

// Legacy interface for backward compatibility
export interface LegacyChipsUsed {
  wildcard: number // 0, 1, or 2 (can use twice per season)
  benchBoost: boolean
  tripleCaptain: boolean
  freeHit: boolean
}

export interface ActiveChips {
  wildcardActive: boolean
  benchBoostActive: boolean
  tripleCaptainActive: boolean
  freeHitActive: boolean
}

export interface Squad {
  starting: Player[]
  bench: Player[]
  captain: string
  formation: string
}

// 1. حساب نقاط القائد
export function calculateCaptainPoints(
  teamPoints: Record<string, number>,
  captainId: string,
  isTripleCaptain: boolean = false
): number {
  const captainPoints = teamPoints[captainId] || 0

  if (captainPoints > 0) {
    const multiplier = isTripleCaptain ? 3 : 2
    return captainPoints * (multiplier - 1) // Additional points beyond base
  }

  return 0
}

// 2. تفعيل الواي كارد (Legacy - use new chip system instead)
export const activateWildcard = async (
  chipsUsed: ChipsUsed,
  currentGameweek: number
): Promise<{ chipsUsed: ChipsUsed; resetTransfers: boolean }> => {
  if (currentGameweek === 1) {
    throw new Error('Wildcard cannot be used in Gameweek 1');
  }

  // Determine which wildcard to use based on gameweek
  const isFirstWindow = currentGameweek >= 2 && currentGameweek <= 13;
  const isSecondWindow = currentGameweek >= 14 && currentGameweek <= 27;

  if (isFirstWindow && !chipsUsed.wildcard1.used) {
    return {
      chipsUsed: {
        ...chipsUsed,
        wildcard1: { used: true, gameweek: currentGameweek, isActive: true }
      },
      resetTransfers: true
    };
  } else if (isSecondWindow && !chipsUsed.wildcard2.used) {
    return {
      chipsUsed: {
        ...chipsUsed,
        wildcard2: { used: true, gameweek: currentGameweek, isActive: true }
      },
      resetTransfers: true
    };
  } else {
    throw new Error('No wildcard available for this gameweek');
  }
};

// 3. تفعيل تعزيز البدلاء (Legacy - use new chip system instead)
export const activateBenchBoost = async (chipsUsed: ChipsUsed): Promise<ChipsUsed> => {
  if (chipsUsed.benchBoost.used) {
    throw new Error('Bench Boost already used this season')
  }

  return {
    ...chipsUsed,
    benchBoost: { used: true, gameweek: 1, isActive: true }
  }
}

// 4. تفعيل القائد الثلاثي (Legacy - use new chip system instead)
export const activateTripleCaptain = async (chipsUsed: ChipsUsed): Promise<ChipsUsed> => {
  if (chipsUsed.tripleCaptain.used) {
    throw new Error('Triple Captain already used this season')
  }

  return {
    ...chipsUsed,
    tripleCaptain: { used: true, gameweek: 1, isActive: true }
  }
}

// 5. تفعيل الضربة الحرة (Legacy - use new chip system instead)
export const activateFreeHit = async (
  chipsUsed: ChipsUsed,
  currentGameweek: number
): Promise<ChipsUsed> => {
  if (currentGameweek === 1) {
    throw new Error('Free Hit cannot be used in Gameweek 1');
  }

  if (chipsUsed.freeHit.used) {
    throw new Error('Free Hit already used this season');
  }

  return {
    ...chipsUsed,
    freeHit: { used: true, gameweek: currentGameweek, isActive: true }
  };
};

// 6. حساب عقوبة الانتقالات
export function calculateTransferPenalty(
  transfersThisWeek: number,
  hasWildcard: boolean = false,
  hasFreeHit: boolean = false
): number {
  if (hasWildcard || hasFreeHit) return 0

  const freeTransfers = 1
  const extraTransfers = Math.max(0, transfersThisWeek - freeTransfers)

  return extraTransfers * 4
}

// 7. الاختيار التلقائي للفريق (Random Selection)
export function autoPickTeam(players: Player[], budget: number = 100): Player[] {
  const availablePlayers = players.filter(p => !p.selected && p.available !== false)

  // Group players by position and sort by value (points per price)
  const getPlayerValue = (player: Player) => {
    const points = player.totalPoints || player.points || 0
    return player.price > 0 ? points / player.price : 0
  }

  const playersByPosition = {
    GKP: availablePlayers.filter(p => p.position === 'GKP').sort((a, b) => a.price - b.price),
    DEF: availablePlayers.filter(p => p.position === 'DEF').sort((a, b) => a.price - b.price),
    MID: availablePlayers.filter(p => p.position === 'MID').sort((a, b) => a.price - b.price),
    FWD: availablePlayers.filter(p => p.position === 'FWD').sort((a, b) => a.price - b.price)
  }

  const selectedPlayers: Player[] = []
  let remainingBudget = budget
  const teamCounts: {[team: string]: number} = {}

  // Helper function to check team limit (max 3 per team)
  const canAddFromTeam = (teamName: string) => {
    return (teamCounts[teamName] || 0) < 3
  }

  // Helper function to add player
  const addPlayer = (player: Player) => {
    selectedPlayers.push(player)
    remainingBudget -= player.price
    teamCounts[player.team] = (teamCounts[player.team] || 0) + 1
  }

  // Required positions with minimum requirements
  const requirements = [
    { position: 'GKP', needed: 2, players: playersByPosition.GKP },
    { position: 'DEF', needed: 5, players: playersByPosition.DEF },
    { position: 'MID', needed: 5, players: playersByPosition.MID },
    { position: 'FWD', needed: 3, players: playersByPosition.FWD }
  ]

  // First pass: try to get cheapest players for each position
  for (const req of requirements) {
    let added = 0
    
    for (const player of req.players) {
      if (added >= req.needed) break
      
      // Check if we can afford this player
      if (player.price > remainingBudget) continue
      
      // Check team limit
      if (!canAddFromTeam(player.team || player.club || 'Unknown')) continue
      
      // Add player
      addPlayer(player)
      added++
    }
    
    // If we couldn't get enough players for this position, try with higher budget
    if (added < req.needed) {
      console.log(`Could only get ${added}/${req.needed} ${req.position} players`)
    }
  }

  // If we don't have 15 players, try to fill remaining spots with any available players
  if (selectedPlayers.length < 15) {
    const allRemaining = availablePlayers
      .filter(p => !selectedPlayers.find(sp => sp.id === p.id))
      .sort((a, b) => a.price - b.price)
    
    for (const player of allRemaining) {
      if (selectedPlayers.length >= 15) break
      
      if (player.price <= remainingBudget && 
          canAddFromTeam(player.team || player.club || 'Unknown')) {
        addPlayer(player)
      }
    }
  }

  console.log('Auto pick result:', {
    selected: selectedPlayers.length,
    budget: budget,
    spent: budget - remainingBudget,
    remaining: remainingBudget,
    positions: {
      GKP: selectedPlayers.filter(p => p.position === 'GKP').length,
      DEF: selectedPlayers.filter(p => p.position === 'DEF').length,
      MID: selectedPlayers.filter(p => p.position === 'MID').length,
      FWD: selectedPlayers.filter(p => p.position === 'FWD').length
    }
  })

  return selectedPlayers
}

// 8. التحقق من الميزانية
export function validateBudget(players: Player[], budget: number): boolean {
  const totalCost = players.reduce((sum, player) => sum + player.price, 0)
  return totalCost <= budget
}

// 9. التحقق من صحة التشكيلة
export function validateSquad(players: Player[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (players.length !== 15) {
    errors.push(`يجب اختيار 15 لاعباً بالضبط (المختار: ${players.length})`)
  }

  const positionCounts = players.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (positionCounts.GKP !== 2) errors.push('يجب اختيار حارسين بالضبط')
  if (positionCounts.DEF !== 5) errors.push('يجب اختيار 5 مدافعين بالضبط')
  if (positionCounts.MID !== 5) errors.push('يجب اختيار 5 لاعبي وسط بالضبط')
  if (positionCounts.FWD !== 3) errors.push('يجب اختيار 3 مهاجمين بالضبط')

  const teamCounts = players.reduce((acc, player) => {
    // Handle undefined team values - use team property or fallback
    const team = player.team || 'Unknown Team'
    acc[team] = (acc[team] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  Object.entries(teamCounts).forEach(([team, count]) => {
    if (count > 3) {
      errors.push(`أكثر من 3 لاعبين من ${team} (${count} لاعبين)`)
    }
  })

  // Check for players with missing team information
  const playersWithoutTeam = players.filter(p => !p.team)
  if (playersWithoutTeam.length > 0) {
    errors.push(`لاعبون بدون معلومات الفريق: ${playersWithoutTeam.map(p => p.name).join(', ')}`)
  }

  const unavailablePlayers = players.filter(p => p.available === false)
  if (unavailablePlayers.length > 0) {
    errors.push(`لاعبون غير متاحون: ${unavailablePlayers.map(p => p.name).join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Enhanced team save interface

// Define a better type for substitution if you have a model, otherwise define it here
export interface Substitution {
  outPlayerId: string
  inPlayerId: string
  order: number
}

export interface TeamSaveData {
  userId: string
  gameweekId: number
  players: {
    playerId: string
    name: string
    position: string
    club: string
    price: number
    isCaptain: boolean
    isStarting: boolean
    benchPosition: number | null
    substitutionOrder?: number
  }[]
  formation: string
  chipsUsed: ChipsUsed
  transferState: UserTransferState
  substitutions: Substitution[]
  totalValue: number
  // transferCost: number // REMOVED - now stored only in transferState.pointsDeductedThisWeek
  savedAt: string
  deadline: string
  isValid: boolean
  validationErrors: string[]
}

export async function saveUserTeam(
  userId: string,
  squad: Squad,
  formation: string,
  chipsUsed: ChipsUsed,
  gameweekId: number,
  transferState: UserTransferState = getDefaultTransferState(),   // Provide default if appropriate or require param
  substitutions: Substitution[] = [],      // Strongly typed substitutions array
  // transferCost: number = 0, // REMOVED - now stored only in transferState.pointsDeductedThisWeek
  deadline: string = new Date().toISOString()
): Promise<void> {
  const allPlayers = [...squad.starting, ...squad.bench]

  const validation = validateSquad(allPlayers)
  if (!validation.valid) {
    throw new Error(`تشكيلة غير صحيحة: ${validation.errors.join(', ')}`)
  }

  if (!squad.captain || !allPlayers.find(p => p.id === squad.captain)) {
    throw new Error('يجب اختيار قائد صحيح')
  }

  // Calculate total team value
  const totalValue = allPlayers.reduce((sum, player) => sum + player.price, 0)

  try {
    const teamData: TeamSaveData = {
      userId,
      gameweekId,
      players: allPlayers.map(p => ({
        playerId: p.id,
        name: p.name,
        position: p.position,
        club: p.team || 'Unknown',
        price: p.price,
        isCaptain: p.id === squad.captain,

        isStarting: squad.starting.some(sp => sp.id === p.id),
        benchPosition: squad.bench.findIndex(bp => bp.id === p.id) + 1 || null,
        substitutionOrder: substitutions ? substitutions.findIndex(sub => sub.inPlayerId === p.id) + 1 || undefined : undefined
      })),
      formation,
      chipsUsed,
      transferState: transferState || getDefaultTransferState(),
      substitutions: substitutions || [],
      totalValue,
      // transferCost: transferCost || 0, // REMOVED - now stored only in transferState.pointsDeductedThisWeek
      savedAt: new Date().toISOString(),
      deadline: deadline || '',
      isValid: validation.valid,
      validationErrors: validation.errors
    }

    console.log('Saving comprehensive team data:', teamData)

    const response = await fetch('/api/fantasy-teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'فشل في حفظ الفريق')
    }

    const result = await response.json()
    console.log('تم حفظ الفريق بنجاح:', result)

  } catch (error) {
    console.error('خطأ في حفظ الفريق:', error)
    throw error
  }
}

// 11. حساب النقاط الإجمالية للفريق
export function calculateTotalTeamPoints(
  squad: Squad,
  playerPoints: Record<string, number>,
  chipsUsed: ChipsUsed,
  isBenchBoostActive: boolean = false
): { totalPoints: number; startingPoints: number; benchPoints: number; captainBonus: number } {
  // Calculate starting XI points
  const startingPoints = squad.starting.reduce((sum, player) => {
    return sum + (playerPoints[player.id] || 0)
  }, 0)

  // Calculate bench points (always calculated, but only counted if Bench Boost is active)
  const benchPoints = squad.bench.reduce((sum, player) => {
    return sum + (playerPoints[player.id] || 0)
  }, 0)

  // Calculate captain bonus
  const captainBonus = calculateCaptainPoints(
    playerPoints,
    squad.captain,
    chipsUsed.tripleCaptain?.used || false
  )

  // Total points = starting + captain bonus + (bench points only if Bench Boost is active)
  const totalPoints = startingPoints + captainBonus + (isBenchBoostActive ? benchPoints : 0)

  return {
    totalPoints,
    startingPoints: startingPoints + captainBonus,
    benchPoints,
    captainBonus
  }
}

// Legacy function for backward compatibility
export function calculateTotalTeamPointsLegacy(
  squad: Squad,
  playerPoints: Record<string, number>,
  chipsUsed: ChipsUsed,
  isBenchBoostActive: boolean = false
): number {
  const result = calculateTotalTeamPoints(squad, playerPoints, chipsUsed, isBenchBoostActive)
  return result.totalPoints
}

// 12. التحقق من صلاحية استخدام الرقاقة
export const canUseChip = (
  chipKey: keyof ChipsUsed,
  chipsUsed: ChipsUsed,
  currentGameweek: number,
  activeChips?: ActiveChips
): boolean => {
  // Cannot use wildcards in GW1 (but allow Bench Boost and Triple Captain)
  if (currentGameweek === 1 && (chipKey === 'wildcard1' || chipKey === 'wildcard2')) {
    return false;
  }

  // Cannot use multiple chips in same gameweek
  if (activeChips) {
    const hasActiveChip = Object.values(activeChips).some(active => active);
    if (hasActiveChip) return false;
  }

  // Check if any chip is already active this gameweek
  const hasActiveChipThisGW = Object.values(chipsUsed).some(chip =>
    chip.isActive && chip.gameweek === currentGameweek
  );
  if (hasActiveChipThisGW) return false;

  switch (chipKey) {
    case 'wildcard1':
      return !chipsUsed.wildcard1.used && currentGameweek <= 19;
    case 'wildcard2':
      return !chipsUsed.wildcard2.used && currentGameweek > 19;
    case 'benchBoost':
      return !chipsUsed.benchBoost.used;
    case 'tripleCaptain':
      return !chipsUsed.tripleCaptain.used;
    default:
      return false;
  }
};

// Legacy function for backward compatibility
export const canUseChipLegacy = (
  chipKey: keyof LegacyChipsUsed,
  chipsUsed: LegacyChipsUsed,
  currentGameweek: number,
  activeChips?: ActiveChips
): boolean => {
  // Cannot use any chip in GW1 except Bench Boost and Triple Captain
  if (currentGameweek === 1 && (chipKey === 'wildcard' || chipKey === 'freeHit')) {
    return false;
  }

  // Cannot use multiple chips in same gameweek
  if (activeChips) {
    const hasActiveChip = Object.values(activeChips).some(active => active);
    if (hasActiveChip) return false;
  }

  switch (chipKey) {
    case 'wildcard':
      return chipsUsed.wildcard < 2;
    case 'benchBoost':
      return !chipsUsed.benchBoost;
    case 'tripleCaptain':
      return !chipsUsed.tripleCaptain;
    case 'freeHit':
      return !chipsUsed.freeHit;
    default:
      return false;
  }
};

// 13. New Chip Activation Functions
export const activateChip = async (
  chipType: keyof ChipsUsed,
  chipsUsed: ChipsUsed,
  currentGameweek: number,
  userId: string
): Promise<ChipsUsed> => {
  // Validate chip can be used
  if (!canUseChip(chipType, chipsUsed, currentGameweek)) {
    throw new Error(`Cannot use ${chipType} at this time`);
  }

  const newChipsUsed = { ...chipsUsed };

  // Deactivate any currently active chips
  Object.keys(newChipsUsed).forEach(key => {
    const chipKey = key as keyof ChipsUsed;
    if (newChipsUsed[chipKey].isActive) {
      newChipsUsed[chipKey] = { ...newChipsUsed[chipKey], isActive: false };
    }
  });

  // Activate the selected chip
  newChipsUsed[chipType] = {
    used: true,
    gameweek: currentGameweek,
    isActive: true
  };

  // Save to Firebase
  await saveChipsToFirebase(userId, newChipsUsed);

  return newChipsUsed;
};

export const deactivateChip = async (
  chipType: keyof ChipsUsed,
  chipsUsed: ChipsUsed,
  userId: string
): Promise<ChipsUsed> => {
  const newChipsUsed = { ...chipsUsed };

  if (newChipsUsed[chipType].isActive) {
    newChipsUsed[chipType] = { ...newChipsUsed[chipType], isActive: false };
    await saveChipsToFirebase(userId, newChipsUsed);
  }

  return newChipsUsed;
};

// 14. Firebase Chip Management
export const saveChipsToFirebase = async (userId: string, chipsUsed: ChipsUsed): Promise<void> => {
  try {
    const response = await fetch('/api/chips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, chipsUsed }),
    });

    if (!response.ok) {
      throw new Error('Failed to save chips to database');
    }
  } catch (error) {
    console.error('Error saving chips:', error);
    throw error;
  }
};

export const loadChipsFromFirebase = async (userId: string): Promise<ChipsUsed> => {
  try {
    const response = await fetch(`/api/chips?userId=${userId}`);

    if (!response.ok) {
      throw new Error('Failed to load chips from database');
    }

    const data = await response.json();
    return data.chipsUsed || getDefaultChipsUsed();
  } catch (error) {
    console.error('Error loading chips:', error);
    return getDefaultChipsUsed();
  }
};

export const getDefaultChipsUsed = (): ChipsUsed => ({
  wildcard1: { used: false, gameweek: null, isActive: false },
  wildcard2: { used: false, gameweek: null, isActive: false },
  benchBoost: { used: false, gameweek: null, isActive: false },
  tripleCaptain: { used: false, gameweek: null, isActive: false },
  freeHit: { used: false, gameweek: null, isActive: false }
});

// Convert legacy chips format to new format
export const convertLegacyChips = (legacyChips: LegacyChipsUsed): ChipsUsed => {
  return {
    wildcard1: {
      used: legacyChips.wildcard >= 1,
      gameweek: legacyChips.wildcard >= 1 ? 1 : null,
      isActive: false
    },
    wildcard2: {
      used: legacyChips.wildcard >= 2,
      gameweek: legacyChips.wildcard >= 2 ? 20 : null,
      isActive: false
    },
    benchBoost: {
      used: legacyChips.benchBoost,
      gameweek: legacyChips.benchBoost ? 1 : null,
      isActive: false
    },
    tripleCaptain: {
      used: legacyChips.tripleCaptain,
      gameweek: legacyChips.tripleCaptain ? 1 : null,
      isActive: false
    },
    freeHit: {
      used: legacyChips.freeHit,
      gameweek: legacyChips.freeHit ? 1 : null,
      isActive: false
    }
  };
};

// Enhanced Transfer System Logic
export interface TransferData {
  playerOut: string
  playerIn: string
  gameweekId: number
  transferCost: number
  timestamp: Date
}

export interface UserTransferState {
  savedFreeTransfers: number // Accumulated free transfers (depleted as used)
  transfersMadeThisWeek: number
  pointsDeductedThisWeek: number
  wildcardActive: boolean
  freeHitActive: boolean
  lastGameweekProcessed: number
}

export interface GameweekTransferSummary {
  transfersMade: number
  freeTransfersUsed: number
  paidTransfers: number
  pointsDeducted: number
  wildcardUsed: boolean
  freeHitUsed: boolean
}

// Initialize default transfer state for new users
export function getDefaultTransferState(currentGameweek: number = 1, isFirstTimeUser: boolean = true): UserTransferState {
  return {
    savedFreeTransfers: isFirstTimeUser ? 9999 : (currentGameweek === 1 ? 9999 : 1), // 9999 for first-time users or GW1
    transfersMadeThisWeek: 0,
    pointsDeductedThisWeek: 0,
    wildcardActive: false,
    freeHitActive: false,
    lastGameweekProcessed: currentGameweek
  }
}
async function getInitialTransferState(userId: string, hasSavedSquad: boolean, currentGameweek: number) {
  return hasSavedSquad
    ? await loadTransferStateFromFirebase(userId)
    : getDefaultTransferState(currentGameweek);
}

// Usage example inside an async function:
async function handleUserSquadCreation(userId: string, hasSavedSquad: boolean, currentGameweek: number) {
  const transferState = await getInitialTransferState(userId, hasSavedSquad, currentGameweek);
  // ...rest of your logic
}
// Check if a specific gameweek is closed (for auto-reset logic)
export async function isGameweekClosed(gameweekNumber: number): Promise<boolean> {
  try {
    const { GameweekDeadlineService } = await import('./gameweekDeadlineService');
    const gameweek = await GameweekDeadlineService.getGameweekById(gameweekNumber);
    return gameweek ? !gameweek.isOpen : true; // If not found, consider it closed
  } catch (error) {
    console.error(`❌ Error checking if GW${gameweekNumber} is closed:`, error);
    return true; // Default to closed for safety
  }
}

// Calculate free transfers based on gameweek progression
// Rule: Unused free transfers accumulate (+1 per gameweek, max 2), penalties reset each gameweek
export function calculateFreeTransfers(
  fromGameweek: number,
  toGameweek: number,
  currentFreeTransfers: number = 0
): number {
  console.log(`📊 Calculating free transfers:`, {
    fromGameweek,
    toGameweek,
    currentFreeTransfers
  });

  if (toGameweek === 1) {
    console.log(`✅ GW1: Unlimited transfers (9999)`);
    return 9999; // GW1: Unlimited transfers
  }

  if (toGameweek === 2) {
    console.log(`✅ GW2: Fresh start with 1 free transfer`);
    return 1; // GW2: Always start with 1 free transfer (reset from GW1 unlimited)
  }

  // GW3+: Add 1 free transfer to existing unused transfers, max 2
  const gameweekGap = toGameweek - fromGameweek;

  if (gameweekGap <= 1) {
    // Normal progression: add 1 free transfer, max 2
    const newTotal = Math.min(2, currentFreeTransfers + 1);
    console.log(`✅ Normal progression: ${currentFreeTransfers} + 1 = ${newTotal} (max 2)`);
    return newTotal;
  } else {
    // Gap in gameweeks: add 1 per missed gameweek, max 2
    const freeTransfersToAdd = gameweekGap;
    const newTotal = Math.min(2, currentFreeTransfers + freeTransfersToAdd);
    console.log(`✅ Gap progression: ${currentFreeTransfers} + ${freeTransfersToAdd} = ${newTotal} (max 2)`);
    return newTotal;
  }
}

// Auto-reset transfer penalties when the gameweek where transfers were made gets closed
export async function autoResetTransferPenalties(
  currentState: UserTransferState,
  currentGameweek: number
): Promise<UserTransferState> {
  // If no transfers were made or no penalties, nothing to reset
  if (currentState.transfersMadeThisWeek === 0 || currentState.pointsDeductedThisWeek === 0) {
    return currentState;
  }

  // If transfers were made in the current gameweek, don't reset yet
  if (currentState.lastGameweekProcessed === currentGameweek) {
    return currentState;
  }

  // Check if the gameweek where transfers were made is now closed
  const transfersGameweekClosed = await isGameweekClosed(currentState.lastGameweekProcessed);

  if (transfersGameweekClosed) {
    console.log(`🔄 Auto-resetting transfer penalties: GW${currentState.lastGameweekProcessed} is now closed`);

    // Calculate free transfers for the new gameweek using helper function
    const newFreeTransfers = calculateFreeTransfers(
      currentState.lastGameweekProcessed,
      currentGameweek,
      currentState.savedFreeTransfers // Use current free transfers for accumulation
    );

    console.log(`📊 Auto-reset free transfers calculation:`, {
      previousGameweek: currentState.lastGameweekProcessed,
      currentGameweek: currentGameweek,
      gameweekGap: currentGameweek - currentState.lastGameweekProcessed,
      newFreeTransfers: newFreeTransfers
    });

    return {
      ...currentState,
      transfersMadeThisWeek: 0,
      pointsDeductedThisWeek: 0, // ALWAYS reset penalties when moving to new gameweek
      lastGameweekProcessed: currentGameweek, // Update to current gameweek
      savedFreeTransfers: newFreeTransfers // Reset to proper free transfer count
    };
  }

  return currentState;
}

// New function to handle gameweek transition with penalty reset
export function transitionToNewGameweek(
  currentState: UserTransferState,
  newGameweek: number
): UserTransferState {
  console.log(`🔄 Transitioning to new gameweek: GW${currentState.lastGameweekProcessed} → GW${newGameweek}`);

  // If we're already at or past this gameweek, no need to transition
  if (currentState.lastGameweekProcessed >= newGameweek) {
    console.log(`✅ Already processed GW${newGameweek} or later`);
    return currentState;
  }

  // Calculate new free transfers based on gameweek progression
  const newFreeTransfers = calculateFreeTransfers(
    currentState.lastGameweekProcessed,
    newGameweek,
    currentState.savedFreeTransfers
  );

  const newState: UserTransferState = {
    ...currentState,
    savedFreeTransfers: newFreeTransfers,
    transfersMadeThisWeek: 0, // Reset transfers made
    pointsDeductedThisWeek: 0, // RESET penalties - this is the key fix
    wildcardActive: false, // Deactivate wildcard unless manually activated in new GW
    freeHitActive: false, // Free hit only lasts one gameweek
    lastGameweekProcessed: newGameweek
  };

  console.log(`✅ Gameweek transition complete:`, {
    oldGameweek: currentState.lastGameweekProcessed,
    newGameweek,
    oldFreeTransfers: currentState.savedFreeTransfers,
    newFreeTransfers,
    oldPenalties: currentState.pointsDeductedThisWeek,
    newPenalties: 0, // Always 0 for new gameweek
    penaltiesReset: true
  });

  return newState;
}

// Process gameweek start - add free transfer and reset weekly counters
export function processGameweekStart(
  currentState: UserTransferState,
  gameweek: number
): UserTransferState {
  // Only process if we haven't already processed this gameweek
  if (currentState.lastGameweekProcessed >= gameweek) {
    return currentState
  }

  console.log(`🔄 Processing gameweek start: GW${currentState.lastGameweekProcessed} → GW${gameweek}`);

  // Check if wildcard was active in previous gameweek - if so, deactivate it and give 1 transfer
  if (currentState.wildcardActive) {
    console.log(`🃏 Wildcard was active in previous gameweek, deactivating for GW${gameweek} and transitioning to 1 transfer`);
    return {
      ...currentState,
      wildcardActive: false,
      savedFreeTransfers: 1, // Always 1 free transfer after wildcard expires
      transfersMadeThisWeek: 0,
      pointsDeductedThisWeek: 0, // Reset penalties for new gameweek
      lastGameweekProcessed: gameweek
    };
  }

  // Special case: If user had unlimited transfers (9999+) from wildcard or first-time user
  // and is moving to a new gameweek, they should ALWAYS transition to normal transfer rules
  const hadUnlimitedTransfers = currentState.savedFreeTransfers >= 9999
  
  // Calculate free transfers for the new gameweek
  let newFreeTransfers;
  
  if (hadUnlimitedTransfers) {
    // User had unlimited transfers (from wildcard or first-time) - always give them 1 transfer for the new gameweek
    // This ensures wildcards and first-time users only get 9999 transfers for ONE gameweek
    newFreeTransfers = 1;
    console.log(`🔄 Transitioning from unlimited transfers (${currentState.savedFreeTransfers}) to normal rules: 1 free transfer`);
  } else {
    // Normal free transfer calculation for users with regular transfer counts
    newFreeTransfers = calculateFreeTransfers(
      currentState.lastGameweekProcessed,
      gameweek,
      currentState.savedFreeTransfers
    );
  }

  console.log(`📊 Regular gameweek progression free transfers:`, {
    previousGameweek: currentState.lastGameweekProcessed,
    newGameweek: gameweek,
    previousFreeTransfers: currentState.savedFreeTransfers,
    newFreeTransfers: newFreeTransfers,
    hadUnlimitedTransfers: hadUnlimitedTransfers
  });

  const newState = {
    ...currentState,
    savedFreeTransfers: newFreeTransfers,
    transfersMadeThisWeek: 0, // Reset weekly counter
    pointsDeductedThisWeek: 0, // ALWAYS reset penalties for new gameweek
    wildcardActive: false, // Reset chip states (unless manually activated)
    lastGameweekProcessed: gameweek
  };

  console.log(`✅ Transfer state reset for GW${gameweek}:`, {
    oldState: currentState,
    newState: newState,
    freeTransfers: newFreeTransfers,
    transitionedFromUnlimited: hadUnlimitedTransfers,
    penaltiesReset: true
  });

  return newState;
}

// Test function to verify free transfer logic
export function testFreeTransferLogic() {
  console.log('🧪 Testing Free Transfer Logic:');

  // Test 1: Normal weekly progression
  console.log('\n📋 Test 1: Normal Weekly Progression');
  console.log('GW2→GW3:', calculateFreeTransfers(2, 3, 1)); // Should be 2 (1+1)
  console.log('GW3→GW4:', calculateFreeTransfers(3, 4, 1)); // Should be 2 (1+1)
  console.log('GW4→GW5:', calculateFreeTransfers(4, 5, 2)); // Should be 2 (2+1, capped at 2)
  console.log('GW5→GW6:', calculateFreeTransfers(5, 6, 2)); // Should be 2 (2+1, capped at 2)

  // Test 2: Using transfers (reducing free transfers)
  console.log('\n📋 Test 2: Using Transfers');
  console.log('GW3→GW4 (used 1):', calculateFreeTransfers(3, 4, 1)); // Should be 2 (1+1)
  console.log('GW4→GW5 (used all):', calculateFreeTransfers(4, 5, 0)); // Should be 1 (0+1)

  // Test 3: Gameweek gaps
  console.log('\n📋 Test 3: Gameweek Gaps');
  console.log('GW3→GW6 (3 week gap):', calculateFreeTransfers(3, 6, 1)); // Should be 2 (1+3, capped at 2)
  console.log('GW5→GW10 (5 week gap):', calculateFreeTransfers(5, 10, 0)); // Should be 2 (0+5, capped at 2)

  // Test 4: Special gameweeks
  console.log('\n📋 Test 4: Special Gameweeks');
  console.log('GW1:', calculateFreeTransfers(0, 1, 0)); // Should be 9999
  console.log('GW2:', calculateFreeTransfers(1, 2, 9999)); // Should be 1

  // Test 5: Transfer cost calculation
  console.log('\n📋 Test 5: Transfer Cost Calculation');
  console.log('3 transfers, 2 FT:', calculateTransferCost(3, 2, 5, false, false));
  // Should be: 2 free, 1 paid (-4 points)

  console.log('5 transfers, 1 FT:', calculateTransferCost(5, 1, 5, false, false));
  // Should be: 1 free, 4 paid (-16 points)

  console.log('2 transfers, 2 FT:', calculateTransferCost(2, 2, 5, false, false));
  // Should be: 2 free, 0 paid (0 points)
}

// Calculate transfer cost and deductions
export function calculateTransferCost(
  transfersThisWeek: number,
  savedFreeTransfers: number,
  gameweek: number = 1,
  isWildcardActive: boolean = false,
  isFreeHitActive: boolean = false
): GameweekTransferSummary {
  // No cost if wildcard or free hit is active
  if (isWildcardActive || isFreeHitActive) {
    console.log('🃏 Wildcard/FreeHit active - all transfers are free:', {
      transfersThisWeek,
      savedFreeTransfers,
      gameweek,
      isWildcardActive,
      isFreeHitActive
    });
    return {
      transfersMade: transfersThisWeek,
      freeTransfersUsed: transfersThisWeek, // All transfers are considered free
      paidTransfers: 0,
      pointsDeducted: 0,
      wildcardUsed: isWildcardActive,
      freeHitUsed: isFreeHitActive
    }
  }

  // GW1 or unlimited transfers (9999+): Unlimited free transfers  
  if (gameweek === 1 || savedFreeTransfers >= 9999) {
    console.log('🆓 Unlimited transfers (GW1 or 9999+ transfers):', {
      transfersThisWeek,
      savedFreeTransfers,
      gameweek
    });
    return {
      transfersMade: transfersThisWeek,
      freeTransfersUsed: transfersThisWeek,
      paidTransfers: 0,
      pointsDeducted: 0,
      wildcardUsed: false,
      freeHitUsed: false
    }
  }

  const freeTransfersUsed = Math.min(transfersThisWeek, savedFreeTransfers)
  const paidTransfers = Math.max(0, transfersThisWeek - freeTransfersUsed)
  const pointsDeducted = paidTransfers * 4

  console.log('💰 Normal transfer cost calculation:', {
    transfersThisWeek,
    savedFreeTransfers,
    freeTransfersUsed,
    paidTransfers,
    pointsDeducted
  });

  return {
    transfersMade: transfersThisWeek,
    freeTransfersUsed,
    paidTransfers,
    pointsDeducted,
    wildcardUsed: false,
    freeHitUsed: false
  }
}

// Apply transfer and update state
export function applyTransfer(
  currentState: UserTransferState,
  gameweek: number
): { newState: UserTransferState; summary: GameweekTransferSummary } {
  console.log('🔄 Applying transfer:', {
    currentState,
    gameweek,
    wildcardActive: currentState.wildcardActive
  });

  // If wildcard is active, don't count transfers or deduct points
  if (currentState.wildcardActive) {
    console.log('🃏 Wildcard is active - no transfer counting or point deduction');
    
    const summary: GameweekTransferSummary = {
      transfersMade: 1,
      freeTransfersUsed: 0,
      paidTransfers: 0,
      pointsDeducted: 0,
      wildcardUsed: true,
      freeHitUsed: false
    }

    const newState: UserTransferState = {
      ...currentState,
      transfersMadeThisWeek: currentState.transfersMadeThisWeek + 1, // Count transfers during wildcard
      pointsDeductedThisWeek: 0, // Always 0 when wildcard active
      savedFreeTransfers: currentState.savedFreeTransfers // Don't change free transfers
    }

    console.log('✅ Transfer applied with wildcard active:', { newState, summary });
    return { newState, summary }
  }

  // Normal transfer logic when wildcard is not active
  console.log('📊 Normal transfer logic - wildcard not active');
  const newTransfersThisWeek = currentState.transfersMadeThisWeek + 1

  // SIMPLE LOGIC: Check if user has free transfers available
  const hasFreeTransfers = currentState.savedFreeTransfers > 0;
  const isGW1OrUnlimited = gameweek === 1 || currentState.savedFreeTransfers >= 9999;
  
  let newSavedFreeTransfers = currentState.savedFreeTransfers;
  let pointsDeducted = 0;
  
  if (isGW1OrUnlimited) {
    // GW1 or unlimited transfers - no cost, don't reduce free transfers
    pointsDeducted = 0;
    newSavedFreeTransfers = currentState.savedFreeTransfers;
  } else if (hasFreeTransfers) {
    // User has free transfers - use one, no points deducted
    pointsDeducted = 0;
    newSavedFreeTransfers = currentState.savedFreeTransfers - 1;
  } else {
    // No free transfers - charge 4 points
    pointsDeducted = 4;
    newSavedFreeTransfers = 0; // Stay at 0
  }

  console.log('📊 Simple transfer calculation:', {
    currentFreeTransfers: currentState.savedFreeTransfers,
    hasFreeTransfers,
    isGW1OrUnlimited,
    pointsDeducted,
    newSavedFreeTransfers,
    transferNumber: newTransfersThisWeek
  });

  const newState: UserTransferState = {
    ...currentState,
    transfersMadeThisWeek: newTransfersThisWeek,
    pointsDeductedThisWeek: currentState.pointsDeductedThisWeek + pointsDeducted,
    savedFreeTransfers: newSavedFreeTransfers
  }

  const summary: GameweekTransferSummary = {
    transfersMade: 1,
    freeTransfersUsed: hasFreeTransfers && !isGW1OrUnlimited ? 1 : 0,
    paidTransfers: hasFreeTransfers || isGW1OrUnlimited ? 0 : 1,
    pointsDeducted: currentState.pointsDeductedThisWeek + pointsDeducted,
    wildcardUsed: false,
    freeHitUsed: false
  }

  console.log('✅ Transfer applied normally:', { newState, summary });
  return { newState, summary }
}

// Activate wildcard - give exactly 9999 transfers for the specific gameweek where wildcard is active
export function activateWildcardTransfer(
  currentState: UserTransferState,
  chipType: 'wildcard1' | 'wildcard2'
): UserTransferState {
  return {
    ...currentState,
    wildcardActive: true,
    savedFreeTransfers: 9999, // Set exactly 9999 transfers like new users for the open gameweek
    transfersMadeThisWeek: 0, // Reset transfer count
    pointsDeductedThisWeek: 0 // No deductions with wildcard
  }
}

// Deactivate wildcard for next gameweek - give only 1 free transfer
export function deactivateWildcardTransfer(
  currentState: UserTransferState,
  newGameweek: number
): UserTransferState {
  return {
    ...currentState,
    wildcardActive: false,
    savedFreeTransfers: 1, // Always 1 free transfer for next gameweek after wildcard
    transfersMadeThisWeek: 0, // Reset for new gameweek
    pointsDeductedThisWeek: 0, // Reset for new gameweek
    lastGameweekProcessed: newGameweek
  }
}

// Activate free hit
export function activateFreeHitTransfer(
  currentState: UserTransferState
): UserTransferState {
  return {
    ...currentState,
    freeHitActive: true,
    transfersMadeThisWeek: 0, // Reset transfer count
    pointsDeductedThisWeek: 0 // No deductions with free hit
  }
}

// Check if chip can be used based on gameweek and transfer state
export function canUseChipWithTransfers(
  chipType: keyof ChipsUsed,
  chipsUsed: ChipsUsed,
  currentGameweek: number,
  transferState: UserTransferState,
  isDeadlinePassed: boolean
): { canUse: boolean; reason?: string } {
  // Can't use chips after deadline
  if (isDeadlinePassed) {
    return { canUse: false, reason: 'Deadline has passed' }
  }

  // Can't use wildcards in GW1 (but allow Bench Boost and Triple Captain)
  if (currentGameweek === 1 && (chipType === 'wildcard1' || chipType === 'wildcard2')) {
    return { canUse: false, reason: 'Cannot use this chip in Gameweek 1' }
  }

  // Check if chip already used
  if (chipsUsed[chipType].used) {
    return { canUse: false, reason: 'Chip already used this season' }
  }

  // Check wildcard availability windows
  if (chipType === 'wildcard1') {
    if (currentGameweek < 2 || currentGameweek > 13) {
      return { canUse: false, reason: 'Wildcard 1 only available GW2-13' }
    }
  }

  if (chipType === 'wildcard2') {
    if (currentGameweek < 14 || currentGameweek > 27) {
      return { canUse: false, reason: 'Wildcard 2 only available GW14-27' }
    }
  }

  // Check if another chip is already active in this specific gameweek
  const hasActiveChipInCurrentGW = Object.values(chipsUsed).some(chip =>
    chip.isActive && chip.gameweek === currentGameweek
  )

  // Check if the current chip is active in the current gameweek
  const isCurrentChipActiveInCurrentGW = chipsUsed[chipType].isActive && chipsUsed[chipType].gameweek === currentGameweek

  if (hasActiveChipInCurrentGW && !isCurrentChipActiveInCurrentGW) {
    return { canUse: false, reason: `Only one chip can be active per gameweek. Another chip is already active in GW${currentGameweek}` }
  }

  return { canUse: true }
}

// Firebase Transfer Management Functions
export const loadTransferStateFromFirebase = async (userId: string): Promise<UserTransferState> => {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData.transferState || getDefaultTransferState()
    }

    return getDefaultTransferState()
  } catch (error) {
    console.error('Error loading transfer state from Firebase:', error)
    return getDefaultTransferState()
  }
}

export const saveTransferStateToFirebase = async (userId: string, transferState: UserTransferState): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      transferState,
      lastUpdated: new Date()
    })
  } catch (error) {
    console.error('Error saving transfer state to Firebase:', error)
    throw error
  }
}

export const saveTransferToFirebase = async (userId: string, transferData: TransferData): Promise<void> => {
  try {
    const transfersRef = collection(db, 'users', userId, 'transfers')
    await addDoc(transfersRef, {
      ...transferData,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Error saving transfer to Firebase:', error)
    throw error
  }
}

// Validate transfer
export function validateTransfer(
  playerOut: Player,
  playerIn: Player,
  currentSquad: Player[],
  budget: number
): { valid: boolean; error?: string } {
  // Check if player out is in current squad
  if (!currentSquad.find(p => p.id === playerOut.id)) {
    return { valid: false, error: 'Player to remove is not in your squad' }
  }
  
  // Check if player in is already in squad
  if (currentSquad.find(p => p.id === playerIn.id)) {
    return { valid: false, error: 'Player is already in your squad' }
  }
  
  // Check position compatibility
  if (playerOut.position !== playerIn.position) {
    return { valid: false, error: 'Must replace player with same position' }
  }
  
  // Check budget after transfer
  const newSquadCost = currentSquad
    .filter(p => p.id !== playerOut.id)
    .reduce((sum, p) => sum + p.price, 0) + playerIn.price
    
  if (newSquadCost > budget) {
    const shortfall = newSquadCost - budget
    return { valid: false, error: `Exceeds budget by £${shortfall.toFixed(1)}m` }
  }
  
  // Check club limit (max 3 from same club)
  const newSquad = currentSquad
    .filter(p => p.id !== playerOut.id)
    .concat(playerIn)
    
  const clubCounts: {[club: string]: number} = {}
  newSquad.forEach(p => {
    const clubKey = p.club || p.team || 'Unknown';
    clubCounts[clubKey] = (clubCounts[clubKey] || 0) + 1;
  });
  
  const maxClubCount = Math.max(...Object.values(clubCounts))
  if (maxClubCount > 3) {
    return { valid: false, error: 'Cannot have more than 3 players from same club' }
  }
  
  return { valid: true }
}

// Execute transfer
export async function executeTransfer(
  userId: string,
  transferData: TransferData,
  currentSquad: Player[],
  userTransfers: UserTransferState
): Promise<{ success: boolean; newSquad?: Player[]; error?: string }> {
  try {
    const playerOut = currentSquad.find(p => p.id === transferData.playerOut);
    // You'll need to fetch playerIn from your players database
    const playerIn = await getPlayerById(transferData.playerIn);

    if (!playerOut || !playerIn) {
      return { success: false, error: 'Player not found' };
    }

    // Validate transfer
    const validation = validateTransfer(playerOut, playerIn, currentSquad, 100);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create new squad
    const newSquad = currentSquad
      .filter(p => p.id !== playerOut.id)
      .concat(playerIn);

    // Save transfer to database
    await saveTransferToFirebase(userId, transferData);

    return { success: true, newSquad };
  } catch (error) {
    return { success: false, error: 'Failed to execute transfer' };
  }
}









