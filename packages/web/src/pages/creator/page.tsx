import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import type { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import { quizzSchema } from "@rahoot/common/validators/game"
import Triangle from "@rahoot/web/features/game/components/icons/Triangle"
import Rhombus from "@rahoot/web/features/game/components/icons/Rhombus"
import Circle from "@rahoot/web/features/game/components/icons/Circle"
import Square from "@rahoot/web/features/game/components/icons/Square"
import { ANSWERS_COLORS } from "@rahoot/web/features/game/utils/constants"
import {
  useSocket,
  useEvent,
} from "@rahoot/web/features/game/contexts/socketProvider"
import toast from "react-hot-toast"
import clsx from "clsx"

const Icons = [Triangle, Rhombus, Circle, Square]

type PartialQuestion = Quizz["questions"][number];

const CreatorPage = () => {
  const { socket } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const [subject, setSubject] = useState("My Awesome Quiz")
  const [classicMode, setClassicMode] = useState(false)
  const [theme, setTheme] = useState("default")
  const [isSaving, setIsSaving] = useState(false)
  const [questions, setQuestions] = useState<PartialQuestion[]>([
    {
      type: "quiz",
      question: "What is 2 + 2?",
      answers: ["3", "4", "5", "6"],
      solution: 1,
      cooldown: 5,
      time: 20,
    },
  ])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [id, setId] = useState<string | undefined>(undefined)
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (location.state?.quizz) {
      const q = location.state.quizz as QuizzWithId
      setId(q.id)
      setSubject(q.subject)
      setClassicMode(q.settings?.classicMode || false)
      setTheme(q.settings?.theme || "default")
      setQuestions(
        q.questions.map((question) => ({
          ...question,
          type: question.type || "quiz",
        })),
      )
    } else {
      const draft = localStorage.getItem(
        `draft_quizz_${location.state?.quizz?.id || "new"}`,
      )

      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          setSubject(parsed.subject)
          setClassicMode(parsed.settings?.classicMode || false)
          setTheme(parsed.settings?.theme || "default")
          setQuestions(parsed.questions)
        } catch (e) {
          console.warn("Failed to parse draft quiz from localStorage:", e)
        }
      }
    }
  }, [location.state])

  useEffect(() => {
    if (!isSaving) {
      localStorage.setItem(
        `draft_quizz_${id || "new"}`,
        JSON.stringify({
          subject,
          settings: { classicMode, theme },
          questions,
        }),
      )
    }
  }, [subject, classicMode, theme, questions, isSaving])

  useEvent("manager:quizzSaved", ({ id: savedId, subject }) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    setIsSaving(false)
    localStorage.removeItem(`draft_quizz_${id || "new"}`)
    toast.success(`Quiz "${subject}" saved successfully!`)

    if (savedId) {
      setId(savedId)
    }
  })

  useEvent("manager:errorMessage", (message) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    setIsSaving(false)
    toast.error(message)
  })

  const handleSave = () => {
    if (!socket) {
      toast.error("Socket connection not available")

      return
    }

    const quizData: Quizz & { id?: string } = {
      ...(id ? { id } : {}),
      subject,
      settings: {
        theme,
        classicMode,
      },
      questions: questions.map((q) => ({
        ...q,
        answers: q.answers.filter((a) => a.trim() !== ""),
      })),
    }

    const parse = quizzSchema.safeParse(quizData)

    if (!parse.success) {
      toast.error(parse.error.issues[0].message)

      return
    }

    setIsSaving(true)


    const timeout = setTimeout(() => {
      setIsSaving(false)
      toast.error("Server took too long to respond")
    }, 10000)

    setSaveTimeout(timeout)

    socket.emit("manager:saveQuizz", quizData)
  }

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: "quiz",
        question: "New Question",
        answers: ["Option 1", "Option 2", "Option 3", "Option 4"],
        solution: 0,
        cooldown: 5,
        time: 20,
      },
    ])
    setSelectedIdx(questions.length)
  }

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) {
      toast.error("Quiz must have at least 1 question")

      return
    }

    const next = questions.filter((_, i) => i !== idx)
    setQuestions(next)

    if (selectedIdx >= next.length) {
      setSelectedIdx(next.length - 1)
    }
  }

  const currentQ = questions[selectedIdx] || questions[0]

  const moveQuestionUp = (idx: number) => {
    if (idx === 0) {
      return
    }

    const newQuestions = [...questions]
    const temp = newQuestions[idx]
    newQuestions[idx] = newQuestions[idx - 1]
    newQuestions[idx - 1] = temp
    setQuestions(newQuestions)
    setSelectedIdx(idx - 1)
  }

  const moveQuestionDown = (idx: number) => {
    if (idx === questions.length - 1) {
      return
    }

    const newQuestions = [...questions]
    const temp = newQuestions[idx]
    newQuestions[idx] = newQuestions[idx + 1]
    newQuestions[idx + 1] = temp
    setQuestions(newQuestions)
    setSelectedIdx(idx + 1)
  }

  const updateQuestion = (data: Partial<PartialQuestion>) => {
    const updated = [...questions]
    updated[selectedIdx] = { ...updated[selectedIdx], ...data }
    setQuestions(updated)
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden font-sans">
      {/* Sidebar: Questions List */}
      <div className="w-80 bg-slate-950 border-r border-white/10 flex flex-col z-20">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
          <button
            onClick={() => navigate("/manager")}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
            aria-label="Back to Manager Dashboard"
          >
            ← Back
          </button>
          <span className="font-extrabold text-sm uppercase tracking-widest text-primary">
            Creator
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {questions.map((q, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={clsx(
                "p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative group flex items-center justify-between",
                selectedIdx === idx
                  ? "bg-primary/10 border-primary text-white shadow-lg shadow-primary/10 scale-[1.02]"
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10",
              )}
              role="button"
              tabIndex={0}
              aria-label={`Select Question ${idx + 1}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedIdx(idx)
                }
              }}
            >
              <div className="flex flex-col gap-1 mr-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    moveQuestionUp(idx)
                  }}
                  disabled={idx === 0}
                  className="px-1 py-0 hover:bg-white/20 rounded disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    moveQuestionDown(idx)
                  }}
                  disabled={idx === questions.length - 1}
                  className="px-1 py-0 hover:bg-white/20 rounded disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                >
                  ↓
                </button>
              </div>
              <div className="flex items-center gap-3 overflow-hidden">
                <span
                  className={clsx(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black",
                    selectedIdx === idx
                      ? "bg-primary text-slate-950"
                      : "bg-white/10 text-white",
                  )}
                >
                  {idx + 1}
                </span>
                <span className="font-bold text-sm truncate max-w-[140px]">
                  {q.question || "Untitled Question"}
                </span>
              </div>

              {questions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeQuestion(idx)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                  aria-label={`Delete Question ${idx + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 bg-slate-900/50">
          <button
            onClick={addQuestion}
            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
            aria-label="Add New Question"
          >
            <span className="text-xl">+</span> Add Question
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-y-auto">
        {/* Top bar: Quiz Details & Save */}
        <header className="h-20 border-b border-white/10 px-8 flex items-center justify-between bg-slate-950/40 backdrop-blur-md sticky top-0 z-30">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-2xl font-black bg-transparent border-b border-transparent hover:border-white/20 focus:border-primary focus:outline-none px-2 py-1 rounded transition-all text-white max-w-md"
            placeholder="Enter Quiz Title..."
            aria-label="Quiz Title"
          />

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={clsx(
                "px-8 py-3 bg-primary hover:bg-primary/90 text-slate-950 font-black rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer",
                isSaving && "opacity-50 cursor-not-allowed",
              )}
              aria-label="Save Quiz"
            >
              {isSaving ? "Saving..." : "Save Quiz"}
            </button>
          </div>
        </header>

        {/* Editor Area */}
        <main className="flex-1 p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
          {/* Question Input */}
          <div className="flex flex-col gap-6">
            <div className="relative group">
              <textarea
                value={currentQ.question}
                onChange={(e) => updateQuestion({ question: e.target.value })}
                className="w-full text-center text-4xl font-bold bg-white/5 border-2 border-transparent focus:border-primary/50 rounded-3xl p-10 focus:outline-none transition-all min-h-40 resize-none leading-relaxed placeholder:text-white/10 shadow-2xl"
                placeholder="Start typing your question..."
                aria-label="Question Text"
              />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-6 py-1 text-sm font-bold text-slate-500 uppercase tracking-tighter rounded-full border border-white/10 group-focus-within:text-primary transition-colors">
                Question Text
              </div>
            </div>

            {/* Multimedia Placeholder & Question Settings */}
            <div className="flex justify-center flex-wrap gap-8">
              <div className="w-80 h-48 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-400 hover:bg-white/10 transition-all cursor-pointer group shadow-xl">
                <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                  🖼️
                </span>
                <span className="text-sm font-bold">Image URL</span>
                <input
                  className="mt-2 w-3/4 p-1 bg-transparent text-xs text-center border-b border-white/10 focus:outline-none focus:border-primary text-white"
                  placeholder="paste link..."
                  value={currentQ.image || ""}
                  onChange={(e) => updateQuestion({ image: e.target.value })}
                  aria-label="Image URL"
                />
              </div>

              <div className="flex flex-col gap-4 justify-center">
                <div className="bg-slate-800 p-4 rounded-3xl border border-white/10 shadow-xl">
                  <label
                    htmlFor="question-type-select"
                    className="block text-xs font-black text-slate-500 uppercase mb-3 text-center tracking-widest"
                  >
                    Question Type
                  </label>
                  <select
                    id="question-type-select"
                    value={currentQ.type || "quiz"}
                    onChange={(e) => {
                      const newType = e.target.value as any
                      const update: Partial<PartialQuestion> = {
                        type: newType,
                      }

                      if (
                        newType === "type-answer" &&
                        currentQ.answers.length > 1
                      ) {
                        update.answers = [currentQ.answers[0]]
                      } else if (
                        newType === "quiz" &&
                        currentQ.answers.length < 4
                      ) {
                        const newAns = [...currentQ.answers]

                        while (newAns.length < 4) {
                          newAns.push(`Option ${newAns.length + 1}`)
                        }

                        update.answers = newAns
                      }

                      updateQuestion(update)
                    }}
                    className="bg-slate-900 px-6 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-primary font-bold transition-all w-full text-center text-sm cursor-pointer relative z-30 text-white"
                  >
                    <option value="quiz">Multiple Choice</option>
                    <option value="type-answer">Type Answer</option>
                  </select>
                </div>

                <div className="bg-slate-800 p-4 rounded-3xl border border-white/10 shadow-xl">
                  <label
                    htmlFor="time-limit-input"
                    className="block text-xs font-black text-slate-500 uppercase mb-3 text-center tracking-widest"
                  >
                    Time Limit (s)
                  </label>
                  <input
                    id="time-limit-input"
                    type="number"
                    min="5"
                    max="360"
                    value={currentQ.time}
                    onChange={(e) =>
                      updateQuestion({ time: Number(e.target.value) })
                    }
                    className="bg-slate-900 px-6 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-primary font-bold transition-all w-full text-center text-xl cursor-pointer relative z-30 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Answer Options */}
            <div
              className={clsx(
                "gap-6 pb-12",
                currentQ.type === "type-answer"
                  ? "flex flex-col max-w-2xl mx-auto w-full"
                  : "grid grid-cols-2",
              )}
            >
              {currentQ.answers.map((ans, i) => (
                <div
                  key={i}
                  className={clsx(
                    "relative group flex items-center h-24 rounded-2xl shadow-xl transition-all duration-300 border-4",
                    currentQ.type === "type-answer"
                      ? "border-white/10 bg-white/5 opacity-100 focus-within:border-primary/50 focus-within:bg-white/10"
                      : `${ANSWERS_COLORS[i]} ${
                          currentQ.solution === i
                            ? "border-white/50 scale-[1.02] shadow-white/10"
                            : "border-white/5 opacity-80 hover:opacity-100 hover:scale-[1.01]"
                        }`,
                  )}
                >
                  {currentQ.type !== "type-answer" && (
                    <button
                      type="button"
                      className="p-4 cursor-pointer hover:scale-110 transition-transform active:scale-95"
                      onClick={() => updateQuestion({ solution: i })}
                      aria-label={`Mark Option ${i + 1} as correct solution`}
                    >
                      <div
                        className={clsx(
                          "w-10 h-10 rounded-full border-2 border-white flex items-center justify-center font-bold text-xl",
                          currentQ.solution === i
                            ? "bg-white text-slate-900"
                            : "bg-transparent text-white",
                        )}
                      >
                        {currentQ.solution === i ? "✓" : ""}
                      </div>
                    </button>
                  )}
                  <input
                    value={ans}
                    onChange={(e) => {
                      const newAns = [...currentQ.answers]
                      newAns[i] = e.target.value
                      updateQuestion({ answers: newAns })
                    }}
                    className={clsx(
                      "flex-1 bg-transparent text-2xl font-bold px-4 focus:outline-none placeholder:text-white/30 text-white",
                      currentQ.type === "type-answer" && "ml-4",
                    )}
                    placeholder={
                      currentQ.type === "type-answer"
                        ? `Accepted Answer ${i + 1}`
                        : `Answer ${i + 1}`
                    }
                    aria-label={`Answer option ${i + 1}`}
                  />
                  <div className="absolute right-6 opacity-40 pointer-events-none group-focus-within:opacity-100 transition-opacity">
                    {Icons[i] &&
                      currentQ.type !== "type-answer" &&
                      (() => {
                        const Icon = Icons[i]

                        return (
                          <Icon className="w-8 h-8 text-white fill-current" />
                        )
                      })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CreatorPage
