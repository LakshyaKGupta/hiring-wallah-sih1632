'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { apiFetch } from '@/lib/api'

export type UserRole = 'recruiter' | 'candidate' | null
type ConcreteUserRole = Exclude<UserRole, null>

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: UserRole
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  profileLoading: boolean
  signInWithGoogle: (preferredRole?: ConcreteUserRole) => Promise<void>
  signUpWithEmail: (params: { role: ConcreteUserRole; email: string; password: string; displayName?: string }) => Promise<AuthUser>
  signInWithEmail: (email: string, password: string) => Promise<AuthUser>
  signOut: () => Promise<void>
  setUserRole: (role: ConcreteUserRole) => Promise<void>
}

type BackendProfile = {
  firebase_uid: string
  email: string | null
  display_name: string | null
  photo_url: string | null
  role: ConcreteUserRole
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  async function signInWithGoogle(preferredRole?: ConcreteUserRole): Promise<void> {
    assertHiringWallahFirebaseConfig()

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    if (preferredRole) {
      sessionStorage.setItem('hw_preferred_role', preferredRole)
    }
    
    // Use popup instead of redirect to avoid browser blocking and state loss
    const result = await signInWithPopup(auth, provider)
    
    // Process the login immediately instead of waiting for a redirect
    if (preferredRole) {
      sessionStorage.removeItem('hw_preferred_role')
      try {
        const currentRole = await fetchRole(result.user)
        if (!currentRole) {
          await persistProfile(result.user, preferredRole)
        }
      } catch {
        await persistProfile(result.user, preferredRole)
      }
    }
  }

  async function signUpWithEmail(params: { role: ConcreteUserRole; email: string; password: string; displayName?: string }) {
    assertHiringWallahFirebaseConfig()
    const result = await createUserWithEmailAndPassword(auth, params.email, params.password)
    if (params.displayName) await updateProfile(result.user, { displayName: params.displayName })
    const profile = await persistProfile(result.user, params.role, params.displayName)
    const nextUser = toAuthUser(result.user, profile.role)
    setUser(nextUser)
    setFirebaseUser(result.user)
    return nextUser
  }

  async function signInWithEmail(email: string, password: string) {
    assertHiringWallahFirebaseConfig()
    const result = await signInWithEmailAndPassword(auth, email, password)
    const role = await fetchRole(result.user)
    const nextUser = toAuthUser(result.user, role)
    setUser(nextUser)
    setFirebaseUser(result.user)
    return nextUser
  }

  async function setUserRole(role: ConcreteUserRole) {
    if (!firebaseUser) throw new Error('You must be signed in before choosing a role.')
    const profile = await persistProfile(firebaseUser, role)
    setUser(toAuthUser(firebaseUser, profile.role))
  }

  async function signOut() {
    await firebaseSignOut(auth)
    setFirebaseUser(null)
    setUser(null)
  }

  async function fetchRole(nextFirebaseUser: FirebaseUser): Promise<UserRole> {
    try {
      const profile = await apiFetch<BackendProfile>('/auth/profile', {}, nextFirebaseUser)
      return profile.role
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('has not been created')) return null
      throw error
    }
  }

  async function persistProfile(nextFirebaseUser: FirebaseUser, role: ConcreteUserRole, displayName?: string) {
    return apiFetch<BackendProfile>(
      '/auth/profile',
      {
        method: 'POST',
        body: JSON.stringify({
          role,
          display_name: displayName ?? nextFirebaseUser.displayName,
        }),
      },
      nextFirebaseUser,
    )
  }

  useEffect(() => {
    // getRedirectResult is no longer needed since we use signInWithPopup

    const unsub = onAuthStateChanged(auth, async (nextFirebaseUser) => {
      setFirebaseUser(nextFirebaseUser)
      if (!nextFirebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }

      setUser(toAuthUser(nextFirebaseUser, null))
      setLoading(false)
      setProfileLoading(true)
      try {
        const role = await fetchRole(nextFirebaseUser)
        setUser(toAuthUser(nextFirebaseUser, role))
      } catch {
        setUser(toAuthUser(nextFirebaseUser, null))
      } finally {
        setProfileLoading(false)
      }
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, profileLoading, signInWithGoogle, signUpWithEmail, signInWithEmail, signOut, setUserRole }}
    >
      {children}
    </AuthContext.Provider>
  )
}

function toAuthUser(firebaseUser: FirebaseUser, role: UserRole): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    role,
  }
}

function assertHiringWallahFirebaseConfig() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'hiring-wallah-prod'
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'hiring-wallah-prod.firebaseapp.com'
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'hiring-wallah-prod.firebasestorage.app'
  const configValues = [authDomain, projectId, storageBucket].filter(Boolean).join(' ')

  if (/agenteval/i.test(configValues)) {
    const error = new Error(
      'Google sign-in is still configured for the AgentEval Firebase project. Replace the Firebase env values with the Hiring Wallah Firebase app before opening Google auth.',
    ) as Error & { code: string }
    error.code = 'auth/wrong-firebase-project'
    throw error
  }
}
