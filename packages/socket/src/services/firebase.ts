import { logger } from "../lib/observability/logger"
import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import admin from "firebase-admin"
import { v4 as uuid } from "uuid"

class FirebaseService {
  private static instance: FirebaseService
  private db?: admin.firestore.Firestore
  private initialized = false

  private constructor() {
    this.init()
  }

  static getInstance() {
    FirebaseService.instance ||= new FirebaseService()

    return FirebaseService.instance
  }

  private init() {
    try {
      try {
        process.loadEnvFile("../../.env")
      } catch {
        // Ignored
      }

      const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT

      if (!serviceAccountVar) {
        logger.warn(
          "⚠️ FIREBASE_SERVICE_ACCOUNT not found. Firebase features will be disabled.",
        )

        return
      }

      let serviceAccount: any = null

      try {
        // Try to parse as direct JSON first
        serviceAccount = JSON.parse(serviceAccountVar)
      } catch {
        try {
          // If not JSON, try to decode as Base64
          const decoded = Buffer.from(serviceAccountVar, "base64").toString(
            "utf-8",
          )
          serviceAccount = JSON.parse(decoded)
        } catch {
          logger.error(
            "❌ Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON or Base64.",
          )

          return
        }
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })

      this.db = admin.firestore()
      this.initialized = true
      logger.info("🚀 Firebase Firestore initialized successfully.")
    } catch (error) {
      logger.error("❌ Firebase initialization failed:", error)
    }
  }

  isInitialized() {
    return this.initialized
  }

  async getQuizzes(): Promise<QuizzWithId[]> {
    if (!this.db) {
      return []
    }

    try {
      const snapshot = await this.db.collection("quizzes").get()

      return snapshot.docs.map((doc) => {
        const data = doc.data()

        // Ensure internal data cannot overwrite canonical doc.id
        return {
          ...data,
          id: doc.id,
        } as QuizzWithId
      })
    } catch (error) {
      logger.error("Error fetching quizzes:", error)

      return []
    }
  }

  async saveQuizz(quizz: Quizz, id?: string): Promise<string> {
    if (!this.db) {
      throw new Error("Firebase not initialized")
    }

    try {
      const quizzId = id || (quizz as any)?.id || uuid()

      const quizzData = { ...quizz } as any
      delete quizzData.id

      await this.db
        .collection("quizzes")
        .doc(quizzId)
        .set(
          {
            ...quizzData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        )

      logger.info(`Saved quiz: ${quizz.subject} (${quizzId})`)

      return quizzId
    } catch (error) {
      logger.error("Error saving quiz:", error)
      throw error
    }
  }

  async deleteQuizz(id: string): Promise<void> {
    if (!this.db) {
      return
    }

    await this.db.collection("quizzes").doc(id).delete()
  }
}

export default FirebaseService.getInstance()
