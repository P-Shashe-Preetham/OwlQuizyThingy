import { getDatabase, connectDatabaseEmulator } from "firebase/database"
import { app } from "./app"

// URL matching the Realtime Database emulator defaults
export const rtdb = getDatabase(app, "http://127.0.0.1:9000?ns=rahoot-36025")

if (import.meta.env.DEV) {
  connectDatabaseEmulator(rtdb, "127.0.0.1", 9000)
}
