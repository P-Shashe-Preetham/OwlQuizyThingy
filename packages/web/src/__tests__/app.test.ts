import { describe, expect, it } from "vitest"
import { calculatePercentages } from "../features/game/utils/score"

describe("Web UI Component & Utility Unit Tests", () => {
  it("verifies score calculation helper functions", () => {
    // Normal cases
    expect(calculatePercentages({ a: 1, b: 3 })).toEqual({ a: "25%", b: "75%" })
    expect(calculatePercentages({ option1: 10, option2: 30 })).toEqual({ option1: "25%", option2: "75%" })

    // Single case
    expect(calculatePercentages({ onlyOne: 5 })).toEqual({ onlyOne: "100%" })

    // Empty object
    expect(calculatePercentages({})).toEqual({})

    // Zeroes
    expect(calculatePercentages({ a: 0, b: 0 })).toEqual({ a: "NaN%", b: "NaN%" })
  })
})
