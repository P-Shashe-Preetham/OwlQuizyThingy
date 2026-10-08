export type Player = {
  id: string
  clientId: string
  connected: boolean
  username: string
  points: number
}

export type Answer = {
  playerId: string
  answerId: number | string
  points: number
}

export type Quizz = {
  subject: string
  settings?: {
    theme?: string
    classicMode?: boolean
  }
  questions: {
    type?: "quiz" | "type-answer"
    question: string
    image?: string
    video?: string
    audio?: string
    answers: string[]
    solution: number
    cooldown: number
    time: number
  }[]
}

export type QuizzWithId = Quizz & { id: string }

export type GameUpdateQuestion = {
  current: number
  total: number
}
