import type { PlayerStatusDataMap } from "@rahoot/common/types/game/status"
import { useState, useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import Loader from "@rahoot/web/shared/components/Loader"

type Props = {
  data: PlayerStatusDataMap["WAIT"]
}

const Wait = ({ data: { text } }: Props) => {
  const [players, setPlayers] = useState(0)



  const containerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    gsap.fromTo("h2, p",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power2.out" }
    )
  }, { scope: containerRef })

  return (
  <section ref={containerRef} className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center">

    <Loader className="h-30" />
    <h2 className="mt-5 text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
      {text}
    </h2>
    <p className="mt-2 text-xl text-white font-bold drop-shadow-md">Players Joined: {players}</p>
  </section>
  )
}

export default Wait
