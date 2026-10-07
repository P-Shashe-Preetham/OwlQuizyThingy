const fs = require('fs');

let content = fs.readFileSync('packages/socket/src/__tests__/contract.test.ts', 'utf8');

content = content.replace(
  `import { z } from "zod"\nimport { selectedAnswerSchema, playerLoginSchema } from "../../../common/src/validators/game"`,
  `import { playerLoginSchema } from "../../../common/src/validators/game"`
);

content = content.replace(
  `const invalidLogin = { gameId: "game123", data: { username: "" } } // Username too short`,
  `// Username too short\n    const invalidLogin = { gameId: "game123", data: { username: "" } }`
);

fs.writeFileSync('packages/socket/src/__tests__/contract.test.ts', content);
