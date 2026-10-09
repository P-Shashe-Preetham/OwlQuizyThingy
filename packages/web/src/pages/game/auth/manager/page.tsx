import type { QuizzWithId } from "@rahoot/common/types/game"
import { STATUS } from "@rahoot/common/types/game/status"
import ManagerPassword from "@rahoot/web/features/game/components/create/ManagerPassword"
import SelectQuizz from "@rahoot/web/features/game/components/create/SelectQuizz"
import GameSettingsModal from "@rahoot/web/features/game/components/create/GameSettingsModal"
import { useManagerStore } from "@rahoot/web/features/game/stores/manager"
import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router"
import { auth, db, functions } from "@rahoot/web/lib/firebase"
import { signInWithEmailAndPassword, onAuthStateChanged, type User } from "firebase/auth"
import { collection, getDocs } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import toast from "react-hot-toast"

const ManagerAuthPage = () => {
  const { setGameId, setStatus } = useManagerStore()
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)
  const [isAuth, setIsAuth] = useState(false)
  const [quizzList, setQuizzList] = useState<QuizzWithId[]>([])
  const [selectedQuizzId, setSelectedQuizzId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)

      if (currentUser && !currentUser.isAnonymous) {
        setIsAuth(true)
        fetchQuizzes()
      } else {
        setIsAuth(false)
      }

      setIsLoading(false)
    })


return () => unsubscribe()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "quizzes"))
      const quizzes: QuizzWithId[] = []
      querySnapshot.forEach((doc) => {
        quizzes.push({ id: doc.id, ...doc.data() } as QuizzWithId)
      })
      setQuizzList(quizzes)
    } catch (error) {
      console.error("Failed to fetch quizzes", error)
      toast.error("Failed to fetch quizzes")
    }
  }

  const handleAuth = async (password: string) => {
    try {
      await signInWithEmailAndPassword(auth, "manager@rahoot.com", password)
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials")
    }
  }

  const handleCreate = (quizzId: string) => {
    setSelectedQuizzId(quizzId)
  }

  const handleConfirmSettings = async (quizzId: string, settings: any) => {
    try {
      const createGame = httpsCallable(functions, "createGame")
      const result = await createGame({ quizzId })
      const data = result.data as { gameId: string; inviteCode: string }

      setGameId(data.gameId)
      setStatus(STATUS.SHOW_ROOM, {
        text: "Waiting for the players",
        inviteCode: data.inviteCode,
      })
      navigate(`/party/manager/${data.gameId}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to create game")
    }
  }

  if (isLoading) {
    return <div className="text-white text-center">Loading...</div>
  }

  if (!isAuth) {
    return <ManagerPassword onSubmit={handleAuth} />
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {selectedQuizzId ? (
        <GameSettingsModal
          quizzId={selectedQuizzId}
          onConfirm={handleConfirmSettings}
          onCancel={() => setSelectedQuizzId(null)}
        />
      ) : (
        <SelectQuizz quizzList={quizzList} onSelect={handleCreate} />
      )}
      <Link
        to="/creator"
        className="z-20 w-full max-w-md bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition-all flex items-center justify-center gap-2 no-underline"
      >
        <span className="text-2xl">+</span> Create New Quiz
      </Link>
    </div>
  )
}

export default ManagerAuthPage
