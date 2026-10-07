# Architecture Decision Records (ADR)

## ADR 01: Shared Zod Schemas for Validation
**Context:** We need a way to ensure the Web client and Socket server agree on the structure of data being transmitted via WebSockets, as Socket.IO does not inherently guarantee payload types at runtime.
**Decision:** We place Zod schemas and TypeScript types in the `@rahoot/common` package. The socket server strictly validates every incoming payload using `.safeParse()` before processing any logic.
**Consequences:** Strong runtime safety at the server boundary. Both client and server must be deployed together if schemas change to avoid breaking contracts.

## ADR 02: In-Memory Game State vs Distributed Database
**Context:** The live game state (players, scores, timers) updates multiple times per second. Writing this to a traditional database (like PostgreSQL or Firebase) introduces significant latency and cost.
**Decision:** All active game state is held entirely in memory on the Node.js Socket.IO server.
**Consequences:**
*   **Pros:** Extremely fast read/write for game logic.
*   **Cons:** The application is **stateful**. It cannot be scaled horizontally (multiple server instances) without sticky sessions and a pub/sub backplane (like Redis Adapter for Socket.IO). A server crash wipes all active games.

## ADR 03: Firebase Firestore vs Relational Database (PostgreSQL)
**Context:** We need to persist created quizzes so they survive server restarts.
**Decision:** We use Firebase Firestore as the primary optional persistence layer, with a local JSON fallback (`config/quizzes.json`). We rejected migrating to a relational DB (like PostgreSQL via Neon) at this time.
**Consequences:**
*   **Pros:** Preserves the existing architecture. No complex schema migrations or additional hosting costs for a relational DB. Flexible document structure fits the nested nature of quizzes (Quiz -> Questions -> Answers).
*   **Cons:** Requires managing a `FIREBASE_SERVICE_ACCOUNT` key.

## ADR 04: Global Manager Password
**Context:** We need to secure the quiz creation and game management controls.
**Decision:** We use a single global password injected via the `MANAGER_PASSWORD` environment variable. There is no user registration or RBAC.
**Consequences:**
*   **Pros:** Extremely simple to implement and use. No database table required for users.
*   **Cons:** Low security. If the password leaks, anyone can manage quizzes. Cannot track *who* created or modified a specific quiz.
