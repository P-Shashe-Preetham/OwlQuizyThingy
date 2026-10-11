import { initializeApp, getApps, getApp } from "firebase/app"

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID

if (!apiKey || !projectId) {
  if (!import.meta.env.DEV) {
    throw new Error(
      "Missing required VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID environment variables in production."
    )
  }

  console.warn("Missing Firebase env vars. Using demo configuration for local development.")
}

const firebaseConfig = {
  apiKey: apiKey || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: projectId || "rahoot-36025",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:123456789",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || undefined,
}

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
