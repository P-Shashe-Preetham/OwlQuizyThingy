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

describe("Game Unit Tests (Disconnect)", () => {
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

  it("rejects answers from disconnected players", () => {
    const game = new Game(mockIo, mockSocket, mockQuiz as any)
    game.players = [{ id: "p1", clientId: "c1", connected: false, username: "player1", points: 0 }]
    game.currentState = GAME_STATE.SELECT_ANSWER

    const playerSocket = { id: "p1", emit: vi.fn(), to: vi.fn().mockReturnThis() } as any
    game.selectAnswer(playerSocket, 0)

    expect(playerSocket.emit).toHaveBeenCalledWith("game:errorMessage", "Disconnected players cannot answer")
  })
})
