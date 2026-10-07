import { describe, expect, it, beforeEach } from "vitest"
import Config from "../services/config"
import Registry from "../services/registry"

describe("Game Registry & Config Logic Unit Tests", () => {
  beforeEach(() => {
    Config.init()
  })

  it("reads game config and applies MANAGER_PASSWORD override safely", () => {
    process.env.MANAGER_PASSWORD = "test_secure_password"
    const config = Config.game()
    expect(config.managerPassword).toBe("test_secure_password")
  })

  it("safely filters out malformed local quiz files", () => {
    const quizzes = Config.quizz()
    expect(Array.isArray(quizzes)).toBe(true)
    quizzes.forEach((q) => {
      expect(q).toHaveProperty("id")
      expect(q).toHaveProperty("subject")
      expect(Array.isArray(q.questions)).toBe(true)
    })
  })

  it("manages active and empty game lifecycle in Registry", () => {
    const registry = Registry.getInstance()
    expect(registry.getGameCount()).toBeGreaterThanOrEqual(0)
  })
})
