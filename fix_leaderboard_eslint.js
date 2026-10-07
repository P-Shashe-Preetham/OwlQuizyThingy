const fs = require('fs');

let content = fs.readFileSync('packages/web/src/features/game/components/states/Leaderboard.tsx', 'utf8');

content = content.replace(
  `  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(to)


return () => {}
    }

    spring.set(to)
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest)
    })

    return unsubscribe
  }, [to, spring, display, prefersReducedMotion])`,
  `  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(to)

      return undefined
    }

    spring.set(to)
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest)
    })

    return unsubscribe
  }, [to, spring, display, prefersReducedMotion])`
);

fs.writeFileSync('packages/web/src/features/game/components/states/Leaderboard.tsx', content);
