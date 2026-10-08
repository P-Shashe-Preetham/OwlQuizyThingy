import { trackEvent } from "../analytics"
import { logger } from "./logger"

export const metrics = {
  // Authentication & Security
  managerAuthSuccess: (socketId: string) => {
    logger.info("Manager authentication successful", { socketId })
    trackEvent("manager_auth_success", { socketId }).catch((err) =>
      logger.error("Failed to track metric", { error: err, metric: "manager_auth_success" })
    )
  },
  managerAuthFailure: (reason: string, ip: string) => {
    logger.warn("Manager authentication failed", { reason, ip })
    trackEvent("manager_auth_failure", { reason, ip }).catch((err) =>
      logger.error("Failed to track metric", { error: err, metric: "manager_auth_failure" })
    )
  },

  // Game Lifecycle
  gameCreated: (gameId: string, quizzId: string) => {
    logger.info("Game created", { gameId, quizzId })
    trackEvent("game_created", { gameId, quizzId }).catch((err) =>
      logger.error("Failed to track metric", { error: err, metric: "game_created" })
    )
  },
  gameStarted: (gameId: string) => {
    logger.info("Game started", { gameId })
    trackEvent("game_started", { gameId }).catch((err) =>
      logger.error("Failed to track metric", { error: err, metric: "game_started" })
    )
  },
  gameEnded: (gameId: string, reason?: string) => {
    logger.info("Game ended", { gameId, reason })
    trackEvent("game_ended", { gameId, reason }).catch((err) =>
      logger.error("Failed to track metric", { error: err, metric: "game_ended" })
    )
  },

  // Player Lifecycle
  playerJoined: (gameId: string, socketId: string, username?: string) => {
    logger.info("Player joined room", { gameId, socketId, username })
    trackEvent("player_joined_room", { gameId, socketId, username }).catch((err) =>
      logger.error("Failed to track metric", { error: err, metric: "player_joined_room" })
    )
  },
  playerDisconnected: (gameId: string, socketId: string, username?: string) => {
    logger.info("Player disconnected", { gameId, socketId, username })
    trackEvent("player_disconnected", { gameId, socketId, username }).catch((err) =>
      logger.error("Failed to track metric", { error: err, metric: "player_disconnected" })
    )
  },

  // Operational & Health
  serverShutdown: (signal: string) => {
    logger.info("Server shutting down", { signal })
    trackEvent("server_shutdown", { signal }).catch((err) =>
      logger.error("Failed to track metric", { error: err, metric: "server_shutdown" })
    )
  },
  firebaseError: (operation: string, error: any) => {
    logger.error("Firebase operation failed", { operation, error: error?.message || error })
    trackEvent("firebase_error", { operation, error: error?.message }).catch((err) =>
      logger.error("Failed to track metric", { error: err, metric: "firebase_error" })
    )
  },
}
