import type { ManagerStatusDataMap } from "@rahoot/common/types/game/status"
import {
  SFX_PODIUM_FIRST,
  SFX_PODIUM_SECOND,
  SFX_PODIUM_THREE,
  SFX_SNEAR_ROOL,
} from "@rahoot/web/features/game/utils/constants"
import useScreenSize from "@rahoot/web/hooks/useScreenSize"
import clsx from "clsx"
import { useEffect, useState } from "react"
import ReactConfetti from "react-confetti"
import useSound from "use-sound"

type Props = {
  data: ManagerStatusDataMap["FINISHED"];
};

const usePodiumAnimation = (topLength: number) => {
  const [apparition, setApparition] = useState(0)

  const [sfxtThree] = useSound(SFX_PODIUM_THREE, { volume: 0.2 })
  const [sfxSecond] = useSound(SFX_PODIUM_SECOND, { volume: 0.2 })
  const [sfxRool, { stop: sfxRoolStop }] = useSound(SFX_SNEAR_ROOL, {
    volume: 0.2,
  })
  const [sfxFirst] = useSound(SFX_PODIUM_FIRST, { volume: 0.2 })

  useEffect(() => {
    const actions: Partial<Record<number, () => void>> = {
      4: () => {
        sfxRoolStop()
        sfxFirst()
      },
      3: sfxRool,
      2: sfxSecond,
      1: sfxtThree,
    }

    actions[apparition]?.()
  }, [apparition, sfxFirst, sfxSecond, sfxtThree, sfxRool, sfxRoolStop])

  useEffect(() => {
    if (topLength < 3) {
      setApparition(4)

      return
    }

    if (apparition >= 4) {
      return
    }

    const interval = setInterval(() => {
      setApparition((value) => value + 1)
    }, 2000)


    return () => clearInterval(interval)
  }, [apparition, topLength])

  return apparition
}

const getRowStyles = (i: number) => {
  if (i === 0) {
    return "bg-amber-500/20 border-amber-500/50 text-amber-100"
  }

  if (i === 1) {
    return "bg-zinc-500/20 border-zinc-500/50 text-zinc-100"
  }

  if (i === 2) {
    return "bg-amber-800/20 border-amber-800/50 text-amber-200"
  }

  return "bg-white/5 text-white"
}

const getBadgeStyles = (i: number) => {
  if (i === 0) {
    return "bg-amber-500 text-amber-950"
  }

  if (i === 1) {
    return "bg-zinc-400 text-zinc-950"
  }

  if (i === 2) {
    return "bg-amber-700 text-amber-950"
  }

  return "bg-white/20"
}

const Podium = ({ data: { subject, top } }: Props) => {
  const apparition = usePodiumAnimation(top.length)

  const { width, height } = useScreenSize()

  return (
    <>
      {apparition >= 4 && (
        <ReactConfetti
          width={width}
          height={height}
          className="h-full w-full"
        />
      )}

      {apparition >= 3 && top.length >= 3 && (
        <div className="pointer-events-none absolute min-h-dvh w-full overflow-hidden">
          <div className="spotlight"></div>
        </div>
      )}

      <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-between z-40 pb-10">
        <h2 className="anim-show text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl mt-10">
          {subject}
        </h2>

        {apparition >= 4 && (
          <div className="anim-show w-full max-w-3xl bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 border border-white/10 mt-10 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6 text-center border-b border-white/10 pb-4">
              Final Results
            </h3>
            <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-2">
              {top.map((p, i) => (
                <div
                  key={p.id}
                  className={clsx(
                    "flex items-center justify-between p-4 rounded-xl border border-white/5",
                    getRowStyles(i),
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={clsx(
                        "w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm",
                        getBadgeStyles(i),
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="font-bold text-xl">{p.username}</span>
                  </div>
                  <span className="font-black text-2xl font-mono">
                    {p.points}
                  </span>
                </div>
              ))}
              {top.length === 0 && (
                <p className="text-center text-white/50 py-10 font-bold">
                  No players participated
                </p>
              )}
            </div>
          </div>
        )}

        <div
          style={{ gridTemplateColumns: `repeat(${top.length}, 1fr)` }}
          className={`grid w-full max-w-200 flex-1 items-end justify-center justify-self-end overflow-x-visible overflow-y-hidden`}
        >
          {top[1] && (
            <div
              className={clsx(
                "z-20 flex h-[50%] w-full translate-y-full flex-col items-center justify-center gap-3 opacity-0 transition-all",
                { "translate-y-0! opacity-100": apparition >= 2 },
              )}
            >
              <p
                className={clsx(
                  "overflow-visible text-center text-2xl font-bold whitespace-nowrap text-white drop-shadow-lg md:text-4xl",
                  {
                    "anim-balanced": apparition >= 4,
                  },
                )}
              >
                {top[1].username}
              </p>
              <div className="bg-primary flex h-full w-full flex-col items-center gap-4 rounded-t-md pt-6 text-center shadow-2xl">
                <p className="flex aspect-square h-14 items-center justify-center rounded-full border-4 border-zinc-400 bg-zinc-500 text-3xl font-bold text-white drop-shadow-lg">
                  <span className="drop-shadow-md">2</span>
                </p>
                <p className="text-2xl font-bold text-white drop-shadow-lg">
                  {top[1].points}
                </p>
              </div>
            </div>
          )}

          <div
            className={clsx(
              "z-30 flex h-[60%] w-full translate-y-full flex-col items-center gap-3 opacity-0 transition-all",
              {
                "translate-y-0! opacity-100": apparition >= 3,
              },
              {
                "md:min-w-64": top.length < 2,
              },
            )}
          >
            <p
              className={clsx(
                "overflow-visible text-center text-2xl font-bold whitespace-nowrap text-white opacity-0 drop-shadow-lg md:text-4xl",
                { "anim-balanced opacity-100": apparition >= 4 },
              )}
            >
              {top[0].username}
            </p>
            <div className="bg-primary flex h-full w-full flex-col items-center gap-4 rounded-t-md pt-6 text-center shadow-2xl">
              <p className="flex aspect-square h-14 items-center justify-center rounded-full border-4 border-amber-400 bg-amber-300 text-3xl font-bold text-white drop-shadow-lg">
                <span className="drop-shadow-md">1</span>
              </p>
              <p className="text-2xl font-bold text-white drop-shadow-lg">
                {top[0].points}
              </p>
            </div>
          </div>

          {top[2] && (
            <div
              className={clsx(
                "z-10 flex h-[40%] w-full translate-y-full flex-col items-center gap-3 opacity-0 transition-all",
                {
                  "translate-y-0! opacity-100": apparition >= 1,
                },
              )}
            >
              <p
                className={clsx(
                  "overflow-visible text-center text-2xl font-bold whitespace-nowrap text-white drop-shadow-lg md:text-4xl",
                  {
                    "anim-balanced": apparition >= 4,
                  },
                )}
              >
                {top[2].username}
              </p>
              <div className="bg-primary flex h-full w-full flex-col items-center gap-4 rounded-t-md pt-6 text-center shadow-2xl">
                <p className="flex aspect-square h-14 items-center justify-center rounded-full border-4 border-amber-800 bg-amber-700 text-3xl font-bold text-white drop-shadow-lg">
                  <span className="drop-shadow-md">3</span>
                </p>

                <p className="text-2xl font-bold text-white drop-shadow-lg">
                  {top[2].points}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default Podium
