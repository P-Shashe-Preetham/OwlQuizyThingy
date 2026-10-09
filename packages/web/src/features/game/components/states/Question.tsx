import type { CommonStatusDataMap } from "@rahoot/common/types/game/status"
import { SFX_SHOW_SOUND } from "@rahoot/web/features/game/utils/constants"
import { useEffect, useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

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


  const containerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    gsap.fromTo(".anim-show",
      { y: 50, opacity: 0, scale: 0.8 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" }
    )

    if (image) {
      gsap.fromTo("img",
        { opacity: 0, scale: 0.9, rotationX: 15 },
        { opacity: 1, scale: 1, rotationX: 0, duration: 1, delay: 0.2, ease: "power3.out" }
      )
    }
  }, { scope: containerRef, dependencies: [question, image] })

  if (player) {
    return (
      <section ref={containerRef} className="relative mx-auto flex h-full w-full max-w-7xl flex-1 flex-col items-center px-4">
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          <h2 aria-live="polite" className="anim-show text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
            Get Ready!
          </h2>
        </div>
      </section>
    )
  }

  return (
    <section ref={containerRef} className="relative mx-auto flex h-full w-full max-w-7xl flex-1 flex-col items-center px-4">
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
