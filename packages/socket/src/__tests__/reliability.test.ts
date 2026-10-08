import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import Registry from "../services/registry"
import Game from "../services/game"
import { Server } from "socket.io"
import { Quizz } from "@rahoot/common/types/game"

// Mock logger to prevent noisy test output
vi.mock("../lib/observability/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

vi.mock("../lib/observability/metrics", () => ({
  metrics: {
    managerAuthSuccess: vi.fn(),
    managerAuthFailure: vi.fn(),
    gameCreated: vi.fn(),
    gameStarted: vi.fn(),
    gameEnded: vi.fn(),
    playerJoined: vi.fn(),
    playerDisconnected: vi.fn(),
    serverShutdown: vi.fn(),
    firebaseError: vi.fn(),
  }
}))

describe("Reliability & Operations", () => {
  // eslint-disable-next-line init-declarations
  let registry: Registry
  // eslint-disable-next-line init-declarations
  let mockIo: any

  beforeEach(() => {
    registry = Registry.getInstance()
    registry?.cleanup()

    mockIo = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
      disconnectSockets: vi.fn(),
    } as unknown as Server
  })

  afterEach(() => {
    registry?.cleanup()
    vi.clearAllMocks()
  })

  it("handles empty registry cleanup gracefully", () => {
    // Registry should not crash when cleaning up empty state
    expect(() => registry?.cleanup()).not.toThrow()
    expect(registry!.getGameCount()).toBe(0)
    expect(registry!.getEmptyGameCount()).toBe(0)
  })

  it("marks games as empty correctly and allows reactivation", () => {
    const mockSocket = { id: "mock-socket", handshake: { auth: { clientId: "mock-client" } }, join: vi.fn(), emit: vi.fn() } as any
    const mockQuizz = { id: "test-quiz", questions: [] } as unknown as Quizz

    const game = new Game(mockIo, mockSocket, mockQuizz)
    registry!.addGame(game)

    expect(registry!.getGameCount()).toBe(1)

    registry!.markGameAsEmpty(game)
    expect(registry!.getEmptyGameCount()).toBe(1)

    registry!.reactivateGame(game.gameId)
    expect(registry!.getEmptyGameCount()).toBe(0)
  })

  it("FirebaseService gracefully handles missing configuration", async () => {
    const originalEnv = process.env.FIREBASE_SERVICE_ACCOUNT
    const loadEnvFileSpy = vi
      .spyOn(process, "loadEnvFile")
      .mockImplementation(() => undefined)

    delete process.env.FIREBASE_SERVICE_ACCOUNT

    try {
      vi.resetModules()
      const { default: FirebaseService } = await import("../services/firebase")

      expect(FirebaseService.isInitialized()).toBe(false)
      await expect(FirebaseService.getQuizzes()).resolves.toEqual([])
    } finally {
      loadEnvFileSpy.mockRestore()

      if (originalEnv === undefined) {
        delete process.env.FIREBASE_SERVICE_ACCOUNT
      } else {
        process.env.FIREBASE_SERVICE_ACCOUNT = originalEnv
      }
    }
  })
})
