/* eslint-disable */
import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest"
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing"
import { ref, get, set, update, remove } from "firebase/database"
import * as fs from "fs"
import * as path from "path"

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  const rulesPath = path.resolve(__dirname, "../../database.rules.json")
  const rules = fs.readFileSync(rulesPath, "utf8")

  testEnv = await initializeTestEnvironment({
    projectId: "demo-project",
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules: rules,
    },
  })
})

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup()
  }
})

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearDatabase()
  }
})

describe("Realtime Database Security Rules", () => {
  it("should deny read access to the root", async () => {
    const alice = testEnv.authenticatedContext("alice")
    const dbRef = ref(alice.database(), "/")
    await assertFails(get(dbRef))
  })

  it("should deny write access to the root", async () => {
    const alice = testEnv.authenticatedContext("alice")
    const dbRef = ref(alice.database(), "/")
    await assertFails(set(dbRef, { test: "data" }))
  })
})
