import FirebaseService from "./packages/socket/src/services/firebase"

async function testFetch() {
  console.log("Checking if initialized:", FirebaseService.isInitialized())
  try {
    const quizzes = await FirebaseService.getQuizzes()
    console.log("Quizzes fetched:", quizzes)
  } catch (error) {
    console.error("Error fetching:", error)
  }
}

testFetch()
