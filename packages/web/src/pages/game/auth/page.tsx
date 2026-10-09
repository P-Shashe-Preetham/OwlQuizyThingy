import Room from "@rahoot/web/features/game/components/join/Room"
import Username from "@rahoot/web/features/game/components/join/Username"
import {
  useEvent,
  useSocket,
} from "@rahoot/web/features/game/contexts/socketProvider"
import { usePlayerStore } from "@rahoot/web/features/game/stores/player"

const PlayerAuthPage = () => {
    const { player } = usePlayerStore()



  if (player) {
    return <Username />
  }

  return <Room />
}

export default PlayerAuthPage
