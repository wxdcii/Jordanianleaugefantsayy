import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAA5U81ZlnHeO0JSea-CwBX5jr013ZdCg8",
  authDomain: "jordanianfantasy-eef57.firebaseapp.com",
  projectId: "jordanianfantasy-eef57",
  storageBucket: "jordanianfantasy-eef57.firebasestorage.app",
  messagingSenderId: "112691197575",
  appId: "1:112691197575:web:8b4124608078dde3082a22"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const gameweekIds = Array.from({ length: 27 }, (_, i) => `gw${i + 1}`);
const defaultStats = {
  goals: 0,
  assists: 0,
  yellowCards: 0,
  redCards: 0,
  ownGoals: 0,
  minutesPlayed: 0,
  bonusPoints: 0,
  cleanSheets: 0,
  savePoints: 0,
  goalsConceded: 0,   // For DEF and GKP (safe to add for all)
  penaltySave: 0,     // For GKP (safe to add for all)
  penaltyMiss: 0      // For all players
};

async function addGameweekStatsToPlayers() {
  const playersRef = collection(db, 'players');
  const snapshot = await getDocs(playersRef);

  for (const playerDoc of snapshot.docs) {
    const gameweekStats = {};
    gameweekIds.forEach(gw => {
      gameweekStats[gw] = { ...defaultStats };
    });

    await updateDoc(doc(db, 'players', playerDoc.id), { gameweekStats });
    console.log(`✅ Updated player ${playerDoc.id}`);
  }
}

addGameweekStatsToPlayers().catch(console.error);
