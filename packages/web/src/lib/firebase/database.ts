import { getDatabase, connectDatabaseEmulator } from "firebase/database"
import { app } from "./app"

const databaseUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL

if (!databaseUrl && !import.meta.env.DEV) {
    console.warn("VITE_FIREBASE_DATABASE_URL is not set in production. Database connections may fail if default config is incorrect.")
}

// Only pass databaseUrl if it's explicitly set in the env
export const rtdb = databaseUrl ? getDatabase(app, databaseUrl) : getDatabase(app)

if (import.meta.env.DEV) {
  // Use a different database string to denote emulator usage when running locally if needed, but connectDatabaseEmulator overrides it anyway.
  connectDatabaseEmulator(rtdb, "127.0.0.1", 9000)
}
