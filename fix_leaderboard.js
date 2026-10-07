const fs = require('fs');

let content = fs.readFileSync('packages/web/src/features/game/components/states/Leaderboard.tsx', 'utf8');

content = content.replace(
  `const AnimatedPoints = ({ from, to }: { from: number; to: number }) => {
  const spring = useSpring(from, { stiffness: 1000, damping: 30 })
  const display = useTransform(spring, (value) => Math.round(value))
  const [displayValue, setDisplayValue] = useState(from)

  useEffect(() => {
    spring.set(to)
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest)
    })

    return unsubscribe
  }, [to, spring, display])`,
  `const AnimatedPoints = ({ from, to }: { from: number; to: number }) => {
  const spring = useSpring(from, { stiffness: 1000, damping: 30 })
  const display = useTransform(spring, (value) => Math.round(value))
  const [displayValue, setDisplayValue] = useState(from)

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(to)
      return
    }
    spring.set(to)
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest)
    })

    return unsubscribe
  }, [to, spring, display, prefersReducedMotion])`
);

content = content.replace(
  `          {displayedLeaderboard.map(({ id, username, points }) => (
            <motion.div
              key={id}`,
  `          {displayedLeaderboard.map(({ id, username, points }) => {
            const oldIndex = oldLeaderboard.findIndex((u) => u.id === id)
            const newIndex = leaderboard.findIndex((u) => u.id === id)
            let rankIndicator = "-"
            if (oldIndex !== -1 && newIndex !== -1) {
              if (newIndex < oldIndex) rankIndicator = "↑"
              else if (newIndex > oldIndex) rankIndicator = "↓"
            }

            return (
            <motion.div
              key={id}`
);

content = content.replace(
  `              className="bg-primary flex w-full justify-between rounded-md p-3 text-2xl font-bold text-white"
            >
              <span className="drop-shadow-md">{username}</span>`,
  `              className="bg-primary flex w-full justify-between rounded-md p-3 text-2xl font-bold text-white"
            >
              <span className="drop-shadow-md">
                <span className="mr-2 opacity-70 text-lg">{rankIndicator}</span>
                {username}
              </span>`
);

content = content.replace(
  `              )}
            </motion.div>
          ))}
        </AnimatePresence>`,
  `              )}
            </motion.div>
            )
          })}
        </AnimatePresence>`
);

fs.writeFileSync('packages/web/src/features/game/components/states/Leaderboard.tsx', content);

// Result.tsx
let contentResult = fs.readFileSync('packages/web/src/features/game/components/states/Result.tsx', 'utf8');

contentResult = `import { trackEvent } from "@rahoot/web/features/telemetry/tinybird"\n` + contentResult;

contentResult = contentResult.replace(
  `  useEffect(() => {
    player.updatePoints(myPoints)
    sfxResults()
  }, [myPoints, sfxResults])`,
  `  useEffect(() => {
    player.updatePoints(myPoints)
    trackEvent("round_result", { correct, points, rank })
    sfxResults()
  }, [myPoints, sfxResults, correct, points, rank])`
);

fs.writeFileSync('packages/web/src/features/game/components/states/Result.tsx', contentResult);
