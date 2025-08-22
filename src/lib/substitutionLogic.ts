// Fantasy Football Substitution Logic with Automatic Formation Updates

export interface Player {
  id: string
  name: string
  position: 'GKP' | 'DEF' | 'MID' | 'FWD'
  isStarting: boolean
  benchPosition?: number
  captain?: boolean
}

export interface Squad {
  starting: Player[]
  bench: Player[]
  formation: string
}

// Valid formation templates
const VALID_FORMATIONS = [
  { name: '3-4-3', def: 3, mid: 4, fwd: 3 },
  { name: '4-4-2', def: 4, mid: 4, fwd: 2 },
  { name: '4-3-3', def: 4, mid: 3, fwd: 3 },
  { name: '3-5-2', def: 3, mid: 5, fwd: 2 },
  { name: '5-3-2', def: 5, mid: 3, fwd: 2 },
  { name: '5-4-1', def: 5, mid: 4, fwd: 1 },
  { name: '4-5-1', def: 4, mid: 5, fwd: 1 },
  { name: '3-3-4', def: 3, mid: 3, fwd: 4 }
]

/**
 * Validates if a formation is allowed
 */
export function isValidFormation(defCount: number, midCount: number, fwdCount: number): boolean {
  return VALID_FORMATIONS.some(f => 
    f.def === defCount && f.mid === midCount && f.fwd === fwdCount
  )
}

/**
 * Gets formation name from position counts
 */
export function getFormationName(defCount: number, midCount: number, fwdCount: number): string {
  const formation = VALID_FORMATIONS.find(f => 
    f.def === defCount && f.mid === midCount && f.fwd === fwdCount
  )
  return formation ? formation.name : `${defCount}-${midCount}-${fwdCount}`
}

/**
 * Calculates position counts from starting players
 */
export function calculatePositionCounts(startingPlayers: Player[]) {
  return {
    gkp: startingPlayers.filter(p => p.position === 'GKP').length,
    def: startingPlayers.filter(p => p.position === 'DEF').length,
    mid: startingPlayers.filter(p => p.position === 'MID').length,
    fwd: startingPlayers.filter(p => p.position === 'FWD').length
  }
}

/**
 * Main substitution function with formation validation
 */
export function substitutePlayer(
  startingPlayerId: string,
  benchPlayerId: string,
  currentSquad: Squad
): { success: boolean; newSquad?: Squad; error?: string } {
  
  const startingPlayer = currentSquad.starting.find(p => p.id === startingPlayerId)
  const benchPlayer = currentSquad.bench.find(p => p.id === benchPlayerId)

  // Validation checks
  if (!startingPlayer) {
    return { success: false, error: 'Starting player not found' }
  }
  
  if (!benchPlayer) {
    return { success: false, error: 'Bench player not found' }
  }

  if (startingPlayer.id === benchPlayer.id) {
    return { success: false, error: 'Cannot substitute player with themselves' }
  }

  // Check if the starting player being substituted is the captain
  const wasCaptain = startingPlayer.captain || false

  // Create new starting lineup after substitution
  const newStarting = currentSquad.starting.map(p => {
    if (p.id === startingPlayerId) {
      // Replace starting player with bench player
      return {
        ...benchPlayer,
        isStarting: true,
        captain: wasCaptain // Transfer captaincy if needed
      }
    }
    return p
  })

  // Create new bench after substitution
  const newBench = currentSquad.bench.map(p => {
    if (p.id === benchPlayerId) {
      // Replace bench player with starting player
      return {
        ...startingPlayer,
        isStarting: false,
        captain: false // Remove captaincy when going to bench
      }
    }
    return p
  })

  // Calculate new position counts
  const counts = calculatePositionCounts(newStarting)

  // Validate formation requirements
  if (counts.gkp !== 1) {
    return { success: false, error: 'Must have exactly 1 goalkeeper' }
  }

  if (counts.def < 3 || counts.def > 5) {
    return { success: false, error: 'Must have 3-5 defenders' }
  }

  if (counts.mid < 3 || counts.mid > 5) {
    return { success: false, error: 'Must have 3-5 midfielders' }
  }

  if (counts.fwd < 1 || counts.fwd > 4) {
    return { success: false, error: 'Must have 1-4 forwards' }
  }

  // Check if formation is valid
  if (!isValidFormation(counts.def, counts.mid, counts.fwd)) {
    return { 
      success: false, 
      error: `Formation ${counts.def}-${counts.mid}-${counts.fwd} is not allowed` 
    }
  }

  // Create new squad with updated formation
  const newFormation = getFormationName(counts.def, counts.mid, counts.fwd)
  
  return {
    success: true,
    newSquad: {
      starting: newStarting,
      bench: newBench,
      formation: newFormation
    }
  }
}

/**
 * Get all possible formations for current squad
 */
export function getPossibleFormations(allPlayers: Player[]): string[] {
  const positions = {
    gkp: allPlayers.filter(p => p.position === 'GKP'),
    def: allPlayers.filter(p => p.position === 'DEF'),
    mid: allPlayers.filter(p => p.position === 'MID'),
    fwd: allPlayers.filter(p => p.position === 'FWD')
  }

  const possibleFormations: string[] = []

  // Try all valid formation combinations
  VALID_FORMATIONS.forEach(formation => {
    if (positions.def.length >= formation.def &&
        positions.mid.length >= formation.mid &&
        positions.fwd.length >= formation.fwd &&
        positions.gkp.length >= 1) {
      possibleFormations.push(formation.name)
    }
  })

  return possibleFormations
}

/**
 * Auto-arrange players to fit a specific formation
 */
export function arrangePlayersForFormation(
  allPlayers: Player[],
  targetFormation: string
): { starting: Player[]; bench: Player[] } | null {
  
  const formation = VALID_FORMATIONS.find(f => f.name === targetFormation)
  if (!formation) return null

  const positions = {
    gkp: allPlayers.filter(p => p.position === 'GKP'),
    def: allPlayers.filter(p => p.position === 'DEF'),
    mid: allPlayers.filter(p => p.position === 'MID'),
    fwd: allPlayers.filter(p => p.position === 'FWD')
  }

  // Check if we have enough players
  if (positions.gkp.length < 1 || 
      positions.def.length < formation.def ||
      positions.mid.length < formation.mid ||
      positions.fwd.length < formation.fwd) {
    return null
  }

  // Select starting players (best by points/form)
  const starting: Player[] = [
    ...positions.gkp.slice(0, 1).map(p => ({ ...p, isStarting: true })),
    ...positions.def.slice(0, formation.def).map(p => ({ ...p, isStarting: true })),
    ...positions.mid.slice(0, formation.mid).map(p => ({ ...p, isStarting: true })),
    ...positions.fwd.slice(0, formation.fwd).map(p => ({ ...p, isStarting: true }))
  ]

  // Remaining players go to bench
  const bench = allPlayers
    .filter(p => !starting.find(s => s.id === p.id))
    .map(p => ({ ...p, isStarting: false }))

  return { starting, bench }
}