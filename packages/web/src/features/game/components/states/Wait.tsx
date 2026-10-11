import type { CommonStatusDataMap } from "@rahoot/common/types/game/status"
import { useEffect } from "react"
import { useParams } from "react-router"

type Props = {
  data: CommonStatusDataMap["WAITING"]
}

const Wait = ({ data: { text } }: Props) => {
  const { gameId }: { gameId?: string } = useParams()

  useEffect(() => {
    console.log("waiting_screen_viewed", { gameId })
  }, [gameId])

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative">
        <h2 className="title-animated-bounce z-10 mx-auto w-full text-center text-4xl font-extrabold text-white drop-shadow-xl md:text-5xl lg:text-7xl">
          {text}
        </h2>
      </div>
    </div>
  )
}

export default Wait
