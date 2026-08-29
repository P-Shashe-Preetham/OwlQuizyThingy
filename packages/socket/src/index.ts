import { Server } from "@rahoot/common/types/game/socket"
import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import { inviteCodeValidator } from "@rahoot/common/validators/auth"
import Config from "@rahoot/socket/services/config"
import FirebaseService from "@rahoot/socket/services/firebase"
import Game from "@rahoot/socket/services/game"
import Registry from "@rahoot/socket/services/registry"
import { withGame } from "@rahoot/socket/utils/game"
import { Server as ServerIO } from "socket.io"
import http from "http"

const WS_PORT = 3001
const MAX_GAMES = 50
const MAX_PLAYERS_PER_GAME = 100
const AUTH_RATE_LIMIT_WINDOW_MS = 60_000
const AUTH_MAX_ATTEMPTS = 5

// Track auth attempts per IP for rate limiting
const authAttempts = new Map<string, { count: number; resetAt: number }>()

// Track authenticated manager sockets
const authenticatedManagers = new Set<string>()

const httpServer = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({
      status: "ok",
      games: registry.getGameCount(),
      emptyGames: registry.getEmptyGameCount(),
      uptime: process.uptime(),
    }))
    return
  }
  res.writeHead(404)
  res.end()
})

const io: Server = new ServerIO(httpServer, {
  path: "/ws",
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
  pingInterval: 15000,
  pingTimeout: 10000,
})
Config.init()

const registry = Registry.getInstance()

console.log(`Socket server running on port ${WS_PORT}`)
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
    authAttempts.set(ip, { count: 1, resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS })
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
  console.log(
    `A user connected: socketId: ${socket.id}, clientId: ${socket.handshake.auth.clientId}`,
  )

  socket.on("player:reconnect", ({ gameId }) => {
    const game = registry.getPlayerGame(gameId, socket.handshake.auth.clientId)

    if (game) {
      game.reconnect(socket)

      return
    }

    socket.emit("game:reset", "Game not found")
  })

  socket.on("manager:reconnect", ({ gameId }) => {
    const game = registry.getManagerGame(gameId, socket.handshake.auth.clientId)

    if (game) {
      game.reconnect(socket)

      return
    }

    socket.emit("game:reset", "Game expired")
  })

  socket.on("manager:auth", async (password) => {
    try {
      // Rate limiting
      const ip = socket.handshake.address
      if (isRateLimited(ip)) {
        socket.emit("manager:errorMessage", "Too many attempts. Please try again later.")
        return
      }

      const config = Config.game()

      if (config.managerPassword === "PASSWORD") {
        socket.emit("manager:errorMessage", "Manager password is not configured")
        return
      }

      if (password !== config.managerPassword) {
        socket.emit("manager:errorMessage", "Invalid password")
        return
      }

      // Mark this socket as authenticated manager
      authenticatedManagers.add(socket.id)

      const combinedQuizzList = await getCombinedQuizList()
      socket.emit("manager:quizzList", combinedQuizzList)
    } catch (error) {
      console.error("Failed to read game config:", error)
      socket.emit("manager:errorMessage", "Failed to read game config")
    }
  })

  socket.on("manager:saveQuizz", async (quizz) => {
    if (!isAuthenticatedManager(socket.id)) {
      socket.emit("manager:errorMessage", "Unauthorized")
      return
    }

    try {
      if (FirebaseService.isInitialized()) {
        const id = await FirebaseService.saveQuizz(quizz)
        socket.emit("manager:quizzSaved", { id, subject: quizz.subject })
      } else {
        socket.emit("manager:errorMessage", "Firebase not configured. Quiz not saved.")
      }
    } catch (error) {
      console.error("Failed to save quiz:", error)
      socket.emit("manager:errorMessage", "Failed to save quiz")
    }
  })

  socket.on("manager:deleteQuizz", async (id) => {
    if (!isAuthenticatedManager(socket.id)) {
      socket.emit("manager:errorMessage", "Unauthorized")
      return
    }

    try {
      if (FirebaseService.isInitialized()) {
        await FirebaseService.deleteQuizz(id)
      }
      // Return combined list (Firebase + local) — not just Firebase
      const combinedQuizzList = await getCombinedQuizList()
      socket.emit("manager:quizzList", combinedQuizzList)
    } catch (error) {
      console.error("Failed to delete quiz:", error)
      socket.emit("manager:errorMessage", "Failed to delete quiz")
    }
  })

  socket.on("game:create", async (quizzId) => {
    if (!isAuthenticatedManager(socket.id)) {
      socket.emit("game:errorMessage", "Unauthorized. Please authenticate first.")
      return
    }

    if (registry.getGameCount() >= MAX_GAMES) {
      socket.emit("game:errorMessage", "Server is at capacity. Please try again later.")
      return
    }

    let quizz: Quizz | null = null
    
    if (FirebaseService.isInitialized()) {
      const quizzes = await FirebaseService.getQuizzes()
      quizz = quizzes.find(q => q.id === quizzId) ?? null
    }
    
    if (!quizz) {
      const quizzList = Config.quizz()
      quizz = quizzList.find((q) => q.id === quizzId) ?? null
    }

    if (!quizz) {
      socket.emit("game:errorMessage", "Quiz not found")
      return
    }

    const game = new Game(io, socket, quizz)
    registry.addGame(game)
  })

  socket.on("player:join", (inviteCode) => {
    const result = inviteCodeValidator.safeParse(inviteCode)

    if (result.error) {
      socket.emit("game:errorMessage", result.error.issues[0].message)

      return
    }

    const game = registry.getGameByInviteCode(inviteCode)

    if (!game) {
      socket.emit("game:errorMessage", "Game not found")

      return
    }

    socket.emit("game:successRoom", game.gameId)
  })

  socket.on("player:login", ({ gameId, data }) =>
    withGame(gameId, socket, (game) => game.join(socket, data.username)),
  )

  socket.on("manager:kickPlayer", ({ gameId, playerId }) =>
    withGame(gameId, socket, (game) => game.kickPlayer(socket, playerId)),
  )

  socket.on("manager:startGame", ({ gameId }) =>
    withGame(gameId, socket, (game) => game.start(socket)),
  )

  socket.on("player:selectedAnswer", ({ gameId, data }) =>
    withGame(gameId, socket, (game) =>
      game.selectAnswer(socket, data.answerKey),
    ),
  )

  socket.on("manager:abortQuiz", ({ gameId }) =>
    withGame(gameId, socket, (game) => game.abortRound(socket)),
  )

  socket.on("manager:nextQuestion", ({ gameId }) =>
    withGame(gameId, socket, (game) => game.nextRound(socket)),
  )

  socket.on("manager:showLeaderboard", ({ gameId }) =>
    withGame(gameId, socket, (game) => game.showLeaderboard()),
  )

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
  console.log(`Received ${signal}. Shutting down gracefully...`)

  // Notify all connected clients
  io.emit("game:reset", "Server is shutting down for maintenance")

  // Give time for messages to be sent
  setTimeout(() => {
    Registry.getInstance().cleanup()
    httpServer.close()
    process.exit(0)
  }, 1000)
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
