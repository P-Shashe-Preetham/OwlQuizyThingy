const fs = require('fs');

let content = fs.readFileSync('packages/web/src/features/game/components/join/Room.tsx', 'utf8');

// Import trackEvent
const importCode = `import { trackEvent } from "@rahoot/web/features/telemetry/tinybird"\n`;
content = importCode + content;

// Insert trackEvent in handleJoin
content = content.replace(
  'socket?.emit("player:join", invitation.trim())',
  'socket?.emit("player:join", invitation.trim())\n    trackEvent("join_started", { pin: invitation.trim() })'
);

fs.writeFileSync('packages/web/src/features/game/components/join/Room.tsx', content);

// Now for Username.tsx
let content2 = fs.readFileSync('packages/web/src/features/game/components/join/Username.tsx', 'utf8');

content2 = importCode + content2;

content2 = content2.replace(
  'login(username.trim())',
  'login(username.trim())\n    trackEvent("join_completed", { username: username.trim() })'
);

fs.writeFileSync('packages/web/src/features/game/components/join/Username.tsx', content2);
