import GameWrapper from "@rahoot/web/features/game/components/GameWrapper"
import { useFirebaseGame } from "@rahoot/web/features/game/contexts/socketProvider"
import { useManagerStore } from "@rahoot/web/features/game/stores/manager"
import {
  GAME_STATE_COMPONENTS_MANAGER,
  isKeyOf,
} from "@rahoot/web/features/game/utils/constants"
import { useEffect } from "react"
import { useParams } from "react-router"
import { STATUS } from "@rahoot/common/types/game/status"
import { functions } from "@rahoot/web/lib/firebase"
import { httpsCallable } from "firebase/functions"

const ManagerGamePage = () => {
  const { gameId: gameIdParam }: { gameId?: string } = useParams()

  const { gameState } = useFirebaseGame()
  const { setGameId, setStatus, setPlayers, status } =
    useManagerStore()

  useEffect(() => {
    if (gameIdParam) {
      setGameId(gameIdParam)
    }
  }, [gameIdParam, setGameId])

  useEffect(() => {
    if (gameState) {
      const statusData = {
          text: gameState.status === STATUS.WAIT ? "Waiting for the players" : "",
          inviteCode: gameState.inviteCode,
          // Provide current question data to the components
          ...gameState.currentQuestionData
      }
      setStatus(gameState.status, statusData)

      if (gameState.players) {
          const playersList = Object.entries(gameState.players).map(([id, data]: [string, any]) => ({
              id,
              ...data
          }))
          setPlayers(playersList)
      } else {
          setPlayers([])
      }
    }
  }, [gameState, setStatus, setPlayers])

  const handleSkip = async () => {
    if (!gameIdParam) {
      return
    }

    try {
      const advanceGame = httpsCallable(functions, "advanceGame")
        await advanceGame({ gameId: gameIdParam })
    } catch (e) {
        console.error("Failed to advance game", e)
    }
  }

  const CurrentComponent =
    status && isKeyOf(GAME_STATE_COMPONENTS_MANAGER, status.name)
      ? GAME_STATE_COMPONENTS_MANAGER[status.name]
      : null

  if (!gameIdParam) {
    return null
  }

  return (
    <GameWrapper statusName={status?.name} manager={true}>
      {CurrentComponent && <CurrentComponent data={status!.data as never} />}

      <button
        onClick={handleSkip}
        className="absolute right-2 bottom-2 md:right-10 md:bottom-10 z-10 font-bold bg-white text-black p-2 md:p-4 rounded-md shadow-2xl hover:scale-105 active:scale-95 transition-transform"
      >
        <span className="hidden md:inline">Next Step </span>{" "}
        <span className="translate-y-1">⏭️</span>
      </button>
    </GameWrapper>
  )
}

export default ManagerGamePage
