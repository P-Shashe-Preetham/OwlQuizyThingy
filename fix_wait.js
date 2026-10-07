const fs = require('fs');

let content = fs.readFileSync('packages/web/src/features/game/components/states/Wait.tsx', 'utf8');

const importReact = `import { useState } from "react"\n`;
const importUseEvent = `import { useEvent } from "@rahoot/web/features/game/contexts/socketProvider"\n`;

// Since it's a stateless component, I need to convert it to use state
content = content.replace(
  'import Loader from "@rahoot/web/shared/components/Loader"',
  importReact + importUseEvent + 'import Loader from "@rahoot/web/shared/components/Loader"'
);

content = content.replace(
  `const Wait = ({ data: { text } }: Props) => (`,
  `const Wait = ({ data: { text } }: Props) => {
  const [players, setPlayers] = useState(0)

  useEvent("game:totalPlayers", (count) => {
    setPlayers(count)
  })

  return (`
);

content = content.replace(
  `    </h2>
  </section>
)`,
  `    </h2>
    <p className="mt-2 text-xl text-white font-bold drop-shadow-md">Players Joined: {players}</p>
  </section>
  )
}`
);

fs.writeFileSync('packages/web/src/features/game/components/states/Wait.tsx', content);
