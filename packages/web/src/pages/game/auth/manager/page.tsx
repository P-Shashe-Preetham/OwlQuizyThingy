import type { QuizzWithId } from "@rahoot/common/types/game"
import { STATUS } from "@rahoot/common/types/game/status"
import ManagerPassword from "@rahoot/web/features/game/components/create/ManagerPassword"
import SelectQuizz from "@rahoot/web/features/game/components/create/SelectQuizz"
import {
  useEvent,
  useSocket,
} from "@rahoot/web/features/game/contexts/socketProvider"
import { useManagerStore } from "@rahoot/web/features/game/stores/manager"
import { useState } from "react"
import { useNavigate, Link } from "react-router"

const ManagerAuthPage = () => {
  const { setGameId, setStatus } = useManagerStore()
  const navigate = useNavigate()
  const { socket } = useSocket()

  const [isAuth, setIsAuth] = useState(false)
  const [quizzList, setQuizzList] = useState<QuizzWithId[]>([])

  useEvent("manager:quizzList", (quizzList) => {
    setIsAuth(true)
    setQuizzList(quizzList)
  })

  useEvent("manager:gameCreated", ({ gameId, inviteCode }) => {
    setGameId(gameId)
    setStatus(STATUS.SHOW_ROOM, { text: "Waiting for the players", inviteCode })
    navigate(`/party/manager/${gameId}`)
  })

  const handleAuth = (password: string) => {
    socket?.emit("manager:auth", password)
  }
  const handleCreate = (quizzId: string) => {
    console.log("quizzId", quizzId)
    socket?.emit("game:create", quizzId)
  }

  if (!isAuth) {
    return <ManagerPassword onSubmit={handleAuth} />
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <SelectQuizz quizzList={quizzList} onSelect={handleCreate} />
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
