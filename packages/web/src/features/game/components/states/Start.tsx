import type { CommonStatusDataMap } from "@rahoot/common/types/game/status"
import { useEvent } from "@rahoot/web/features/game/contexts/socketProvider"
import { SFX_BOUMP_SOUND } from "@rahoot/web/features/game/utils/constants"
import clsx from "clsx"
import { useState, useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import useSound from "use-sound"

type Props = {
  data: CommonStatusDataMap["SHOW_START"]
}

const Start = ({ data: { time, subject } }: Props) => {
  const [showTitle, setShowTitle] = useState(true)
  const [cooldown, setCooldown] = useState(time)

  const [sfxBoump] = useSound(SFX_BOUMP_SOUND, {
    volume: 0.2,
  })

  useEvent("game:startCooldown", () => {
    sfxBoump()
    setShowTitle(false)
  })

  useEvent("game:cooldown", (sec) => {
    sfxBoump()
    setCooldown(sec)
  })


  const containerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    gsap.fromTo(".anim-show",
      { scale: 0, opacity: 0, rotation: -90 },
      { scale: 1, opacity: 1, rotation: 0, duration: 1, ease: "elastic.out(1, 0.5)" }
    )
  }, { scope: containerRef, dependencies: [showTitle, cooldown] })

  return (
    <section ref={containerRef} className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center">

      {showTitle ? (
        <h2 className="anim-show text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
          {subject}
        </h2>
      ) : (
        <>
          <div
            className={clsx(
              `anim-show bg-primary aspect-square h-32 transition-all md:h-60`,
            )}
            style={{
              transform: `rotate(${45 * (time - cooldown)}deg)`,
            }}
          ></div>
          <span className="absolute text-6xl font-bold text-white drop-shadow-md md:text-8xl">
            {cooldown}
          </span>
        </>
      )}
    </section>
  )
}

export default Start
