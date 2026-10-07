import { Answer, Player, Quizz } from "@rahoot/common/types/game"
import { Server, Socket } from "@rahoot/common/types/game/socket"
import { GAME_STATE, GameState, StatusDataMap } from "@rahoot/common/types/game/status"
import { usernameValidator } from "@rahoot/common/validators/auth"
import Registry from "@rahoot/socket/services/registry"
import { createInviteCode, timeToPoint } from "@rahoot/socket/utils/game"
import sleep from "@rahoot/socket/utils/sleep"
import { v4 as uuid } from "uuid"

const registry = Registry.getInstance()

class Game {
  io: Server

  gameId: string
  manager: {
    id: string
    clientId: string
    connected: boolean
  }
  inviteCode: string
  started: boolean
  currentState: GameState = GAME_STATE.WAITING

  lastBroadcastStatus: { name: GameState; data: StatusDataMap[GameState] } | null =
    null
  managerStatus: { name: GameState; data: StatusDataMap[GameState] } | null = null
  playerStatus: Map<string, { name: GameState; data: StatusDataMap[GameState] }> =
    new Map()

  leaderboard: Player[]
  tempOldLeaderboard: Player[] | null

  quizz: Quizz
  players: Player[]

  round: {
    currentQuestion: number
    playersAnswers: Answer[]
    startTime: number
  }

  cooldown: {
    active: boolean
    ms: number
    timer?: ReturnType<typeof setInterval>
  }

  // Generation guard to cancel stale timer callbacks when round or state changes
  private currentGeneration = 0

  constructor(io: Server, socket: Socket, quizz: Quizz) {
    if (!io) {
      throw new Error("Socket server not initialized")
    }

    this.io = io
    this.gameId = uuid()
    this.manager = {
      id: "",
      clientId: "",
      connected: false,
    }
    this.inviteCode = ""
    this.started = false

    this.lastBroadcastStatus = null
    this.managerStatus = null
    this.playerStatus = new Map()

    this.leaderboard = []
    this.tempOldLeaderboard = null

    this.players = []

    this.round = {
      playersAnswers: [],
      currentQuestion: 0,
      startTime: 0,
    }

    this.cooldown = {
      active: false,
      ms: 0,
    }

    const roomInvite = createInviteCode()
    this.inviteCode = roomInvite
    this.manager = {
      id: socket.id,
      clientId: socket.handshake.auth.clientId,
      connected: true,
    }
    this.quizz = quizz

    socket.join(this.gameId)
    socket.emit("manager:gameCreated", {
      gameId: this.gameId,
      inviteCode: roomInvite,
    })

    console.log(
      `New game created: ${roomInvite} subject: ${this.quizz.subject}`,
    )
  }

  private incrementGeneration(): number {
    this.currentGeneration += 1

    return this.currentGeneration
  }

  private isValidGeneration(gen: number): boolean {
    return gen === this.currentGeneration && this.started
  }

  sendStatus<K extends GameState>(
    socketId: string,
    name: K,
    data: StatusDataMap[K],
  ) {
    this.playerStatus.set(socketId, { name, data })
    this.io.to(socketId).emit("game:status", { name, data })
  }

  broadcastStatus<K extends GameState>(name: K, data: StatusDataMap[K]) {
    this.currentState = name
    this.lastBroadcastStatus = { name, data }
    this.io.to(this.gameId).emit("game:status", { name, data })
  }

  join(socket: Socket, username: string) {
    const result = usernameValidator.safeParse(username)

    if (!result.success) {
      socket.emit("game:errorMessage", result.error.issues[0].message)

      return
    }

    const trimmedUsername = username.trim()

    // Disallow duplicate active or reconnectable usernames in the same game
    const existingPlayer = this.players.find(
      (p) => p.username.toLowerCase() === trimmedUsername.toLowerCase(),
    )

    if (existingPlayer) {
      if (existingPlayer.connected) {
        socket.emit("game:errorMessage", "Username is already taken")

        return
      }

      // If player disconnected, require matching client ID to reclaim identity
      const { clientId } = socket.handshake.auth

      if (existingPlayer.clientId !== clientId) {
        socket.emit("game:errorMessage", "Username belongs to a disconnected player")

        return
      }
    }

    socket.join(this.gameId)

    const playerData = {
      id: socket.id,
      clientId: socket.handshake.auth.clientId,
      connected: true,
      username: trimmedUsername,
      points: 0,
    }

    this.players.push(playerData)

    this.io.to(this.manager.id).emit("manager:newPlayer", playerData)
    this.io.to(this.gameId).emit("game:totalPlayers", this.players.length)

    socket.emit("game:successJoin", this.gameId)
  }

  kickPlayer(socket: Socket, playerId: string) {
    if (this.manager.id !== socket.id) {
      return
    }

    const player = this.players.find((p) => p.id === playerId)

    if (!player) {
      return
    }

    this.players = this.players.filter((p) => p.id !== playerId)
    this.playerStatus.delete(playerId)

    this.io.in(playerId).socketsLeave(this.gameId)
    this.io
      .to(player.id)
      .emit("game:reset", "You have been kicked by the manager")
    this.io.to(this.manager.id).emit("manager:playerKicked", player.id)

    this.io.to(this.gameId).emit("game:totalPlayers", this.players.length)
  }

  reconnect(socket: Socket) {
    const { clientId } = socket.handshake.auth
    const isManager = this.manager.clientId === clientId

    if (isManager) {
      this.reconnectManager(socket)
    } else {
      this.reconnectPlayer(socket)
    }
  }

  private reconnectManager(socket: Socket) {
    if (this.manager.connected) {
      socket.emit("game:reset", "Manager already connected")

      return
    }

    socket.join(this.gameId)
    this.manager.id = socket.id
    this.manager.connected = true

    const status = this.managerStatus ||
      this.lastBroadcastStatus || {
        name: GAME_STATE.WAITING,
        data: { text: "Waiting for players" },
      }

    socket.emit("manager:successReconnect", {
      gameId: this.gameId,
      currentQuestion: {
        current: this.round.currentQuestion + 1,
        total: this.quizz.questions.length,
      },
      status,
      players: this.players,
    })
    socket.emit("game:totalPlayers", this.players.length)

    registry.reactivateGame(this.gameId)
    console.log(`Manager reconnected to game ${this.inviteCode}`)
  }

  private reconnectPlayer(socket: Socket) {
    const { clientId } = socket.handshake.auth
    const player = this.players.find((p) => p.clientId === clientId)

    if (!player) {
      return
    }

    if (player.connected) {
      socket.emit("game:reset", "Player already connected")

      return
    }

    socket.join(this.gameId)

    const oldSocketId = player.id
    player.id = socket.id
    player.connected = true

    const status = this.playerStatus.get(oldSocketId) ||
      this.lastBroadcastStatus || {
        name: GAME_STATE.WAITING,
        data: { text: "Waiting for players" },
      }

    if (this.playerStatus.has(oldSocketId)) {
      const oldStatus = this.playerStatus.get(oldSocketId)!
      this.playerStatus.delete(oldSocketId)
      this.playerStatus.set(socket.id, oldStatus)
    }

    socket.emit("player:successReconnect", {
      gameId: this.gameId,
      currentQuestion: {
        current: this.round.currentQuestion + 1,
        total: this.quizz.questions.length,
      },
      status,
      player: {
        username: player.username,
        points: player.points,
      },
    })
    socket.emit("game:totalPlayers", this.players.length)
    console.log(
      `Player ${player.username} reconnected to game ${this.inviteCode}`,
    )
  }

  startCooldown(seconds: number): Promise<void> {
    this.abortCooldown()

    this.cooldown.active = true
    let count = seconds - 1

    return new Promise<void>((resolve) => {
      this.cooldown.timer = setInterval(() => {
        if (!this.cooldown.active || count <= 0) {
          this.abortCooldown()
          resolve()

          return
        }

        this.io.to(this.gameId).emit("game:cooldown", count)
        count -= 1
      }, 1000)
    })
  }

  abortCooldown() {
    if (this.cooldown.timer) {
      clearInterval(this.cooldown.timer)
      this.cooldown.timer = undefined
    }

    this.cooldown.active = false
  }

  async start(socket: Socket) {
    if (this.manager.id !== socket.id) {
      return
    }

    if (this.started) {
      return
    }

    if (this.players.length === 0) {
      socket.emit("game:errorMessage", "No players connected")

      return
    }

    this.started = true
    const gen = this.incrementGeneration()

    this.broadcastStatus(GAME_STATE.SHOW_START, {
      time: 3,
      subject: this.quizz.subject,
    })

    await sleep(3)

    if (!this.isValidGeneration(gen)) {
      return
    }

    this.io.to(this.gameId).emit("game:startCooldown")
    await this.startCooldown(3)

    if (!this.isValidGeneration(gen)) {
      return
    }

    this.newRound()
  }

  async newRound() {
    const gen = this.incrementGeneration()
    const question = this.quizz.questions[this.round.currentQuestion]

    if (!this.started || !question) {
      return
    }

    this.playerStatus.clear()

    this.io.to(this.gameId).emit("game:updateQuestion", {
      current: this.round.currentQuestion + 1,
      total: this.quizz.questions.length,
    })

    this.managerStatus = null
    this.broadcastStatus(GAME_STATE.SHOW_PREPARED, {
      totalAnswers: question.answers.length,
      questionNumber: this.round.currentQuestion + 1,
    })

    await sleep(2)

    if (!this.isValidGeneration(gen)) {
      return
    }

    this.broadcastStatus(GAME_STATE.SHOW_QUESTION, {
      question: question.question,
      image: question.image,
      cooldown: question.cooldown,
    })

    await sleep(question.cooldown)

    if (!this.isValidGeneration(gen)) {
      return
    }

    this.round.startTime = Date.now()

    this.broadcastStatus(GAME_STATE.SELECT_ANSWER, {
      type: question.type,
      question: question.question,
      answers: question.answers,
      image: question.image,
      video: question.video,
      audio: question.audio,
      time: question.time,
      totalPlayer: this.players.length,
    })

    await this.startCooldown(question.time)

    if (!this.isValidGeneration(gen)) {
      return
    }

    this.showResults(question)
  }

  showResults(question: any) {
    this.currentState = GAME_STATE.SHOW_RESULT

    const oldLeaderboard =
      this.leaderboard.length === 0
        ? this.players.map((p) => ({ ...p }))
        : this.leaderboard.map((p) => ({ ...p }))

    const totalType = this.round.playersAnswers.reduce(
      (acc: Record<string | number, number>, { answerId }) => {
        acc[answerId] = (acc[answerId] || 0) + 1

        return acc
      },
      {},
    )

    const sortedPlayers = this.players
      .map((player) => {
        const playerAnswer = this.round.playersAnswers.find(
          (a) => a.playerId === player.id,
        )

        let isCorrect = false

        if (playerAnswer) {
          if (question.type === "type-answer") {
            isCorrect = question.answers.some(
              (a: string) =>
                a.trim().toLowerCase() ===
                String(playerAnswer.answerId).trim().toLowerCase(),
            )
          } else {
            isCorrect = playerAnswer.answerId === question.solution
          }
        }

        const points =
          playerAnswer && isCorrect ? Math.round(playerAnswer.points) : 0

        player.points += points

        return { ...player, lastCorrect: isCorrect, lastPoints: points }
      })
      .sort((a, b) => b.points - a.points)

    this.players = sortedPlayers

    sortedPlayers.forEach((player, index) => {
      const rank = index + 1
      const aheadPlayer = sortedPlayers[index - 1]

      this.sendStatus(player.id, GAME_STATE.SHOW_RESULT, {
        correct: player.lastCorrect,
        message: player.lastCorrect ? "Nice!" : "Too bad",
        points: player.lastPoints,
        myPoints: player.points,
        rank,
        aheadOfMe: aheadPlayer ? aheadPlayer.username : null,
      })
    })

    this.sendStatus(this.manager.id, GAME_STATE.SHOW_RESPONSES, {
      type: question.type,
      question: question.question,
      responses: totalType,
      correct:
        question.type === "type-answer" ? question.answers : question.solution,
      answers: question.answers,
      image: question.image,
    })

    this.leaderboard = sortedPlayers
    this.tempOldLeaderboard = oldLeaderboard

    this.round.playersAnswers = []
  }

  selectAnswer(socket: Socket, answerId: number | string) {
    // Answer submission allowed ONLY during SELECT_ANSWER phase
    if (this.currentState !== GAME_STATE.SELECT_ANSWER) {
      socket.emit("game:errorMessage", "Answers are not currently accepted")

      return
    }

    const player = this.players.find((p) => p.id === socket.id)
    const question = this.quizz.questions[this.round.currentQuestion]

    if (!player || !question) {
      return
    }

    // Check for duplicate answer submission
    if (this.round.playersAnswers.some((p) => p.playerId === socket.id)) {
      socket.emit("game:errorMessage", "Answer already submitted")

      return
    }

    this.round.playersAnswers.push({
      playerId: player.id,
      answerId,
      points: timeToPoint(this.round.startTime, question.time),
    })

    this.sendStatus(socket.id, GAME_STATE.WAIT, {
      text: "Waiting for the players to answer",
    })

    socket
      .to(this.gameId)
      .emit("game:playerAnswer", this.round.playersAnswers.length)

    this.io.to(this.gameId).emit("game:totalPlayers", this.players.length)
  }

  nextRound(socket: Socket) {
    if (!this.started || socket.id !== this.manager.id) {
      return
    }

    if (!this.quizz.questions[this.round.currentQuestion + 1]) {
      return
    }

    this.round.currentQuestion += 1
    this.newRound()
  }

  abortRound(socket: Socket) {
    if (!this.started || socket.id !== this.manager.id) {
      return
    }

    this.started = false
    this.incrementGeneration()
    this.abortCooldown()

    this.broadcastStatus(GAME_STATE.CANCELLED, {
      reason: "Game aborted by manager",
    })
    this.io.to(this.gameId).emit("game:reset", "Game aborted by manager")
  }

  showLeaderboard() {
    const isLastRound =
      this.round.currentQuestion + 1 === this.quizz.questions.length

    if (isLastRound) {
      this.started = false
      this.incrementGeneration()

      this.broadcastStatus(GAME_STATE.FINISHED, {
        subject: this.quizz.subject,
        top: this.leaderboard.slice(0, 3),
      })

      return
    }

    const oldLeaderboard = this.tempOldLeaderboard
      ? this.tempOldLeaderboard
      : this.leaderboard

    this.sendStatus(this.manager.id, GAME_STATE.SHOW_LEADERBOARD, {
      oldLeaderboard: oldLeaderboard.slice(0, 5),
      leaderboard: this.leaderboard.slice(0, 5),
    })

    this.tempOldLeaderboard = null
  }
}

export default Game
