import GameWrapper from "@rahoot/web/features/game/components/GameWrapper"
import { useFirebaseGame } from "@rahoot/web/features/game/contexts/socketProvider"
import { usePlayerStore } from "@rahoot/web/features/game/stores/player"
import { useQuestionStore } from "@rahoot/web/features/game/stores/question"
import {
  GAME_STATE_COMPONENTS,
  isKeyOf,
} from "@rahoot/web/features/game/utils/constants"
import { useEffect } from "react"
import { useParams } from "react-router"

const PlayerGamePage = () => {
  const { gameId: gameIdParam }: { gameId?: string } = useParams()
  const { status, setPlayer, setGameId, setStatus } = usePlayerStore()
  const { setQuestionStates } = useQuestionStore()

  const { gameState, clientId } = useFirebaseGame()

  useEffect(() => {
    if (gameIdParam) {
      setGameId(gameIdParam)
    }
  }, [gameIdParam, setGameId])

  useEffect(() => {
    if (gameState && clientId) {
      // Find current player in game state
      if (gameState.players && gameState.players[clientId]) {
          setPlayer({
              id: clientId,
              ...gameState.players[clientId]
          })
      }

      const statusData = {
          // Add logic to populate this correctly based on state if needed
          text: "",
          // Pass down public question data
          ...gameState.currentQuestionData
      }
      setStatus(gameState.status, statusData)

      if (gameState.currentQuestionData) {
          setQuestionStates(gameState.currentQuestionData)
      }
    }
  }, [gameState, clientId, setStatus, setPlayer, setQuestionStates])

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
