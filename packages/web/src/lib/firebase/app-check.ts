import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check"
import { app } from "./app"

export const initAppCheck = () => {
  if (import.meta.env.DEV) {
    // @ts-ignore
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
  }

  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"

  try {
    return initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaKey),
      isTokenAutoRefreshEnabled: true
    })
  } catch (e) {
    console.error("Failed to initialize App Check:", e)


return null
  }
}
