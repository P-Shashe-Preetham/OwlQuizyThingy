const fs = require('fs');

let content = fs.readFileSync('packages/web/src/features/game/components/states/Answers.tsx', 'utf8');

const importTelemetry = `import { trackEvent } from "@rahoot/web/features/telemetry/tinybird"\n`;

content = importTelemetry + content;

content = content.replace(
  `  const handleAnswer = (answerKey: number) => () => {
    if (!player) {
      return
    }

    socket?.emit("player:selectedAnswer", {
      gameId,
      data: {
        answerKey,
      },
    })
    sfxPop()
  }`,
  `  const handleAnswer = (answerKey: number) => () => {
    if (!player || hasSubmitted) {
      return
    }

    socket?.emit("player:selectedAnswer", {
      gameId,
      data: {
        answerKey,
      },
    })
    setHasSubmitted(true)
    trackEvent("answer_submitted", { answerKey })
    sfxPop()
  }`
);

content = content.replace(
  `    socket?.emit("player:selectedAnswer", {
      gameId,
      data: { answerKey: typedAnswer.trim() },
    })
    setHasSubmitted(true)
    sfxPop()`,
  `    socket?.emit("player:selectedAnswer", {
      gameId,
      data: { answerKey: typedAnswer.trim() },
    })
    setHasSubmitted(true)
    trackEvent("answer_submitted", { answerKey: typedAnswer.trim() })
    sfxPop()`
);

content = content.replace(
  `  useEffect(() => {
    if (video || audio) {
      return
    }`,
  `  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (type === "type-answer") return;
      const key = e.key;
      if (['1', '2', '3', '4'].includes(key)) {
        const index = parseInt(key, 10) - 1;
        if (index < answers.length) {
          handleAnswer(index)();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [player, hasSubmitted, answers.length, type]);

  useEffect(() => {
    if (video || audio) {
      return
    }`
);

content = content.replace(
  `                className={clsx(ANSWERS_COLORS[key], player && "h-full")}
                icon={ANSWERS_ICONS[key]}
                onClick={handleAnswer(key)}`,
  `                className={clsx(ANSWERS_COLORS[key], player && "h-full", player && hasSubmitted && "opacity-50 pointer-events-none")}
                icon={ANSWERS_ICONS[key]}
                onClick={handleAnswer(key)}`
);

fs.writeFileSync('packages/web/src/features/game/components/states/Answers.tsx', content);
