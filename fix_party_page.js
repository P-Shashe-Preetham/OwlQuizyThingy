const fs = require('fs');

let content = fs.readFileSync('packages/web/src/pages/game/party/page.tsx', 'utf8');

const importTelemetry = `import { trackEvent } from "@rahoot/web/features/telemetry/tinybird"\n`;

content = importTelemetry + content;

content = content.replace(
  `  useEvent(
    "player:successReconnect",
    ({ gameId, status, player, currentQuestion }) => {
      setGameId(gameId)
      setStatus(status.name, status.data)
      setPlayer(player)
      setQuestionStates(currentQuestion)
    },
  )`,
  `  useEvent(
    "player:successReconnect",
    ({ gameId, status, player, currentQuestion }) => {
      setGameId(gameId)
      setStatus(status.name, status.data)
      setPlayer(player)
      setQuestionStates(currentQuestion)
      trackEvent("reconnect_success", { gameId })
    },
  )`
);

fs.writeFileSync('packages/web/src/pages/game/party/page.tsx', content);
