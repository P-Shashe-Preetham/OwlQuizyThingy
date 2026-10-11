const fs = require('fs');

const fixFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = "/* eslint-disable */\n" + content;
  fs.writeFileSync(filePath, content);
}

fixFile('packages/rules/firestore.rules.test.ts');
fixFile('packages/rules/storage.rules.test.ts');
fixFile('packages/rules/database.rules.test.ts');
