import { getFunctions, connectFunctionsEmulator } from "firebase/functions"
import { app } from "./app"

export const functions = getFunctions(app)

if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, "127.0.0.1", 5001)
}
