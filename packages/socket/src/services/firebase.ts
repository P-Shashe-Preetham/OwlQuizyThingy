import { logger } from "../lib/observability/logger"
import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import { quizzSchema } from "@rahoot/common/validators/game"
import admin from "firebase-admin"
import { v4 as uuid } from "uuid"

const quizzConverter: admin.firestore.FirestoreDataConverter<Quizz> = {
  toFirestore(quizz: Quizz): admin.firestore.DocumentData {
    return {
      ...quizz,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
  },

  fromFirestore(snapshot: admin.firestore.QueryDocumentSnapshot): Quizz {
    return snapshot.data() as Quizz
  },
}

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
        // Local .env loading is optional.
      }

      const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT

      if (!serviceAccountVar) {
        logger.warn(
          "FIREBASE_SERVICE_ACCOUNT not found. Firebase features will be disabled.",
        )

        return
      }

      let serviceAccount: unknown

      try {
        serviceAccount = JSON.parse(serviceAccountVar)
      } catch {
        try {
          const decoded = Buffer.from(serviceAccountVar, "base64").toString(
            "utf-8",
          )

          serviceAccount = JSON.parse(decoded)
        } catch {
          logger.error(
            "Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON or Base64.",
          )

          return
        }
      }

      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount,
        ),
      })

      this.db = admin.firestore()
      this.initialized = true

      logger.info("Firebase Firestore initialized successfully.")
    } catch (error) {
      logger.error("Firebase initialization failed.", { error })
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
      const snapshot = await this.db
        .collection("quizzes")
        .withConverter(quizzConverter)
        .get()

      const quizzes: QuizzWithId[] = []

      for (const doc of snapshot.docs) {
        const data = doc.data()
        const validationResult = quizzSchema.safeParse(data)

        if (validationResult.success) {
          quizzes.push({
            ...validationResult.data,
            id: doc.id,
          })
        } else {
          logger.warn("Malformed quiz document in Firestore skipped.", {
            documentId: doc.id,
            issues: validationResult.error.issues,
          })
        }
      }

      return quizzes
    } catch (error) {
      logger.error("Error fetching quizzes from Firestore.", { error })

      return []
    }
  }

  async saveQuizz(quizz: Quizz, id?: string): Promise<string> {
    if (!this.db) {
      throw new Error("Firebase not initialized")
    }

    const validationResult = quizzSchema.safeParse(quizz)

    if (!validationResult.success) {
      throw new Error(
        `Invalid quiz schema: ${validationResult.error.issues[0]?.message ?? "Invalid quiz"}`,
      )
    }

    try {
      const quizzId = id || uuid()

      await this.db
        .collection("quizzes")
        .withConverter(quizzConverter)
        .doc(quizzId)
        .set(quizz, { merge: true })

      logger.info(`Saved quiz: ${quizz.subject} (${quizzId})`)

      return quizzId
    } catch (error) {
      logger.error("Error saving quiz to Firestore.", { error })

      throw new Error("Failed to save quiz to Firestore")
    }
  }

  async deleteQuizz(id: string): Promise<void> {
    if (!this.db) {
      throw new Error("Firebase not initialized")
    }

    if (!id || typeof id !== "string") {
      throw new Error("Invalid quiz ID for deletion")
    }

    try {
      await this.db.collection("quizzes").doc(id).delete()

      logger.info(`Deleted quiz: ${id}`)
    } catch (error) {
      logger.error("Error deleting quiz from Firestore.", { error })

      throw new Error("Failed to delete quiz from Firestore")
    }
  }
}

export default FirebaseService.getInstance()