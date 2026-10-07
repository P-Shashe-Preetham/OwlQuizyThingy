import { describe, expect, it } from "vitest"
import {
  gameIdSchema,
  inviteCodeSchema,
  managerAuthSchema,
  playerLoginSchema,
  quizzSchema,
  selectedAnswerSchema,
} from "../validators/game"

describe("Common Validators Security Unit Tests", () => {
  it("validates manager authentication payload", () => {
    expect(managerAuthSchema.safeParse("").success).toBe(false)
    expect(managerAuthSchema.safeParse("secret123").success).toBe(true)
  })

  it("validates invite code length and game ID", () => {
    expect(gameIdSchema.safeParse("").success).toBe(false)
    expect(gameIdSchema.safeParse("game-123").success).toBe(true)
    expect(inviteCodeSchema.safeParse("12345").success).toBe(false)
    expect(inviteCodeSchema.safeParse("1234567").success).toBe(false)
    expect(inviteCodeSchema.safeParse("123456").success).toBe(true)
  })

  it("enforces quiz structure bounds", () => {
    const invalidQuiz = {
      subject: "",
      questions: [],
    }

    const validQuiz = {
      subject: "General Knowledge",
      questions: [
        {
          question: "What is 1 + 1?",
          answers: ["1", "2", "3", "4"],
          solution: 1,
          cooldown: 5,
          time: 15,
        },
      ],
    }

    expect(quizzSchema.safeParse(invalidQuiz).success).toBe(false)
    expect(quizzSchema.safeParse(validQuiz).success).toBe(true)
  })

  it("validates player login username bounds", () => {
    const shortUser = { gameId: "g1", data: { username: "abc" } }
    const validUser = { gameId: "g1", data: { username: "Alice" } }

    expect(playerLoginSchema.safeParse(shortUser).success).toBe(false)
    expect(playerLoginSchema.safeParse(validUser).success).toBe(true)
  })

  it("validates answer selection payload", () => {
    const invalidAnswer = { gameId: "", data: { answerKey: -1 } }
    const validAnswer = { gameId: "g1", data: { answerKey: 2 } }

    expect(selectedAnswerSchema.safeParse(invalidAnswer).success).toBe(false)
    expect(selectedAnswerSchema.safeParse(validAnswer).success).toBe(true)
  })
})
