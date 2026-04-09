import type { CommonStatusDataMap } from "@rahoot/common/types/game/status"
import { SFX_SHOW_SOUND } from "@rahoot/web/features/game/utils/constants"
import { useEffect } from "react"
import useSound from "use-sound"
import { usePlayerStore } from "@rahoot/web/features/game/stores/player"

type Props = {
  data: CommonStatusDataMap["SHOW_QUESTION"]
}

const Question = ({ data: { question, image, cooldown } }: Props) => {
  const [sfxShow] = useSound(SFX_SHOW_SOUND, { volume: 0.5 })

  const { player } = usePlayerStore()

  useEffect(() => {
    sfxShow()
  }, [sfxShow])

  if (player) {
    return (
      <section className="relative mx-auto flex h-full w-full max-w-7xl flex-1 flex-col items-center px-4">
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          <h2 className="anim-show text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
            Get Ready!
          </h2>
        </div>
      </section>
    )
  }

  return (
    <section className="relative mx-auto flex h-full w-full max-w-7xl flex-1 flex-col items-center px-4">
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <h2 className="anim-show text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
          {question}
        </h2>

        {Boolean(image) && (
          <img
            alt={question}
            src={image}
            className="max-h-60 w-auto rounded-md sm:max-h-100"
          />
        )}
      </div>
      <div
        className="bg-primary mb-20 h-4 self-start justify-self-end rounded-full"
        style={{ animation: `progressBar ${cooldown}s linear forwards` }}
      ></div>
    </section>
  )
}

export default Question
