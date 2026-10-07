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
    },
    {
      question: "Q2",
      type: "quiz" as const,
      answers: ["T", "F"],
      solution: 1,
      cooldown: 2,
      time: 5
    }
  ]
}

describe("Game Unit Tests (Agent-03 Focus)", () => {
  let mockIo: any = {}
  let mockSocket: any = {}

  beforeEach(() => {
    vi.useFakeTimers()

    mockIo = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn()
    }

    mockSocket = {
      id: "manager-sock-1",
      handshake: { auth: { clientId: "manager-client-1" } },
      join: vi.fn(),
      emit: vi.fn(),
      to: vi.fn().mockReturnThis()
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe("Concurrency & Answer Locking", () => {
    it("should reject answers submitted before SELECT_ANSWER state", () => {
      const game = new Game(mockIo, mockSocket, mockQuiz as any)
      game.players = [{ id: "p1", clientId: "c1", connected: true, username: "player1", points: 0 }]

      const playerSocket = { id: "p1", emit: vi.fn(), to: vi.fn().mockReturnThis() } as any

      game.selectAnswer(playerSocket, 0)

      expect(playerSocket.emit).toHaveBeenCalledWith("game:errorMessage", "Answers are not currently accepted")
      expect(game.round.playersAnswers.length).toBe(0)
    })

    it("should reject answers from non-existent players", () => {
      const game = new Game(mockIo, mockSocket, mockQuiz as any)
      game.currentState = GAME_STATE.SELECT_ANSWER

      const unknownSocket = { id: "unknown-p", emit: vi.fn(), to: vi.fn().mockReturnThis() } as any

      game.selectAnswer(unknownSocket, 0)

      expect(game.round.playersAnswers.length).toBe(0)
    })

    it("should correctly score a duplicate answer rejection", () => {
       const game = new Game(mockIo, mockSocket, mockQuiz as any)
       game.players = [{ id: "p1", clientId: "c1", connected: true, username: "player1", points: 0 }]
       game.currentState = GAME_STATE.SELECT_ANSWER

       const playerSocket = { id: "p1", emit: vi.fn(), to: vi.fn().mockReturnThis() } as any

       game.selectAnswer(playerSocket, 0)
       expect(game.round.playersAnswers.length).toBe(1)

       game.selectAnswer(playerSocket, 1)
       expect(playerSocket.emit).toHaveBeenCalledWith("game:errorMessage", "Answer already submitted")
       expect(game.round.playersAnswers.length).toBe(1)
    })
  })
})
