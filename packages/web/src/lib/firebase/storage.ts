import { getStorage, connectStorageEmulator } from "firebase/storage"
import { app } from "./app"

export const storage = getStorage(app)

if (import.meta.env.DEV) {
  connectStorageEmulator(storage, "127.0.0.1", 9199)
}
