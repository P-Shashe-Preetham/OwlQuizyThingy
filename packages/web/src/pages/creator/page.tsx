import { useState } from "react"
import { useNavigate } from "react-router"
import type { Quizz } from "@rahoot/common/types/game"
import Triangle from "@rahoot/web/features/game/components/icons/Triangle"
import Rhombus from "@rahoot/web/features/game/components/icons/Rhombus"
import Circle from "@rahoot/web/features/game/components/icons/Circle"
import Square from "@rahoot/web/features/game/components/icons/Square"
import { ANSWERS_COLORS } from "@rahoot/web/features/game/utils/constants"
import { useSocket, useEvent } from "@rahoot/web/features/game/contexts/socketProvider"
import toast from "react-hot-toast"
import clsx from "clsx"

const Icons = [Triangle, Rhombus, Circle, Square]

type PartialQuestion = Quizz['questions'][number]

const CreatorPage = () => {
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [subject, setSubject] = useState("My Awesome Quiz")
  const [classicMode, setClassicMode] = useState(false)
  const [theme, setTheme] = useState("default")
  const [questions, setQuestions] = useState<PartialQuestion[]>([
    {
      question: "What is 2 + 2?",
      answers: ["3", "4", "5", "6"],
      solution: 1,
      cooldown: 5,
      time: 20,
    }
  ])
  const [selectedIdx, setSelectedIdx] = useState(0)

  useEvent("manager:quizzSaved", ({ subject }) => {
    toast.success(`Quiz "${subject}" saved successfully!`)
  })

  useEvent("manager:errorMessage", (message) => {
    toast.error(message)
  })

  const handleSave = () => {
    if (!socket) return
    
    const quizData: Quizz = {
      subject,
      settings: {
        theme,
        classicMode,
      },
      questions: questions.map(q => ({
        ...q,
        answers: q.answers.filter(a => a.trim() !== "") // Clean empty answers
      }))
    }

    socket.emit("manager:saveQuizz", quizData)
  }

  const addQuestion = () => {
    console.log("Adding question...")
    setQuestions([...questions, {
      question: "New Question",
      answers: ["Option 1", "Option 2", "Option 3", "Option 4"],
      solution: 0,
      cooldown: 5,
      time: 20,
    }])
    setSelectedIdx(questions.length)
  }

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return
    const newQuestions = questions.filter((_, i) => i !== idx)
    setQuestions(newQuestions)
    setSelectedIdx(Math.max(0, idx - 1))
  }

  const updateQuestion = (data: Partial<PartialQuestion>) => {
    const newQuestions = [...questions]
    newQuestions[selectedIdx] = { ...newQuestions[selectedIdx], ...data }
    setQuestions(newQuestions)
  }

  const currentQ = questions[selectedIdx]

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 shadow-xl bg-slate-800/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="text-xl font-black italic hover:text-primary transition-colors">
            OwlQuizThingy
          </button>
          <div className="h-6 w-[2px] bg-white/10" />
          <input 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-transparent text-xl font-semibold focus:outline-none border-b border-transparent focus:border-primary px-2 transition-all w-64"
            placeholder="Quiz Subject..."
          />
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate("/manager")} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all font-medium">Exit</button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all font-bold"
          >
            Save Quiz
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Questions List & Settings */}
        <aside className="w-72 border-r border-white/10 bg-slate-800/30 overflow-y-auto p-4 flex flex-col gap-6 shadow-inner">
          {/* Quiz Settings Section */}
          <div className="space-y-4 pb-6 border-b border-white/10">
            <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest pl-1">Quiz Settings</h3>
            
            {/* Classic Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex flex-col">
                <span className="text-sm font-bold">Classic Mode</span>
                <span className="text-[10px] text-slate-400">Shapes only for players</span>
              </div>
              <button 
                onClick={() => setClassicMode(!classicMode)}
                className={clsx(
                  "w-12 h-6 rounded-full transition-all relative",
                  classicMode ? "bg-primary" : "bg-slate-700"
                )}
              >
                <div className={clsx(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  classicMode ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            {/* Theme Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Theme</label>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-slate-700 p-2 rounded-lg border border-white/10 text-sm font-bold focus:border-primary focus:outline-none"
              >
                <option value="default">Default Orange</option>
                <option value="midnight">Midnight Blue</option>
                <option value="sunset">Sunset Glow</option>
                <option value="galaxy">Deep Purple</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest pl-1">Questions ({questions.length})</h3>
          </div>
          {questions.map((q, i) => (
            <div 
              key={i}
              onClick={() => setSelectedIdx(i)}
              className={clsx(
                "group relative p-4 rounded-xl cursor-pointer border-2 transition-all duration-200",
                selectedIdx === i 
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/5" 
                  : "border-transparent bg-white/5 hover:bg-white/10"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 italic">#Q{i + 1}</span>
                {questions.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeQuestion(i); }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-1"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="text-sm line-clamp-2 leading-snug font-medium pr-4">{q.question || "Empty Question"}</p>
            </div>
          ))}
          <button 
            onClick={addQuestion}
            className="w-full py-4 mt-2 rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-slate-400 hover:text-white flex items-center justify-center gap-2 font-bold relative z-30"
          >
            <span className="text-xl">+</span> Add Question
          </button>
        </aside>

        {/* Main Content: Question Editor */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-8 flex flex-col items-center">
          <div className="w-full max-w-4xl space-y-12">
            {/* Question Input */}
            <div className="relative group">
              <textarea 
                value={currentQ.question}
                onChange={(e) => updateQuestion({ question: e.target.value })}
                className="w-full text-center text-4xl font-bold bg-white/5 border-2 border-transparent focus:border-primary/50 rounded-3xl p-10 focus:outline-none transition-all min-h-[160px] resize-none leading-relaxed placeholder:text-white/10 shadow-2xl"
                placeholder="Start typing your question..."
              />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-6 py-1 text-sm font-bold text-slate-500 uppercase tracking-tighter rounded-full border border-white/10 group-focus-within:text-primary transition-colors">Question Text</div>
            </div>

            {/* Multimedia Placeholder */}
            <div className="flex justify-center flex-wrap gap-8">
               <div className="w-80 h-48 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-400 hover:bg-white/10 transition-all cursor-pointer group shadow-xl">
                  <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">🖼️</span>
                  <span className="text-sm font-bold">Image URL</span>
                  <input 
                    className="mt-2 w-3/4 p-1 bg-transparent text-xs text-center border-b border-white/10 focus:outline-none focus:border-primary"
                    placeholder="paste link..."
                    value={currentQ.image || ""}
                    onChange={(e) => updateQuestion({ image: e.target.value })}
                  />
               </div>
               
               {/* Controls */}
               <div className="flex flex-col gap-4 justify-center">
                  <div className="bg-slate-800 p-4 rounded-3xl border border-white/10 shadow-xl">
                    <label className="block text-xs font-black text-slate-500 uppercase mb-3 text-center tracking-widest">Time Limit</label>
                    <select 
                      value={currentQ.time}
                      onChange={(e) => updateQuestion({ time: Number(e.target.value) })}
                      className="bg-slate-900 px-6 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-primary font-bold transition-all w-full text-center text-xl cursor-pointer relative z-30"
                    >
                      <option value={10}>10 sec</option>
                      <option value={20}>20 sec</option>
                      <option value={30}>30 sec</option>
                      <option value={60}>60 sec</option>
                    </select>
                  </div>
                  
                  <div className="bg-slate-800 p-4 rounded-3xl border border-white/10 shadow-xl">
                    <label className="block text-xs font-black text-slate-500 uppercase mb-3 text-center tracking-widest">Points</label>
                    <div className="flex gap-2 justify-center">
                       <button className="px-5 py-2 rounded-xl bg-primary font-bold shadow-lg shadow-primary/20">Standard</button>
                    </div>
                  </div>
               </div>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-6 pb-12">
              {currentQ.answers.map((ans, i) => (
                <div key={i} className={clsx(
                  "relative group flex items-center h-24 rounded-2xl shadow-xl transition-all duration-300 border-4",
                  ANSWERS_COLORS[i],
                  currentQ.solution === i ? "border-white/50 scale-[1.02] shadow-white/10" : "border-white/5 opacity-80 hover:opacity-100 hover:scale-[1.01]"
                )}>
                  <div 
                    className="p-4 cursor-pointer hover:scale-110 transition-transform active:scale-95"
                    onClick={() => updateQuestion({ solution: i })}
                  >
                    <div className={clsx(
                      "w-10 h-10 rounded-full border-2 border-white flex items-center justify-center font-bold text-xl",
                      currentQ.solution === i ? "bg-white text-slate-900" : "bg-transparent text-white"
                    )}>
                      {currentQ.solution === i ? "✓" : ""}
                    </div>
                  </div>
                  <input 
                    value={ans}
                    onChange={(e) => {
                      const newAns = [...currentQ.answers]
                      newAns[i] = e.target.value
                      updateQuestion({ answers: newAns })
                    }}
                    className="flex-1 bg-transparent text-2xl font-bold px-4 focus:outline-none placeholder:text-white/30"
                    placeholder={`Answer ${i + 1}`}
                  />
                  <div className="absolute right-6 opacity-40 pointer-events-none group-focus-within:opacity-100 transition-opacity">
                    {Icons[i] && (
                        (() => {
                            const Icon = Icons[i]
                            return <Icon className="w-8 h-8 text-white fill-current" />
                        })()
                    )}
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
