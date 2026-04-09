import admin from "firebase-admin"
import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import { v4 as uuid } from "uuid"

class FirebaseService {
  private static instance: FirebaseService
  private db?: admin.firestore.Firestore
  private initialized = false

  private constructor() {
    this.init()
  }

  static getInstance() {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService()
    }
    return FirebaseService.instance
  }

  private init() {
    try {
      try {
        process.loadEnvFile('../../.env');
      } catch (e) {
        // Ignored
      }
      const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT
      
      if (!serviceAccountVar) {
        console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT not found. Firebase features will be disabled.")
        return
      }

      let serviceAccount
      try {
        // Try to parse as direct JSON first
        serviceAccount = JSON.parse(serviceAccountVar)
      } catch (e) {
        try {
          // If not JSON, try to decode as Base64
          const decoded = Buffer.from(serviceAccountVar, 'base64').toString('utf-8')
          serviceAccount = JSON.parse(decoded)
        } catch (base64Error) {
          console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON or Base64.")
          return
        }
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      })

      this.db = admin.firestore()
      this.initialized = true
      console.log("🚀 Firebase Firestore initialized successfully.")
    } catch (error) {
      console.error("❌ Firebase initialization failed:", error)
    }
  }

  isInitialized() {
    return this.initialized
  }

  async getQuizzes(): Promise<QuizzWithId[]> {
    if (!this.db) return []

    try {
      const snapshot = await this.db.collection("quizzes").get()
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuizzWithId[]
    } catch (error) {
      console.error("Error fetching quizzes:", error)
      return []
    }
  }

  async saveQuizz(quizz: Quizz, id?: string): Promise<string> {
    if (!this.db) throw new Error("Firebase not initialized")

    try {
      const quizzId = id || uuid()
      await this.db.collection("quizzes").doc(quizzId).set({
        ...quizz,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
      
      console.log(`Saved quiz: ${quizz.subject} (${quizzId})`)
      return quizzId
    } catch (error) {
      console.error("Error saving quiz:", error)
      throw error
    }
  }

  async deleteQuizz(id: string): Promise<void> {
    if (!this.db) return
    await this.db.collection("quizzes").doc(id).delete()
  }
}

export default FirebaseService.getInstance()
