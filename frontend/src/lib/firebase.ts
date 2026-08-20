// src/lib/firebase.ts
// ─────────────────────────────────────────────
// Firebase client SDK initializer for Hiring Wallah
// ─────────────────────────────────────────────

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || 'AIzaSyAT9taEv21M_QbQAqeHwcyaU2ZU-dLYuNg',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || 'hiring-wallah-prod.firebaseapp.com',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || 'hiring-wallah-prod',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || 'hiring-wallah-prod.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '39799091533',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || '1:39799091533:web:bfdd90de579c363b690704',
}

// Prevent re-initialization in Next.js hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export default app
