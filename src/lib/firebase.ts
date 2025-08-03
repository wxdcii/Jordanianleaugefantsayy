import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyAA5U81ZlnHeO0JSea-CwBX5jr013ZdCg8",
  authDomain: "jordanianfantasy-eef57.firebaseapp.com",
  projectId: "jordanianfantasy-eef57",
  storageBucket: "jordanianfantasy-eef57.firebasestorage.app",
  messagingSenderId: "112691197575",
  appId: "1:112691197575:web:8b4124608078dde3082a22"
}

// Check if Firebase is properly configured
const isFirebaseConfigured = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID
)

// Initialize Firebase only if properly configured
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let auth: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let storage: any = null

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
  } catch (error) {
    console.warn('Firebase initialization failed:', error)
  }
}

// Export Firebase services with fallbacks
export { auth, db, storage }
export default app
export { isFirebaseConfigured }
