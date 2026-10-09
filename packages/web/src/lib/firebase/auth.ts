import { getAuth, connectAuthEmulator } from "firebase/auth"
import { app } from "./app"

export const auth = getAuth(app)

if (import.meta.env.DEV) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
}
