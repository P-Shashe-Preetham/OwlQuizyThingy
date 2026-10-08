import { QuizzWithId } from "@rahoot/common/types/game"
import { quizzSchema } from "@rahoot/common/validators/game"
import fs from "fs"
import { resolve } from "path"

const inContainerPath = process.env.CONFIG_PATH

const getPath = (path: string = "") =>
  inContainerPath
    ? resolve(inContainerPath, path)
    : resolve(process.cwd(), "../../config", path)

function parseQuizFile(file: string): QuizzWithId | null {
  try {
    const filePath = getPath(`quizz/${file}`)
    const data = fs.readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(data)

    const validationResult = quizzSchema.safeParse(parsed)

    if (!validationResult.success) {
      console.error(
        `⚠️ Malformed quiz file skipped: ${file}. Issues:`,
        validationResult.error.format(),
      )

      return null
    }

    const fileId = file.replace(/\.json$/u, "")
    const id = parsed.id && typeof parsed.id === "string" ? parsed.id : fileId

    return {
      ...validationResult.data,
      id,
    }
  } catch (fileError) {
    console.error(`❌ Failed to read or parse quiz file ${file}:`, fileError)

    return null
  }
}

class Config {
  static init() {
    const isConfigFolderExists = fs.existsSync(getPath())

    if (!isConfigFolderExists) {
      fs.mkdirSync(getPath(), { recursive: true })
    }

    const isGameConfigExists = fs.existsSync(getPath("game.json"))

    if (!isGameConfigExists) {
      fs.writeFileSync(
        getPath("game.json"),
        JSON.stringify(
          {
            managerPassword: "",
          },
          null,
          2,
        ),
      )
    }

    const isQuizzExists = fs.existsSync(getPath("quizz"))

    if (!isQuizzExists) {
      fs.mkdirSync(getPath("quizz"), { recursive: true })

      fs.writeFileSync(
        getPath("quizz/example.json"),
        JSON.stringify(
          {
            subject: "Example Quizz",
            questions: [
              {
                question: "What is good answer ?",
                answers: ["No", "Good answer", "No", "No"],
                solution: 1,
                cooldown: 5,
                time: 15,
              },
              {
                question: "What is good answer with image ?",
                answers: ["No", "No", "No", "Good answer"],
                image: "https://placehold.co/600x400.png",
                solution: 3,
                cooldown: 5,
                time: 20,
              },
              {
                question: "What is good answer with two answers ?",
                answers: ["Good answer", "No"],
                image: "https://placehold.co/600x400.png",
                solution: 0,
                cooldown: 5,
                time: 20,
              },
            ],
          },
          null,
          2,
        ),
      )
    }
  }

  static game() {
    let configObj: any = {}

    const isExists = fs.existsSync(getPath("game.json"))

    if (isExists) {
      try {
        const config = fs.readFileSync(getPath("game.json"), "utf-8")
        configObj = JSON.parse(config)
      } catch (error) {
        console.error("Failed to read game config:", error)
      }
    }

    if (process.env.MANAGER_PASSWORD) {
      configObj.managerPassword = process.env.MANAGER_PASSWORD
    }

    return configObj
  }

  static quizz(): QuizzWithId[] {
    const isExists = fs.existsSync(getPath("quizz"))

    if (!isExists) {
      return []
    }

    try {
      const files = fs
        .readdirSync(getPath("quizz"))
        .filter((file) => file.endsWith(".json"))

      const quizzes: QuizzWithId[] = []

      for (const file of files) {
        const quiz = parseQuizFile(file)

        if (quiz) {
          quizzes.push(quiz)
        }
      }

      return quizzes
    } catch (error) {
      console.error("Failed to read quizz directory:", error)

      return []
    }
  }
}

export default Config
