import PlayerGamePin from "@rahoot/web/features/game/components/join/GamePin"
import PlayerRoom from "@rahoot/web/features/game/components/join/Room"
import PlayerUsername from "@rahoot/web/features/game/components/join/Username"
import { usePlayerStore } from "@rahoot/web/features/game/stores/player"
import { STATUS } from "@rahoot/common/types/game/status"
import { useNavigate } from "react-router"
import { useEffect } from "react"
import { useFirebaseGame } from "@rahoot/web/features/game/contexts/socketProvider"

const PlayerAuthPage = () => {
  const navigate = useNavigate()
  const { status, gameId } = usePlayerStore()
  const { gameState, clientId } = useFirebaseGame()

  useEffect(() => {
    if (gameState && gameState.status !== STATUS.WAIT && clientId) {
      if (gameState.players && gameState.players[clientId]) {
          navigate(`/party/${gameId}`)
      }
    }
  }, [gameState, gameId, clientId, navigate])

  if (status?.name === STATUS.WAITING) {
    return <PlayerRoom />
  }

  if (gameId) {
    return <PlayerUsername />
  }

  return <PlayerGamePin />
}

export default PlayerAuthPage
