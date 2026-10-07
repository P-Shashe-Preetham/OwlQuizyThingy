const fs = require('fs');

let content = fs.readFileSync('packages/web/src/features/game/components/states/Question.tsx', 'utf8');

content = content.replace(
  '<h2 className="anim-show text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">',
  '<h2 aria-live="polite" className="anim-show text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">'
);

fs.writeFileSync('packages/web/src/features/game/components/states/Question.tsx', content);
