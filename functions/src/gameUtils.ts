import { getDatabase } from "firebase-admin/database"

export const createInviteCode = async (length = 6): Promise<string> => {
  const characters = "0123456789"
  const db = getDatabase()
  
  let result = ""
  let attempts = 0
  const maxAttempts = 100

  do {
    result = ""
    for (let i = 0; i < length; i += 1) {
      const randomIndex = Math.floor(Math.random() * characters.length)
      result += characters.charAt(randomIndex)
    }

    // Check if code exists in RTDB
    const snapshot = await db.ref(`gamesByInviteCode/${result}`).get()
    if (!snapshot.exists()) {
      return result
    }

    attempts += 1
  } while (attempts < maxAttempts)

  throw new Error("Failed to generate unique invite code")
}

export const timeToPoint = (startTime: number, seconds: number): number => {
  const elapsedSeconds = Math.max(0, (Date.now() - startTime) / 1000)

  // Kahoot official formula ensures minimum 500 points for correct answer
  const maxPoints = 1000
  const decrement = maxPoints / (2 * Math.max(1, seconds))
  let points = maxPoints - (decrement * elapsedSeconds)
  
  points = Math.round(Math.max(500, Math.min(1000, points)))

  return points
}
