import z from "zod"

export const managerAuthSchema = z.string().min(8, "Password must be at least 8 characters")

export const questionAnswerSchema = z.object({
  type: z.enum(["quiz", "type-answer"]).optional(),
  question: z.string().min(1, "Question text cannot be empty").max(1000, "Question too long"),
  image: z.string().max(2048, "URL too long").url("Invalid image URL").optional().or(z.literal("")),
  video: z.string().max(2048, "URL too long").url("Invalid video URL").optional().or(z.literal("")),
  audio: z.string().max(2048, "URL too long").url("Invalid audio URL").optional().or(z.literal("")),
  answers: z.array(z.string().max(500, "Answer too long")).min(2, "At least two answers required").max(10, "Too many answers"),
  solution: z.number().int().nonnegative(),
  cooldown: z.number().int().positive().max(60, "Cooldown too long").default(5),
  time: z.number().int().positive().max(300, "Time too long").default(15),
}).superRefine((data, ctx) => {
  if (data.type !== "type-answer" && data.solution >= data.answers.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Solution index out of bounds",
      path: ["solution"]
    })
  }
})

export const quizzSchema = z.object({
  subject: z.string().min(1, "Subject cannot be empty"),
  ownerId: z.string().optional(),
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
