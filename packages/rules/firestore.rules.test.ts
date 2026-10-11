/* eslint-disable */
import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest"
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing"
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection } from "firebase/firestore"
import * as fs from "fs"
import * as path from "path"

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  const rulesPath = path.resolve(__dirname, "../../firestore.rules")
  const rules = fs.readFileSync(rulesPath, "utf8")

  testEnv = await initializeTestEnvironment({
    projectId: "demo-project",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
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
    await testEnv.clearFirestore()
  }
})

describe("Firestore Security Rules", () => {
  describe("users collection", () => {
    it("should allow a user to read their own document", async () => {
      const alice = testEnv.authenticatedContext("alice")
      const aliceDocRef = doc(alice.firestore(), "users/alice")
      await assertSucceeds(getDoc(aliceDocRef))
    })

    it("should deny a user from reading another user's document", async () => {
      const alice = testEnv.authenticatedContext("alice")
      const bobDocRef = doc(alice.firestore(), "users/bob")
      await assertFails(getDoc(bobDocRef))
    })

    it("should allow a user to update their own document", async () => {
      const alice = testEnv.authenticatedContext("alice")
      // Setup using unauthenticated context bypassing rules
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "users/alice"), { name: "Alice" })
      })

      const aliceDocRef = doc(alice.firestore(), "users/alice")
      await assertSucceeds(updateDoc(aliceDocRef, { name: "Alice Updated" }))
    })

    it("should deny a user from updating another user's document", async () => {
      const alice = testEnv.authenticatedContext("alice")
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "users/bob"), { name: "Bob" })
      })

      const bobDocRef = doc(alice.firestore(), "users/bob")
      await assertFails(updateDoc(bobDocRef, { name: "Alice Hacked Bob" }))
    })

    it("should deny deletion of user documents", async () => {
      const alice = testEnv.authenticatedContext("alice")
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "users/alice"), { name: "Alice" })
      })
      const aliceDocRef = doc(alice.firestore(), "users/alice")
      await assertFails(deleteDoc(aliceDocRef))
    })
  })

  describe("quizzes collection", () => {
    it("should allow any authenticated user to read quizzes", async () => {
      const alice = testEnv.authenticatedContext("alice")
      const quizRef = doc(alice.firestore(), "quizzes/quiz1")
      await assertSucceeds(getDoc(quizRef))
    })

    it("should deny unauthenticated users from reading quizzes", async () => {
      const unauth = testEnv.unauthenticatedContext()
      const quizRef = doc(unauth.firestore(), "quizzes/quiz1")
      await assertFails(getDoc(quizRef))
    })

    it("should allow authenticated users to create a quiz if they set themselves as owner", async () => {
      const alice = testEnv.authenticatedContext("alice")
      const quizRef = doc(alice.firestore(), "quizzes/quiz1")
      await assertSucceeds(setDoc(quizRef, { title: "My Quiz", ownerId: "alice" }))
    })

    it("should deny authenticated users from creating a quiz setting someone else as owner", async () => {
      const alice = testEnv.authenticatedContext("alice")
      const quizRef = doc(alice.firestore(), "quizzes/quiz2")
      await assertFails(setDoc(quizRef, { title: "Hacked Quiz", ownerId: "bob" }))
    })

    it("should allow owners to update their quizzes without changing ownership", async () => {
      const alice = testEnv.authenticatedContext("alice")
      await testEnv.withSecurityRulesDisabled(async (context) => {
         await setDoc(doc(context.firestore(), "quizzes/quiz1"), { title: "My Quiz", ownerId: "alice" })
      })
      const quizRef = doc(alice.firestore(), "quizzes/quiz1")
      await assertSucceeds(updateDoc(quizRef, { title: "My Updated Quiz", ownerId: "alice" }))
    })

    it("should deny owners from transferring ownership", async () => {
      const alice = testEnv.authenticatedContext("alice")
      await testEnv.withSecurityRulesDisabled(async (context) => {
         await setDoc(doc(context.firestore(), "quizzes/quiz1"), { title: "My Quiz", ownerId: "alice" })
      })
      const quizRef = doc(alice.firestore(), "quizzes/quiz1")
      await assertFails(updateDoc(quizRef, { ownerId: "bob" }))
    })

    it("should deny non-owners from updating quizzes", async () => {
      const bob = testEnv.authenticatedContext("bob")
      await testEnv.withSecurityRulesDisabled(async (context) => {
         await setDoc(doc(context.firestore(), "quizzes/quiz1"), { title: "My Quiz", ownerId: "alice" })
      })
      const quizRef = doc(bob.firestore(), "quizzes/quiz1")
      await assertFails(updateDoc(quizRef, { title: "Bob Updated Quiz", ownerId: "alice" }))
    })

    it("should allow owners to delete their quizzes", async () => {
      const alice = testEnv.authenticatedContext("alice")
      await testEnv.withSecurityRulesDisabled(async (context) => {
         await setDoc(doc(context.firestore(), "quizzes/quiz1"), { title: "My Quiz", ownerId: "alice" })
      })
      const quizRef = doc(alice.firestore(), "quizzes/quiz1")
      await assertSucceeds(deleteDoc(quizRef))
    })

    it("should deny non-owners from deleting quizzes", async () => {
      const bob = testEnv.authenticatedContext("bob")
      await testEnv.withSecurityRulesDisabled(async (context) => {
         await setDoc(doc(context.firestore(), "quizzes/quiz1"), { title: "My Quiz", ownerId: "alice" })
      })
      const quizRef = doc(bob.firestore(), "quizzes/quiz1")
      await assertFails(deleteDoc(quizRef))
    })
  })
})
