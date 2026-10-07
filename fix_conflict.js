const fs = require('fs');

let content = fs.readFileSync('packages/socket/src/__tests__/contract.test.ts', 'utf8');

content = content.replace(
  `<<<<<<< HEAD
    // Username too short
=======
>>>>>>> origin/main`,
  `    // Username too short`
);

fs.writeFileSync('packages/socket/src/__tests__/contract.test.ts', content);
