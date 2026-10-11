/* eslint-disable */
import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest"
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing"
import { ref, uploadBytes, getBytes, deleteObject } from "firebase/storage"
import * as fs from "fs"
import * as path from "path"

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  const rulesPath = path.resolve(__dirname, "../../storage.rules")
  const rules = fs.readFileSync(rulesPath, "utf8")

  testEnv = await initializeTestEnvironment({
    projectId: "demo-project",
    storage: {
      host: "127.0.0.1",
      port: 9199,
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
    await testEnv.clearStorage()
  }
})

describe("Storage Security Rules", () => {
  describe("quizzes directory", () => {
    it("should allow a user to write to their own quiz directory", async () => {
      const alice = testEnv.authenticatedContext("alice")
      const fileRef = ref(alice.storage(), "quizzes/alice/image.png")
      const blob = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) // valid dummy bytes
      await assertSucceeds(uploadBytes(fileRef, blob))
    })

    it("should deny a user from writing to another user's quiz directory", async () => {
      const alice = testEnv.authenticatedContext("alice")
      const bobFileRef = ref(alice.storage(), "quizzes/bob/image.png")
      const blob = new Uint8Array([0x89, 0x50])
      await assertFails(uploadBytes(bobFileRef, blob))
    })

    it("should allow any user to read from quizzes directories", async () => {
      const unauth = testEnv.unauthenticatedContext()

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const fileRef = ref(context.storage(), "quizzes/alice/image.png")
        await uploadBytes(fileRef, new Uint8Array([0x89, 0x50]))
      })

      const fileRef = ref(unauth.storage(), "quizzes/alice/image.png")
      await assertSucceeds(getBytes(fileRef))
    })
  })

  describe("other paths", () => {
     it("should deny access to random paths", async () => {
      const alice = testEnv.authenticatedContext("alice")
      const fileRef = ref(alice.storage(), "secret/image.png")
      const blob = new Uint8Array([0x89, 0x50])
      await assertFails(uploadBytes(fileRef, blob))
      await assertFails(getBytes(fileRef))
     })
  })
})
