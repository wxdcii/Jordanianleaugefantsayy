import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Utility to clean object of undefined values
 */
function cleanObject(obj) {
  if (obj === null || obj === undefined) return {};
  if (Array.isArray(obj)) return obj.map(cleanObject).filter(item => item !== undefined);
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = typeof value === 'object' ? cleanObject(value) : value;
      }
    }
    return cleaned;
  }
  return obj;
}

async function getPlayerGameweekPoints(playerId, gameweek) {
  try {
    const playerDoc = await getDoc(doc(db, 'players', playerId));
    if (!playerDoc.exists()) return 0;
    const playerData = playerDoc.data();
    const gameweekPoints = playerData.points?.[`gw${gameweek}`];
    return gameweekPoints ?? 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function debugSquadStructure(userId, gameweek) {
  try {
    const squadDoc = await getDoc(doc(db, `users/${userId}/squads/gw${gameweek}`));
    if (!squadDoc.exists()) return { exists: false, message: 'Squad not found' };
    const data = squadDoc.data();
    return {
      exists: true,
      data,
      keys: Object.keys(data),
      hasStartingXI: !!data.startingXI,
      startingXIType: Array.isArray(data.startingXI) ? 'array' : typeof data.startingXI,
      startingXILength: Array.isArray(data.startingXI) ? data.startingXI.length : 'not array',
      hasBench: !!data.bench,
      benchType: Array.isArray(data.bench) ? 'array' : typeof data.bench,
      benchLength: Array.isArray(data.bench) ? data.bench.length : 'not array',
      captain: data.captain,
      chips: data.chips
    };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

export async function calculateUserGameweekPoints(userId, gameweek) {
  try {
    const squadDoc = await getDoc(doc(db, `users/${userId}/squads/gw${gameweek}`));
    if (!squadDoc.exists()) return { success: false, message: 'Squad not found', points: 0 };

    const squadData = squadDoc.data();
    let startingXI = [], bench = [], captain = null, chips = {};

    if (Array.isArray(squadData.startingXI)) {
      startingXI = squadData.startingXI;
      bench = squadData.bench || [];
      captain = squadData.captain;
      chips = squadData.chips || {};
    } else if (squadData.formation?.starting) {
      startingXI = squadData.formation.starting;
      bench = squadData.formation.bench || [];
      captain = squadData.captain;
      chips = squadData.chips || {};
    } else if (squadData.players) {
      startingXI = squadData.players.filter(p => p.isStarting);
      bench = squadData.players.filter(p => !p.isStarting);
      captain = squadData.captainId || squadData.captain;
      chips = squadData.chipsUsed || squadData.chips || {};
    } else {
      return { success: false, message: 'Unknown squad structure', points: 0 };
    }

    let totalPoints = 0;
    const pointsBreakdown = { startingXI: [], bench: [], captainBonus: 0, chipsBonus: 0 };

    for (const player of startingXI) {
      const pts = await getPlayerGameweekPoints(player.playerId, gameweek);
      totalPoints += pts;

      if (captain === player.playerId) {
        totalPoints += pts;
        pointsBreakdown.captainBonus = pts;
        if (chips?.tripleCaptain?.isActive) {
          totalPoints += pts;
          pointsBreakdown.chipsBonus += pts;
        }
      }

      pointsBreakdown.startingXI.push({
        playerId: player.playerId,
        name: player.name,
        points: pts,
        isCaptain: captain === player.playerId,
        isTripleCaptain: chips?.tripleCaptain?.isActive && captain === player.playerId
      });
    }

    if (chips?.benchBoost?.isActive && Array.isArray(bench)) {
      for (const player of bench) {
        const pts = await getPlayerGameweekPoints(player.playerId, gameweek);
        totalPoints += pts;
        pointsBreakdown.chipsBonus += pts;
        pointsBreakdown.bench.push({
          playerId: player.playerId,
          name: player.name,
          points: pts
        });
      }
    }

    return {
      success: true,
      points: totalPoints,
      breakdown: cleanObject(pointsBreakdown),
      gameweek,
      userId
    };
  } catch (error) {
    return { success: false, message: error.message, points: 0 };
  }
}

export async function updateUserGameweekPoints(userId, gameweek) {
  try {
    const pointsResult = await calculateUserGameweekPoints(userId, gameweek);
    if (!pointsResult.success) return pointsResult;

    const pointsDocRef = doc(db, `users/${userId}/GameweekPoints/gw${gameweek}`);
    await setDoc(pointsDocRef, {
      userId,
      gameweek,
      points: pointsResult.points,
      pointsBreakdown: cleanObject(pointsResult.breakdown),
      lastUpdated: new Date(),
      calculatedAt: new Date()
    }, { merge: true });

    return {
      success: true,
      points: pointsResult.points,
      breakdown: pointsResult.breakdown,
      message: `Points updated: ${pointsResult.points}`
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function calculateAndSaveSquadPoints(userId, gameweek) {
  try {
    const result = await updateUserGameweekPoints(userId, gameweek);
    if (result.success) {
      await updateUserTotalPoints(userId);
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function updateAllUsersGameweekPoints(gameweek) {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const updateResults = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const squadDoc = await getDoc(doc(db, `users/${userId}/squads/gw${gameweek}`));
      if (squadDoc.exists()) {
        const result = await updateUserGameweekPoints(userId, gameweek);
        updateResults.push({ userId, ...result });
      }
    }

    return {
      success: true,
      message: `Updated ${updateResults.length} users`,
      results: updateResults
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function updateUserTotalPoints(userId) {
  try {
    let totalPoints = 0;
    const gameweekBreakdown = {};

    for (let gw = 1; gw <= 27; gw++) {
      const docSnap = await getDoc(doc(db, `users/${userId}/GameweekPoints/gw${gw}`));
      const points = docSnap.exists() ? docSnap.data().points || 0 : 0;
      totalPoints += points;
      gameweekBreakdown[`gw${gw}`] = points;
    }

    await updateDoc(doc(db, 'users', userId), {
      totalPoints,
      gameweekBreakdown,
      lastPointsUpdate: new Date()
    });

    return { success: true, totalPoints, gameweekBreakdown };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function triggerPlayerDataUpdate(playerId, gameweek) {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const affectedUsers = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const squadDoc = await getDoc(doc(db, `users/${userId}/squads/gw${gameweek}`));
      if (!squadDoc.exists()) continue;
      const squadData = squadDoc.data();
      const players = [...(squadData.startingXI || []), ...(squadData.bench || [])];
      if (players.some(p => p.playerId === playerId)) {
        affectedUsers.push(userId);
      }
    }

    const updateResults = [];
    for (const userId of affectedUsers) {
      const result = await updateUserGameweekPoints(userId, gameweek);
      if (result.success) await updateUserTotalPoints(userId);
      updateResults.push({ userId, ...result });
    }

    return {
      success: true,
      message: `Updated ${updateResults.length} affected users`,
      results: updateResults
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function batchUpdatePlayerData(updates) {
  try {
    const results = [];
    for (const { playerId, gameweek } of updates) {
      const result = await triggerPlayerDataUpdate(playerId, gameweek);
      results.push({ playerId, gameweek, ...result });
    }
    return {
      success: true,
      message: `Processed ${updates.length} player updates`,
      results
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
