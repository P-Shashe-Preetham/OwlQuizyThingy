import clsx from "clsx"
import { useEffect } from "react"
import type { CommonStatusDataMap } from "@rahoot/common/types/game/status"

type Props = {
  data: CommonStatusDataMap["SHOW_START"]
}

const Start = ({ data: { subject } }: Props) => {
  useEffect(() => {
    // Only handling title here, any timers are handled by backend state
  }, [])

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative">
        <h2 className="title-animated-bounce z-10 mx-auto w-full text-center text-4xl font-extrabold text-white drop-shadow-xl md:text-5xl lg:text-7xl">
          {subject}
        </h2>
        <span
          className={clsx(
            "title-animated-scale absolute top-0 -z-10 mx-auto w-full text-center text-4xl font-extrabold text-black/10 md:text-5xl lg:text-7xl",
          )}
        >
          {subject}
        </span>
      </div>
    </div>
  )
}

export default Start
