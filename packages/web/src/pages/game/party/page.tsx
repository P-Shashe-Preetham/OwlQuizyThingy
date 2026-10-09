import { trackEvent } from "@rahoot/web/features/telemetry/tinybird"
import GameWrapper from "@rahoot/web/features/game/components/GameWrapper"
import { useFirebaseGame } from "@rahoot/web/features/game/contexts/socketProvider"
import { usePlayerStore } from "@rahoot/web/features/game/stores/player"
import { useQuestionStore } from "@rahoot/web/features/game/stores/question"
import {
  GAME_STATE_COMPONENTS,
  isKeyOf,
} from "@rahoot/web/features/game/utils/constants"
import toast from "react-hot-toast"
import { useNavigate, useParams } from "react-router"

const PlayerGamePage = () => {
  const navigate = useNavigate()

  const { gameId: gameIdParam }: { gameId?: string } = useParams()
  const { status, setPlayer, setGameId, setStatus, reset } = usePlayerStore()
  const { setQuestionStates } = useQuestionStore()

  useEvent("connect", () => {
    if (gameIdParam) {
      /* No-op */
    }
  })

  useEvent(
    "player:successReconnect",
    ({ gameId, status, player, currentQuestion }) => {
      setGameId(gameId)
      setStatus(status.name, status.data)
      setPlayer(player)
      setQuestionStates(currentQuestion)
      trackEvent("reconnect_success", { gameId })
    },
  )



  if (!gameIdParam) {
    return null
  }

  const CurrentComponent =
    status && isKeyOf(GAME_STATE_COMPONENTS, status.name)
      ? GAME_STATE_COMPONENTS[status.name]
      : null

  return (
    <GameWrapper statusName={status?.name}>
      {CurrentComponent && <CurrentComponent data={status!.data as never} />}
    </GameWrapper>
  )
}

export default PlayerGamePage
