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

describe("Game Reconnect Tests", () => {
  let mockIo: any = {}
  let mockSocket: any = {}

  beforeEach(() => {
    vi.useFakeTimers()
    mockIo = { to: vi.fn().mockReturnThis(), emit: vi.fn() }
    mockSocket = { id: "m-sock", handshake: { auth: { clientId: "m-client" } }, join: vi.fn(), emit: vi.fn(), to: vi.fn().mockReturnThis() }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("prevents double answer on reconnect during SELECT_ANSWER", () => {
    const game = new Game(mockIo, mockSocket, mockQuiz as any)
    game.players = [{ id: "p1", clientId: "c1", connected: true, username: "player1", points: 0 }]
    game.currentState = GAME_STATE.SELECT_ANSWER

    const pSocket = { id: "p1", handshake: { auth: { clientId: "c1" } }, emit: vi.fn(), to: vi.fn().mockReturnThis(), join: vi.fn() } as any

    game.selectAnswer(pSocket, 0)
    expect(game.round.playersAnswers.length).toBe(1)

    // Simulate player disconnection by changing connected state manually, similar to real socket
    game.players[0].connected = false

    const newPSocket = { id: "p1-new", handshake: { auth: { clientId: "c1" } }, emit: vi.fn(), to: vi.fn().mockReturnThis(), join: vi.fn() } as any

    // We expect the player to reconnect and update socket id in the system
    game.reconnect(newPSocket)

    expect(game.players[0].id).toBe("p1-new")

    // Now attempt to answer again with new socket
    game.selectAnswer(newPSocket, 1)
    // Should not add new answer
    expect(game.round.playersAnswers.length).toBe(1)
    expect(newPSocket.emit).toHaveBeenCalledWith("game:errorMessage", "Answer already submitted")
  })
})
