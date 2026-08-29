import { Socket } from "@rahoot/common/types/game/socket"
import Game from "@rahoot/socket/services/game"
import Registry from "@rahoot/socket/services/registry"

export const withGame = (
  gameId: string | undefined,
  socket: Socket,
  callback: (_game: Game) => void
): void => {
  if (!gameId) {
    socket.emit("game:errorMessage", "Game not found")

    return
  }

  const registry = Registry.getInstance()
  const game = registry.getGameById(gameId)

  if (!game) {
    socket.emit("game:errorMessage", "Game not found")

    return
  }

  callback(game)
}

export const createInviteCode = (length = 6): string => {
  const characters = "0123456789"
  const Registry = require("@rahoot/socket/services/registry").default
  const registry = Registry.getInstance()
  
  let result = ""
  let attempts = 0
  const maxAttempts = 100

  do {
    result = ""
    for (let i = 0; i < length; i += 1) {
      const randomIndex = Math.floor(Math.random() * characters.length)
      result += characters.charAt(randomIndex)
    }
    attempts += 1
  } while (registry.getGameByInviteCode(result) && attempts < maxAttempts)

  return result
}

export const timeToPoint = (startTime: number, seconds: number): number => {
  const elapsedSeconds = (Date.now() - startTime) / 1000

  // Kahoot official formula ensures minimum 500 points for correct answer
  const maxPoints = 1000
  const decrement = maxPoints / (2 * seconds)
  let points = maxPoints - (decrement * elapsedSeconds)
  
  points = Math.round(Math.max(500, Math.min(1000, points)))

  return points
}
