import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import Game from "../services/game"
import { GAME_STATE } from "@rahoot/common/types/game/status"

vi.mock("../services/registry", () => ({
  default: {
    getInstance: vi.fn(() => ({
      getGameByInviteCode: vi.fn(() => undefined),
      reactivateGame: vi.fn(),
    })),
  },
}))

const mockQuiz = {
  id: "q-1",
  subject: "Test Quiz",
  questions: [
    {
      question: "Q1",
      type: "quiz" as const,
      answers: ["A", "B", "C", "D"],
      solution: 0,
      cooldown: 2,
      time: 5
    }
  ]
}

describe("Game Complete Test Matrix", () => {
  let mockIo: any = {}
  let mockSocket: any = {}

  beforeEach(() => {
    vi.useFakeTimers()
    mockIo = { to: vi.fn().mockReturnThis(), emit: vi.fn(), in: vi.fn().mockReturnThis(), socketsLeave: vi.fn() }
    mockSocket = { id: "m-sock", handshake: { auth: { clientId: "m-client" } }, join: vi.fn(), emit: vi.fn(), to: vi.fn().mockReturnThis() }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("handles duplicate manager reconnect attempts safely", () => {
    const game = new Game(mockIo, mockSocket, mockQuiz as any)
    game.manager.connected = true

    const reconnectSocket = { id: "new-sock", handshake: { auth: { clientId: "m-client" } }, emit: vi.fn() } as any
    game.reconnect(reconnectSocket)

    expect(reconnectSocket.emit).toHaveBeenCalledWith("game:reset", "Manager already connected")
  })

  it("handles duplicate player reconnect attempts safely", () => {
    const game = new Game(mockIo, mockSocket, mockQuiz as any)
    game.players = [{ id: "p1", clientId: "c1", connected: true, username: "player1", points: 0 }]

    const reconnectSocket = { id: "new-sock", handshake: { auth: { clientId: "c1" } }, emit: vi.fn() } as any
    game.reconnect(reconnectSocket)

    expect(reconnectSocket.emit).toHaveBeenCalledWith("game:reset", "Player already connected")
  })

  it("reconnects manager successfully", () => {
    const game = new Game(mockIo, mockSocket, mockQuiz as any)
    game.manager.connected = false

    const reconnectSocket = { id: "new-sock", handshake: { auth: { clientId: "m-client" } }, emit: vi.fn(), join: vi.fn() } as any
    game.reconnect(reconnectSocket)

    expect(game.manager.id).toBe("new-sock")
    expect(game.manager.connected).toBe(true)
    expect(reconnectSocket.emit).toHaveBeenCalledWith("manager:successReconnect", expect.any(Object))
  })

  it("fast-forwards round correctly when all players answer", async () => {
    const game = new Game(mockIo, mockSocket, mockQuiz as any)
    game.players = [{ id: "p1", clientId: "c1", connected: true, username: "player1", points: 0 }]
    game.started = true
    game.currentState = GAME_STATE.SELECT_ANSWER

    const pSocket = { id: "p1", emit: vi.fn(), to: vi.fn().mockReturnThis() } as any

    let isCooldownActive = true

    game.startCooldown(5).then(() => {
      isCooldownActive = false
    })

    game.selectAnswer(pSocket, 0)

    // Allow microtasks to flush
    await Promise.resolve()

    expect(isCooldownActive).toBe(false)
  })

  it("does not start with zero players", async () => {
    const game = new Game(mockIo, mockSocket, mockQuiz as any)

    game.start(mockSocket)
    expect(game.started).toBe(false)
    expect(mockSocket.emit).toHaveBeenCalledWith("game:errorMessage", "No players connected")
  })

  it("cannot start twice", async () => {
    const game = new Game(mockIo, mockSocket, mockQuiz as any)
    game.players = [{ id: "p1", clientId: "c1", connected: true, username: "player1", points: 0 }]

    // Simulate started
    game.started = true
    game.start(mockSocket)
    // If it attempts to start again it would emit SHOW_START, but it should return early
    expect(mockIo.to).not.toHaveBeenCalledWith("game:status", expect.any(Object))
  })

  it("ignores answers after timeout", async () => {
    const game = new Game(mockIo, mockSocket, mockQuiz as any)
    game.players = [{ id: "p1", clientId: "c1", connected: true, username: "player1", points: 0 }]
    // Not SELECT_ANSWER
    game.currentState = GAME_STATE.SHOW_RESULT

    const pSocket = { id: "p1", emit: vi.fn(), to: vi.fn().mockReturnThis() } as any
    game.selectAnswer(pSocket, 0)

    expect(pSocket.emit).toHaveBeenCalledWith("game:errorMessage", "Answers are not currently accepted")
  })
})
