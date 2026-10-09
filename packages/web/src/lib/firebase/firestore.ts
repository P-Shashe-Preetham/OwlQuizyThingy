import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { app } from "./app"

export const db = getFirestore(app)

if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080)
}
