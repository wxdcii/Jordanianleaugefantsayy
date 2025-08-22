import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAA5U81ZlnHeO0JSea-CwBX5jr013ZdCg8",
  authDomain: "jordanianfantasy-eef57.firebaseapp.com",
  projectId: "jordanianfantasy-eef57",
  storageBucket: "jordanianfantasy-eef57.firebasestorage.app",
  messagingSenderId: "112691197575",
  appId: "1:112691197575:web:8b4124608078dde3082a22"
}

console.log('Firebase config check:')
console.log('API Key exists:', !!firebaseConfig.apiKey)
console.log('Project ID:', firebaseConfig.projectId)

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
console.log('Firebase initialized successfully')

// Player interface based on your document structure
interface Player {
  id: string
  name: string
  position: string
  club: string
  price: number
  points: { [key: string]: number } // gw1, gw2, etc.
  totalPoints: number
  kitImage?: string
}

// Fetch all players from Firestore
export async function fetchAllPlayers(): Promise<Player[]> {
  try {
    console.log('Starting fetchAllPlayers...')
    
    const playersRef = collection(db, 'players')
    const snapshot = await getDocs(playersRef)
    console.log('Snapshot size:', snapshot.size)
    
    if (snapshot.empty) {
      console.log('No players found in Firebase')
      return []
    }
    
    const players: Player[] = snapshot.docs.map(doc => {
      const data = doc.data()
      console.log('Raw player data:', data)
      
      // Add null checks for required fields
      if (!data.name || !data.position || !data.club) {
        console.warn('Player missing required fields:', data)
        return null
      }
      
      return {
        id: doc.id,
        name: data.name || 'Unknown',
        nameAr: data.nameAr || '',
        position: data.position || 'Unknown',
        club: data.club || 'Unknown',
        price: data.price || 0,
        points: data.points || {},
        totalPoints: data.totalPoints || 0,
       gameweekStats: data.gameweekStats || {} // <-- Add this line!
      }
    }).filter(player => player !== null) // Remove null players
    
    console.log('Final players array:', players)
    return players
  } catch (error) {
    console.error('Error fetching players:', error)
    return []
  }
}

// Usage example
export async function getPlayersData() {
  try {
    const players = await fetchAllPlayers()
    console.log(`Total players fetched: ${players.length}`)
    return players
  } catch (error) {
    console.error('Failed to get players data:', error)
    return []
  }
}


