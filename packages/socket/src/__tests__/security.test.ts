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
      time: 5,
    },
  ],
}

describe("Security Integration Tests", () => {
  let mockIo: any = {}
  let managerSocket: any = {}

  beforeEach(() => {
    vi.useFakeTimers()

    mockIo = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    }

    managerSocket = {
      id: "m-sock",
      handshake: { auth: { clientId: "m-client" } },
      join: vi.fn(),
      emit: vi.fn(),
      to: vi.fn().mockReturnThis(),
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("prevents unauthorized manager actions", () => {
    const game = new Game(mockIo, managerSocket, mockQuiz as any)

    game.started = true
    game.currentState = GAME_STATE.SHOW_RESULT

    const fakeManagerSocket = {
      id: "fake-sock",
      handshake: { auth: { clientId: "fake-client" } },
      join: vi.fn(),
      emit: vi.fn(),
      to: vi.fn().mockReturnThis(),
    } as any

    game.nextRound(fakeManagerSocket)
    expect(game.round.currentQuestion).toBe(0)

    game.abortRound(fakeManagerSocket)
    expect(game.started).toBe(true)

    game.showLeaderboard(fakeManagerSocket)
    expect(game.currentState).toBe(GAME_STATE.SHOW_RESULT)

    game.showLeaderboard(managerSocket)
    expect(game.currentState).toBe(GAME_STATE.FINISHED)
  })

  it("prevents player identity takeover across reconnects", () => {
    const game = new Game(mockIo, managerSocket, mockQuiz as any)

    const p1Socket = {
      id: "p1-sock",
      handshake: { auth: { clientId: "p1-client" } },
      join: vi.fn(),
      emit: vi.fn(),
      to: vi.fn().mockReturnThis(),
    } as any

    game.join(p1Socket, "player1")

    expect(game.players.length).toBe(1)
    expect(game.players[0].clientId).toBe("p1-client")

    game.players[0].connected = false

    const attackerSocket = {
      id: "attacker-sock",
      handshake: { auth: { clientId: "attacker-client" } },
      join: vi.fn(),
      emit: vi.fn(),
      to: vi.fn().mockReturnThis(),
    } as any

    game.reconnect(attackerSocket)

    expect(game.players[0].id).toBe("p1-sock")

    const p1ReconnectSocket = {
      id: "p1-sock-new",
      handshake: { auth: { clientId: "p1-client" } },
      join: vi.fn(),
      emit: vi.fn(),
      to: vi.fn().mockReturnThis(),
    } as any

    game.reconnect(p1ReconnectSocket)

    expect(game.players[0].id).toBe("p1-sock-new")
    expect(game.players[0].connected).toBe(true)
  })
})