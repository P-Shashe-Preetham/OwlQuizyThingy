import type { ManagerStatusDataMap } from "@rahoot/common/types/game/status"
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react"
import { useEffect, useState } from "react"

type Props = {
  data: ManagerStatusDataMap["SHOW_LEADERBOARD"]
}

const AnimatedPoints = ({ from, to }: { from: number; to: number }) => {
  const spring = useSpring(from, { stiffness: 1000, damping: 30 })
  const display = useTransform(spring, (value) => Math.round(value))
  const [displayValue, setDisplayValue] = useState(from)

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(to)

      return undefined
    }

    spring.set(to)
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest)
    })

    return unsubscribe
  }, [to, spring, display, prefersReducedMotion])

  return <span className="drop-shadow-md">{displayValue}</span>
}

const Leaderboard = ({ data: { oldLeaderboard, leaderboard } }: Props) => {
  const [displayedLeaderboard, setDisplayedLeaderboard] =
    useState(oldLeaderboard)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setDisplayedLeaderboard(oldLeaderboard)
    setIsAnimating(false)

    const timer = setTimeout(() => {
      setIsAnimating(true)
      setDisplayedLeaderboard(leaderboard)
    }, 1600)

    return () => {
      clearTimeout(timer)
    }
  }, [oldLeaderboard, leaderboard])

  return (
    <section className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-2">
      <h2 className="mb-6 text-5xl font-bold text-white drop-shadow-md">
        Leaderboard
      </h2>
      <div className="flex w-full flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {displayedLeaderboard.map(({ id, username, points }) => {
            const oldIndex = oldLeaderboard.findIndex((u) => u.id === id)
            const newIndex = leaderboard.findIndex((u) => u.id === id)
            let rankIndicator = "-"

            if (oldIndex !== -1 && newIndex !== -1) {
              if (newIndex < oldIndex) {rankIndicator = "↑"}
              else if (newIndex > oldIndex) {rankIndicator = "↓"}
            }

            return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 50,
                transition: { duration: 0.2 },
              }}
              transition={{
                layout: {
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                },
              }}
              className="bg-primary flex w-full justify-between rounded-md p-3 text-2xl font-bold text-white"
            >
              <span className="drop-shadow-md">
                <span className="mr-2 opacity-70 text-lg">{rankIndicator}</span>
                {username}
              </span>
              {isAnimating ? (
                <AnimatedPoints
                  from={oldLeaderboard.find((u) => u.id === id)?.points || 0}
                  to={leaderboard.find((u) => u.id === id)?.points || 0}
                />
              ) : (
                <span className="drop-shadow-md">{points}</span>
              )}
            </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </section>
  )
}

export default Leaderboard
