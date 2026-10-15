import { getDatabase } from "firebase-admin/database"
import * as crypto from "crypto";

export const createInviteCode = async (length = 6): Promise<string> => {
  const db = getDatabase()
  
  let attempts = 0
  const maxAttempts = 100

  do {
    // Generate secure random PIN
    const min = Math.pow(10, length - 1)
    const max = Math.pow(10, length) - 1
    const result = crypto.randomInt(min, max + 1).toString()

    // Use a transaction to safely reserve the PIN
    const ref = db.ref(`gamesByInviteCode/${result}`)

    const { committed } = await ref.transaction((currentData) => {
        if (currentData !== null) {
            // Already exists, check if expired to allow reuse
            if (currentData.expiresAt > Date.now()) {
                 return undefined; // Abort transaction, code in use
            }
        }

        // Claim the code temporarily until the game sets it up properly
        return {
           reservedAt: Date.now(),
           // Give a short window for createGame to finalize it, instead of a full day
           expiresAt: Date.now() + 5 * 60 * 1000
        };
    });

    if (committed) {
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
