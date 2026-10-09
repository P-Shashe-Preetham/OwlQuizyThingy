import GameWrapper from "@rahoot/web/features/game/components/GameWrapper"
import { useFirebaseGame } from "@rahoot/web/features/game/contexts/socketProvider"
import { useManagerStore } from "@rahoot/web/features/game/stores/manager"
import { useQuestionStore } from "@rahoot/web/features/game/stores/question"
import {
  GAME_STATE_COMPONENTS_MANAGER,
  MANAGER_SKIP_EVENTS,
  isKeyOf,
} from "@rahoot/web/features/game/utils/constants"
import toast from "react-hot-toast"
import { useNavigate, useParams } from "react-router"

const ManagerGamePage = () => {
  const navigate = useNavigate()
  const { gameId: gameIdParam }: { gameId?: string } = useParams()

  const { gameId, status, setGameId, setStatus, setPlayers, reset } =
    useManagerStore()
  const { setQuestionStates } = useQuestionStore()

  useEvent("game:status", ({ name, data }) => {
    if (name in GAME_STATE_COMPONENTS_MANAGER) {
      setStatus(name, data)
    }
  })

  useEvent("connect", () => {
    if (gameIdParam) {
      /* No-op */
    }
  })

  useEvent(
    "manager:successReconnect",
    ({ gameId, status, players, currentQuestion }) => {
      setGameId(gameId)
      setStatus(status.name, status.data)
      setPlayers(players)
      setQuestionStates(currentQuestion)
    },
  )


  useEvent("manager:errorMessage", (message) => {
    toast.error(message)
  })

  const handleSkip = () => {
    if (!gameId || !status) {
      return
    }

    if (isKeyOf(MANAGER_SKIP_EVENTS, status.name)) {
      /* No-op */
    }
  }

  const CurrentComponent =
    status && isKeyOf(GAME_STATE_COMPONENTS_MANAGER, status.name)
      ? GAME_STATE_COMPONENTS_MANAGER[status.name]
      : null

  return (
    <GameWrapper statusName={status?.name} onNext={handleSkip} manager>
      {CurrentComponent && <CurrentComponent data={status!.data as never} />}
    </GameWrapper>
  )
}

export default ManagerGamePage
