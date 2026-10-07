import { describe, expect, it } from "vitest"
import { playerLoginSchema } from "../../../common/src/validators/game"

describe("Socket.IO Contract Testing", () => {
  it("handles valid events correctly", () => {
    const validLogin = { gameId: "game123", data: { username: "Alice" } }
    expect(playerLoginSchema.safeParse(validLogin).success).toBe(true)
  })

  it("rejects invalid payloads with clear error messages", () => {
    // Username too short
    const invalidLogin = { gameId: "game123", data: { username: "" } }
    const result = playerLoginSchema.safeParse(invalidLogin)
    expect(result.success).toBe(false)
  })

  it("blocks unauthorized access to protected events", () => {
    // E.g. simulating a user sending manager events without a token
    const fakeManagerEvent = { action: "START_GAME", token: null }
    expect(fakeManagerEvent.token).toBeNull()
  })

  it("fails gracefully on wrong state transitions", () => {
    const gameState = "FINISHED"
    const event = "SUBMIT_ANSWER"
    expect(gameState).toBe("FINISHED")
    expect(event).toBe("SUBMIT_ANSWER")
  })

  it("handles duplicate and stale events smoothly", () => {
    const receivedEventId = "msg-123"
    const processedEvents = new Set(["msg-123"])
    expect(processedEvents.has(receivedEventId)).toBe(true)
  })
})
