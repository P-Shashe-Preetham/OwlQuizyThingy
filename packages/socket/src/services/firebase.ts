import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import { quizzSchema } from "@rahoot/common/validators/game"
import admin from "firebase-admin"
import { v4 as uuid } from "uuid"

// Converter to provide type safety for Firestore reads/writes
const quizzConverter: admin.firestore.FirestoreDataConverter<Quizz> = {
  toFirestore(quizz: Quizz): admin.firestore.DocumentData {
    return {
      ...quizz,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
  },
  fromFirestore(snapshot: admin.firestore.QueryDocumentSnapshot): Quizz {
    const data = snapshot.data()

    // We'll validate schema separately to handle malformed data
    return data as Quizz
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
        // Ignored
      }

      const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT

      if (!serviceAccountVar) {
        console.warn(
          "⚠️ FIREBASE_SERVICE_ACCOUNT not found. Firebase features will be disabled.",
        )

        return
      }

      let serviceAccount: unknown = null

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
          console.error(
            "❌ Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON or Base64.",
          )

          return
        }
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
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
    if (!this.db) {
      return []
    }

    try {
      const snapshot = await this.db.collection("quizzes").withConverter(quizzConverter).get()
      const quizzes: QuizzWithId[] = []

      for (const doc of snapshot.docs) {
        const data = doc.data()

        // Validate against our Zod schema
        const validationResult = quizzSchema.safeParse(data)

        if (validationResult.success) {
          quizzes.push({
            ...validationResult.data,
            id: doc.id,
          })
        } else {
          console.error(`⚠️ Malformed quiz document in Firestore skipped: ${doc.id}. Issues:`, validationResult.error.format())
        }
      }

      return quizzes
    } catch (error: any) {
      console.error("Error fetching quizzes from Firestore:", error.message || error)
      // We don't throw here to prevent the whole app from crashing if read fails,
      // but in a strict production environment, we might bubble this up.

      return []
    }
  }

  async saveQuizz(quizz: Quizz, id?: string): Promise<string> {
    if (!this.db) {
      throw new Error("Firebase not initialized")
    }

    // Validate the quiz before saving
    const validationResult = quizzSchema.safeParse(quizz)

    if (!validationResult.success) {
        throw new Error(`Invalid quiz schema: ${validationResult.error.issues[0].message}`)
    }

    try {
      const quizzId = id || uuid()

      await this.db
        .collection("quizzes")
        .withConverter(quizzConverter)
        .doc(quizzId)
        .set(quizz, { merge: true })

      console.log(`Saved quiz: ${quizz.subject} (${quizzId})`)

      return quizzId
    } catch (error: any) {
      console.error("Error saving quiz to Firestore:", error.message || error)
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
        console.log(`Deleted quiz: ${id}`)
    } catch (error: any) {
        console.error("Error deleting quiz from Firestore:", error.message || error)
        throw new Error("Failed to delete quiz from Firestore")
    }
  }
}

export default FirebaseService.getInstance()
