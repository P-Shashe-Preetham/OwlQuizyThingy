import z from "zod"

export const managerAuthSchema = z.string().min(1, "Password is required")

export const questionAnswerSchema = z.object({
  type: z.enum(["quiz", "type-answer"]).optional(),
  question: z.string().min(1, "Question text cannot be empty"),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
  video: z.string().url("Invalid video URL").optional().or(z.literal("")),
  audio: z.string().url("Invalid audio URL").optional().or(z.literal("")),
  answers: z.array(z.string()).min(2, "At least two answers required"),
  solution: z.number().int().nonnegative(),
  cooldown: z.number().int().positive().default(5),
  time: z.number().int().positive().default(15),
})

export const quizzSchema = z.object({
  subject: z.string().min(1, "Subject cannot be empty"),
  settings: z
    .object({
      theme: z.string().optional(),
      classicMode: z.boolean().optional(),
    })
    .optional(),
  questions: z.array(questionAnswerSchema).min(1, "At least one question required"),
})

export const quizzWithOptionalIdSchema = quizzSchema.extend({
  id: z.string().optional(),
})

export const gameIdSchema = z.string().min(1, "Game ID is required")
export const inviteCodeSchema = z.string().length(6, "Invite code must be 6 digits")

export const playerLoginSchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
  data: z.object({
    username: z
      .string()
      .min(4, "Username must be at least 4 characters")
      .max(20, "Username cannot exceed 20 characters"),
  }),
})

export const selectedAnswerSchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
  data: z.object({
    answerKey: z.union([z.number().int().nonnegative(), z.string()]),
  }),
})

export const kickPlayerSchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
  playerId: z.string().min(1, "Player ID is required"),
})
