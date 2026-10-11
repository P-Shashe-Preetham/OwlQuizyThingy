import { ImageUploader } from "./ImageUploader"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import type { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import Triangle from "@rahoot/web/features/game/components/icons/Triangle"
import Rhombus from "@rahoot/web/features/game/components/icons/Rhombus"
import Circle from "@rahoot/web/features/game/components/icons/Circle"
import Square from "@rahoot/web/features/game/components/icons/Square"
import { ANSWERS_COLORS } from "@rahoot/web/features/game/utils/constants"
import { functions } from "@rahoot/web/lib/firebase"
import { httpsCallable } from "firebase/functions"
import toast from "react-hot-toast"
import clsx from "clsx"

const Icons = [Triangle, Rhombus, Circle, Square]

type PartialQuestion = Quizz["questions"][number];

const CreatorPage = () => {
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

  useEffect(() => {
    if (location.state?.quizz) {
      const q = location.state.quizz as QuizzWithId
      setId(q.id)
      setSubject(q.subject)
      setClassicMode(q.settings?.classicMode || false)
      setTheme(q.settings?.theme || "default")
      setQuestions(
        q.questions.map((question) => ({
          type: question.type || "quiz",
          question: question.question,
          answers: question.answers,
          solution: question.solution,
          image: question.image,
          video: question.video,
          audio: question.audio,
          cooldown: question.cooldown || 5,
          time: question.time || 15,
        })),
      )
    }
  }, [location.state?.quizz])

  // Sync draft to local storage
  useEffect(() => {
    if (!id && !isSaving) {
      localStorage.setItem(
        "draft_quizz",
        JSON.stringify({
          subject,
          settings: { classicMode, theme },
          questions,
        }),
      )
    }
  }, [subject, classicMode, theme, questions, isSaving, id])

  const handleSave = async () => {
    const quizData: Quizz & { id?: string } = {
      ...(id ? { id } : {}),
      subject,
      settings: {
        theme,
        classicMode,
      },
      questions,
    }

    setIsSaving(true)
    const loadingToast = toast.loading("Saving quiz...")

    try {
        const saveQuiz = httpsCallable(functions, "saveQuiz")
        await saveQuiz(quizData)

        toast.success("Quiz saved successfully!", { id: loadingToast })

        if (!id) {
            localStorage.removeItem("draft_quizz")
        }

        navigate("/manager")
    } catch (error: any) {
        toast.error(error.message || "Failed to save quiz", { id: loadingToast })
    } finally {
        setIsSaving(false)
    }
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
        time: 15,
      },
    ])
    setSelectedIdx(questions.length)
  }

  const updateQuestion = (updates: Partial<PartialQuestion>) => {
    const newQuestions = [...questions]
    newQuestions[selectedIdx] = { ...newQuestions[selectedIdx], ...updates }
    setQuestions(newQuestions)
  }

  const removeQuestion = (idx: number) => {
    const newQuestions = [...questions]
    newQuestions.splice(idx, 1)
    setQuestions(newQuestions)
    setSelectedIdx(Math.max(0, idx - 1))
  }

  const currentQ = questions[selectedIdx]

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden font-display">
      {/* Sidebar: Question List */}
      <div className="w-80 bg-slate-900 border-r border-white/10 flex flex-col h-full z-10 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
          <h2 className="text-xl font-black text-white/90 uppercase tracking-widest flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-primary text-slate-900 flex items-center justify-center">
              Q
            </span>
            Questions
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 space-y-1">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className={clsx(
                "group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300",
                selectedIdx === idx
                  ? "bg-primary text-slate-950 shadow-lg shadow-primary/20 scale-100"
                  : "bg-white/5 hover:bg-white/10 text-white/70 hover:scale-[1.02]",
              )}
              onClick={() => setSelectedIdx(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedIdx(idx)
                }
              }}
              aria-label={`Select Question ${idx + 1}`}
            >
              <div
                className={clsx(
                  "font-black text-lg w-8 text-center",
                  selectedIdx === idx ? "text-slate-900" : "text-white/30",
                )}
              >
                {idx + 1}
              </div>
              <div className="flex-1 truncate font-bold text-sm">
                {q.question || "Empty Question"}
              </div>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeQuestion(idx)
                  }}
                  className={clsx(
                      "opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded-lg transition-all",
                      selectedIdx === idx && "hover:bg-red-500/20 text-red-600"
                  )}
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

              <ImageUploader
                currentUrl={currentQ.image}
                onImageChange={(url) => updateQuestion({ image: url })}
                quizzId={id || "new"}
              />

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
