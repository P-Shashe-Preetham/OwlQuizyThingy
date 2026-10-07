# Architecture Overview

OwlQuizThingy is a monorepo application structured into three workspace packages:

1. **`@rahoot/common`**: Shared protocol definitions, Zod validation schemas, and TypeScript interfaces.
2. **`@rahoot/socket`**: Real-time Node.js Socket.IO game engine server managing state transitions, manager authentication, and persistence integrations.
3. **`@rahoot/web`**: React 19 + Vite single-page application handling player gameplay, manager dashboard, and quiz creation/editing.

## State Machine & Execution Flow

Game execution is strictly server-authoritative. The socket server maintains a `GameState` machine:
`WAITING` -> `SHOW_START` -> `SHOW_PREPARED` -> `SHOW_QUESTION` -> `SELECT_ANSWER` -> `SHOW_RESULT` -> `SHOW_RESPONSES` -> `SHOW_LEADERBOARD` -> `FINISHED`

Answers are only accepted during the `SELECT_ANSWER` phase, preventing early or late submission attacks.
