import { logger } from "./lib/observability/logger"
import { metrics } from "./lib/observability/metrics"
import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import { Server } from "@rahoot/common/types/game/socket"
import {
  gameIdSchema,
  inviteCodeSchema,
  kickPlayerSchema,
  managerAuthSchema,
  playerLoginSchema,
  quizzSchema,
  selectedAnswerSchema,
} from "@rahoot/common/validators/game"
import Config from "@rahoot/socket/services/config"
import FirebaseService from "@rahoot/socket/services/firebase"
import Game from "@rahoot/socket/services/game"
import Registry from "@rahoot/socket/services/registry"
import { withGame } from "@rahoot/socket/utils/game"
import http from "http"
import { Server as ServerIO } from "socket.io"

const WS_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001
const MAX_GAMES = 50
const AUTH_RATE_LIMIT_WINDOW_MS = 60_000
const AUTH_MAX_ATTEMPTS = 5
const MAX_PAYLOAD_SIZE = 1e6

// Track auth attempts per IP for rate limiting
const authAttempts = new Map<string, { count: number; resetAt: number }>()

// Track authenticated manager sockets
const authenticatedManagers = new Set<string>()

const httpServer = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/health/live") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({
        status: "ok",
        games: registry.getGameCount(),
        emptyGames: registry.getEmptyGameCount(),
        uptime: process.uptime(),
      }),
    )


return
  }

  if (req.url === "/health/ready") {
    const isFirebaseConfigured = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT)
    const isFirebaseReady = isFirebaseConfigured ? FirebaseService.isInitialized() : true

    if (isFirebaseReady) {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ status: "ready" }))
    } else {
      res.writeHead(503, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ status: "unavailable", reason: "Firebase initializing" }))
    }


return
  }

  res.writeHead(404)
  res.end()
})

const corsOrigin = process.env.CORS_ORIGIN || "*"

const io: Server = new ServerIO(httpServer, {
  path: "/ws",
  maxHttpBufferSize: MAX_PAYLOAD_SIZE,
  cors: {
    origin: corsOrigin === "*" ? "*" : corsOrigin.split(",").map((o) => o.trim()),
    methods: ["GET", "POST"],
  },
  pingInterval: 15000,
  pingTimeout: 10000,
})

Config.init()

const registry = Registry.getInstance()

logger.info(`Socket server running on port ${WS_PORT}`)
httpServer.listen(WS_PORT)

// Helper: check if socket is an authenticated manager
function isAuthenticatedManager(socketId: string): boolean {
  return authenticatedManagers.has(socketId)
}

// Helper: rate limit check for auth attempts
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = authAttempts.get(ip)

  if (!entry || now > entry.resetAt) {
    authAttempts.set(ip, {
      count: 1,
      resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS,
    })

    return false
  }

  entry.count += 1

  return entry.count > AUTH_MAX_ATTEMPTS
}

// Helper: get combined quiz list (Firebase + local)
async function getCombinedQuizList(): Promise<QuizzWithId[]> {
  const localQuizzes = Config.quizz()
  let firebaseQuizzes: QuizzWithId[] = []

  if (FirebaseService.isInitialized()) {
    firebaseQuizzes = await FirebaseService.getQuizzes()
  }

  const firebaseIds = new Set(firebaseQuizzes.map((q) => q.id))

  return [
    ...firebaseQuizzes,
    ...localQuizzes.filter((q) => !firebaseIds.has(q.id)),
  ]
}

io.on("connection", (socket) => {
  logger.info(
    `A user connected: socketId: ${socket.id}, clientId: ${socket.handshake.auth.clientId}`,
  )

  socket.on("player:reconnect", (payload) => {
    const parse = gameIdSchema.safeParse(payload?.gameId)

    if (!parse.success) {
      socket.emit("game:reset", "Invalid payload")

      return
    }

    const game = registry.getPlayerGame(
      parse.data,
      socket.handshake.auth.clientId,
    )

    if (game) {
      game.reconnect(socket)

      return
    }

    socket.emit("game:reset", "Game not found")
  })

  socket.on("manager:reconnect", (payload) => {
    const parse = gameIdSchema.safeParse(payload?.gameId)

    if (!parse.success) {
      socket.emit("game:reset", "Invalid payload")

      return
    }

    const game = registry.getManagerGame(
      parse.data,
      socket.handshake.auth.clientId,
    )

    if (game) {
      game.reconnect(socket)

      return
    }

    socket.emit("game:reset", "Game expired")
  })

  socket.on("manager:auth", async (password) => {
    try {
      const parse = managerAuthSchema.safeParse(password)

      if (!parse.success) {
        socket.emit("manager:errorMessage", "Invalid password payload")

        return
      }

      // Rate limiting
      const ip = socket.handshake.address

      if (isRateLimited(ip)) {
        socket.emit(
          "manager:errorMessage",
          "Too many attempts. Please try again later.",
        )

        return
      }

      const config = Config.game()

      if (!config.managerPassword || config.managerPassword === "PASSWORD") {
        socket.emit(
          "manager:errorMessage",
          "Manager password is not configured",
        )

        return
      }

      if (parse.data !== config.managerPassword) {
        socket.emit("manager:errorMessage", "Invalid password")
        metrics.managerAuthFailure("invalid_password", socket.handshake.address)

        return
      }

      // Mark this socket as authenticated manager
      authenticatedManagers.add(socket.id)
      metrics.managerAuthSuccess(socket.id)

      const combinedQuizzList = await getCombinedQuizList()

      socket.emit("manager:quizzList", combinedQuizzList)
    } catch (error) {
      logger.error("Failed to read game config:", { error })
      socket.emit("manager:errorMessage", "Failed to read game config")
    }
  })

  socket.on("manager:saveQuizz", async (quizz) => {
    if (!isAuthenticatedManager(socket.id)) {
      socket.emit("manager:errorMessage", "Unauthorized")

      return
    }

    const parse = quizzSchema.safeParse(quizz)

    if (!parse.success) {
      socket.emit(
        "manager:errorMessage",
        `Validation error: ${parse.error.issues[0].message}`,
      )

      return
    }

    try {
      if (FirebaseService.isInitialized()) {
        const id = await FirebaseService.saveQuizz(
          parse.data,
          (quizz as any)?.id,
        )

        socket.emit("manager:quizzSaved", { id, subject: parse.data.subject })
      } else {
        socket.emit(
          "manager:errorMessage",
          "Firebase not configured. Quiz not saved.",
        )
      }
    } catch (error) {
      logger.error("Failed to save quiz:", { error })
      socket.emit("manager:errorMessage", "Failed to save quiz")
    }
  })

  socket.on("manager:deleteQuizz", async (id) => {
    if (!isAuthenticatedManager(socket.id)) {
      socket.emit("manager:errorMessage", "Unauthorized")

      return
    }

    const parse = gameIdSchema.safeParse(id)

    if (!parse.success) {
      socket.emit("manager:errorMessage", "Invalid quiz ID")

      return
    }

    try {
      if (FirebaseService.isInitialized()) {
        await FirebaseService.deleteQuizz(parse.data)
      }

      // Return combined list (Firebase + local) — not just Firebase
      const combinedQuizzList = await getCombinedQuizList()

      socket.emit("manager:quizzList", combinedQuizzList)
    } catch (error) {
      logger.error("Failed to delete quiz:", { error })
      socket.emit("manager:errorMessage", "Failed to delete quiz")
    }
  })

  socket.on("game:create", async (quizzId) => {
    if (!isAuthenticatedManager(socket.id)) {
      socket.emit(
        "game:errorMessage",
        "Unauthorized. Please authenticate first.",
      )

      return
    }

    const parse = gameIdSchema.safeParse(quizzId)

    if (!parse.success) {
      socket.emit("game:errorMessage", "Invalid quiz ID")

      return
    }

    if (registry.getGameCount() >= MAX_GAMES) {
      socket.emit(
        "game:errorMessage",
        "Server is at capacity. Please try again later.",
      )

      return
    }

    let quizz: Quizz | null = null

    if (FirebaseService.isInitialized()) {
      const quizzes = await FirebaseService.getQuizzes()

      quizz = quizzes.find((q) => q.id === parse.data) ?? null
    }

    if (!quizz) {
      const quizzList = Config.quizz()

      quizz = quizzList.find((q) => q.id === parse.data) ?? null
    }

    if (!quizz) {
      socket.emit("game:errorMessage", "Quiz not found")

      return
    }

    const game = new Game(io, socket, quizz)

    registry.addGame(game)
    metrics.gameCreated(game.gameId, parse.data)
  })

  socket.on("player:join", (inviteCode) => {
    const result = inviteCodeSchema.safeParse(inviteCode)

    if (!result.success) {
      socket.emit("game:errorMessage", result.error.issues[0].message)

      return
    }

    const game = registry.getGameByInviteCode(result.data)

    if (!game) {
      socket.emit("game:errorMessage", "Game not found")

      return
    }

    socket.emit("game:successRoom", game.gameId)
    metrics.playerJoined(game.gameId, socket.id)
  })

  socket.on("player:login", (payload) => {
    const parse = playerLoginSchema.safeParse(payload)

    if (!parse.success) {
      socket.emit("game:errorMessage", parse.error.issues[0].message)

      return
    }

    withGame(parse.data.gameId, socket, (game) =>
      game.join(socket, parse.data.data.username),
    )
  })

  socket.on("manager:kickPlayer", (payload) => {
    if (!isAuthenticatedManager(socket.id)) {
      socket.emit("manager:errorMessage", "Unauthorized")

      return
    }

    const parse = kickPlayerSchema.safeParse(payload)

    if (!parse.success) {
      socket.emit("manager:errorMessage", "Invalid payload")

      return
    }

    withGame(parse.data.gameId, socket, (game) =>
      game.kickPlayer(socket, parse.data.playerId),
    )
  })

  socket.on("manager:startGame", (payload) => {
    if (!isAuthenticatedManager(socket.id)) {
      socket.emit("manager:errorMessage", "Unauthorized")

      return
    }

    const parse = gameIdSchema.safeParse(payload?.gameId)

    if (!parse.success) {
      socket.emit("manager:errorMessage", "Invalid game ID")

      return
    }

    withGame(parse.data, socket, (game) => game.start(socket))
  })

  socket.on("player:selectedAnswer", (payload) => {
    const parse = selectedAnswerSchema.safeParse(payload)

    if (!parse.success) {
      socket.emit("game:errorMessage", "Invalid answer payload")

      return
    }

    withGame(parse.data.gameId, socket, (game) =>
      game.selectAnswer(socket, parse.data.data.answerKey),
    )
  })

  socket.on("manager:abortQuiz", (payload) => {
    if (!isAuthenticatedManager(socket.id)) {
      socket.emit("manager:errorMessage", "Unauthorized")

      return
    }

    const parse = gameIdSchema.safeParse(payload?.gameId)

    if (!parse.success) {
      socket.emit("manager:errorMessage", "Invalid game ID")

      return
    }

    withGame(parse.data, socket, (game) => game.abortRound(socket))
  })

  socket.on("manager:nextQuestion", (payload) => {
    if (!isAuthenticatedManager(socket.id)) {
      socket.emit("manager:errorMessage", "Unauthorized")

      return
    }

    const parse = gameIdSchema.safeParse(payload?.gameId)

    if (!parse.success) {
      socket.emit("manager:errorMessage", "Invalid game ID")

      return
    }

    withGame(parse.data, socket, (game) => game.nextRound(socket))
  })

  socket.on("manager:showLeaderboard", (payload) => {
    if (!isAuthenticatedManager(socket.id)) {
      socket.emit("manager:errorMessage", "Unauthorized")

      return
    }

    const parse = gameIdSchema.safeParse(payload?.gameId)

    if (!parse.success) {
      socket.emit("manager:errorMessage", "Invalid game ID")

      return
    }

    withGame(parse.data, socket, (game) => game.showLeaderboard())
  })

  socket.on("disconnect", () => {
    // Clean up authenticated manager tracking
    authenticatedManagers.delete(socket.id)

    const managerGame = registry.getGameByManagerSocketId(socket.id)

    if (managerGame) {
      managerGame.manager.connected = false
      registry.markGameAsEmpty(managerGame)

      if (!managerGame.started) {
        managerGame.abortCooldown()
        io.to(managerGame.gameId).emit("game:reset", "Manager disconnected")
        registry.removeGame(managerGame.gameId)

        return
      }
    }

    const game = registry.getGameByPlayerSocketId(socket.id)

    if (!game) {
      return
    }

    const player = game.players.find((p) => p.id === socket.id)

    if (!player) {
      return
    }

    if (!game.started) {
      game.players = game.players.filter((p) => p.id !== socket.id)
      io.to(game.manager.id).emit("manager:removePlayer", player.id)
      io.to(game.gameId).emit("game:totalPlayers", game.players.length)

      return
    }

    player.connected = false
    io.to(game.gameId).emit("game:totalPlayers", game.players.length)
  })
})


function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`, { signal })
  metrics.serverShutdown(signal)

  // Notify all connected clients
  io.emit("game:reset", "Server is shutting down for maintenance")

  // Force stop all active games to clear timers/cooldowns
  for (const game of registry.getAllGames()) {
    game.abortCooldown()
  }

  // Close sockets
  io.disconnectSockets()

  // Give time for messages to be sent
  setTimeout(() => {
    registry.cleanup()
    httpServer.close((err) => {
      logger.info("HTTP server closed", { error: err })
      process.exit(err ? 1 : 0)
    })
  }, 1000)
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
