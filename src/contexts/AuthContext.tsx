'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '@/lib/firebase'

interface UserProfile {
  uid: string
  email: string
  displayName: string
  displayNameAr: string
  teamName: string
  teamNameAr: string
  country: string
  favoriteTeam: string
  createdAt: Date
  lastActive: Date
  totalPoints: number
  gameweekRank: number
  overallRank: number
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signup: (email: string, password: string, displayName: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      console.warn('Firebase not configured, using demo mode')
      setLoading(false)
      return
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user)

        if (user && db) {
          try {
            // Load user profile from Firestore
            const profileDoc = await getDoc(doc(db, 'users', user.uid))
            if (profileDoc.exists()) {
              setUserProfile({
                ...profileDoc.data(),
                createdAt: profileDoc.data().createdAt?.toDate(),
                lastActive: profileDoc.data().lastActive?.toDate(),
              } as UserProfile)
            }
          } catch (error) {
            console.warn('Failed to load user profile:', error)
          }
        } else {
          setUserProfile(null)
        }

        setLoading(false)
      })

      return unsubscribe
    } catch (error) {
      console.warn('Auth state change listener failed:', error)
      setLoading(false)
    }
  }, [])

  const signup = async (email: string, password: string, displayName: string) => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error('Authentication service not available')
    }

    const { user } = await createUserWithEmailAndPassword(auth, email, password)

    await updateProfile(user, {
      displayName: displayName
    })

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: displayName,
      displayNameAr: displayName, // Will be updated later
      teamName: `${displayName}'s Team`,
      teamNameAr: `فريق ${displayName}`,
      country: 'Jordan',
      favoriteTeam: '',
      createdAt: new Date(),
      lastActive: new Date(),
      totalPoints: 0,
      gameweekRank: 0,
      overallRank: 0
    }

    await setDoc(doc(db, 'users', user.uid), {
      ...userProfile,
      createdAt: new Date(),
      lastActive: new Date()
    })

    setUserProfile(userProfile)
  }

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error('Authentication service not available')
    }

    const { user } = await signInWithEmailAndPassword(auth, email, password)

    // Update last active
    await setDoc(doc(db, 'users', user.uid), {
      lastActive: new Date()
    }, { merge: true })
  }

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error('Authentication service not available')
    }

    const provider = new GoogleAuthProvider()
    const { user } = await signInWithPopup(auth, provider)

    // Check if user profile exists, if not create it
    const profileDoc = await getDoc(doc(db, 'users', user.uid))
    if (!profileDoc.exists()) {
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || 'User',
        displayNameAr: user.displayName || 'مستخدم',
        teamName: `${user.displayName || 'User'}'s Team`,
        teamNameAr: `فريق ${user.displayName || 'المستخدم'}`,
        country: 'Jordan',
        favoriteTeam: '',
        createdAt: new Date(),
        lastActive: new Date(),
        totalPoints: 0,
        gameweekRank: 0,
        overallRank: 0
      }

      await setDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        createdAt: new Date(),
        lastActive: new Date()
      })
    } else {
      // Update last active
      await setDoc(doc(db, 'users', user.uid), {
        lastActive: new Date()
      }, { merge: true })
    }
  }

  const logout = async () => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null)
      setUserProfile(null)
      return
    }

    if (user && db) {
      try {
        // Update last active before logout
        await setDoc(doc(db, 'users', user.uid), {
          lastActive: new Date()
        }, { merge: true })
      } catch (error) {
        console.warn('Failed to update last active:', error)
      }
    }

    await signOut(auth)
    setUserProfile(null)
  }

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !isFirebaseConfigured || !db) return

    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...updates,
        lastActive: new Date()
      }, { merge: true })

      setUserProfile(prev => prev ? { ...prev, ...updates } : null)
    } catch (error) {
      console.warn('Failed to update user profile:', error)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
