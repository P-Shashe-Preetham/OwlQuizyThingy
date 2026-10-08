import type { PlayerStatusDataMap } from "@rahoot/common/types/game/status"
import { useState } from "react"
import { useEvent } from "@rahoot/web/features/game/contexts/socketProvider"
import Loader from "@rahoot/web/shared/components/Loader"

type Props = {
  data: PlayerStatusDataMap["WAIT"]
}

const Wait = ({ data: { text } }: Props) => {
  const [players, setPlayers] = useState(0)

  useEvent("game:totalPlayers", (count) => {
    setPlayers(count)
  })

  return (
  <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center">
    <Loader className="h-30" />
    <h2 className="mt-5 text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
      {text}
    </h2>
    <p className="mt-2 text-xl text-white font-bold drop-shadow-md">Players Joined: {players}</p>
  </section>
  )
}

export default Wait
