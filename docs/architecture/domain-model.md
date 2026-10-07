# Architecture Domain Model

## Core Entities

### `Quizz` (Quiz Definition)
*   **Properties:** `id` (optional string), `subject` (string), `settings` (theme, mode), `questions` (Array of Question).
*   **Lifecycle:** Created by Manager. Persisted in Firebase or Local JSON. Cloned by-value into a `Game` when started.
*   **Invariants:** Must have at least one question.

### `Question` (Within a Quiz)
*   **Properties:** `type` ("quiz" | "type-answer"), `question` (string), `answers` (string array), `solution` (index or string match), `cooldown` (prep time), `time` (answer time), optional media (`image`, `video`, `audio`).
*   **Invariants:** Minimum two answers required for multiple choice.

### `Game` (Active Session)
*   **Properties:** `gameId` (UUID), `inviteCode` (6 digits), `manager` (Socket ref), `quizz` (Quizz snapshot), `players` (Array of Player), `started` (boolean), `leaderboard` (Array of Player), `round` (current state tracker).
*   **Lifecycle:** Created by Manager via `game:create`. Exists strictly in server memory. Destroyed when aborted or when the server restarts.
*   **Relationships:** Contains 1 Quizz, 1 Manager, N Players.

### `Player` (Participant in a Game)
*   **Properties:** `id` (socket ID), `clientId` (browser UUID), `username` (string), `points` (number), `connected` (boolean).
*   **Lifecycle:** Created upon joining a game with a username. State (points) persists in memory as long as the Game exists.
*   **Relationships:** Belongs to exactly 1 Game.

### `Answer` (Submission in a Round)
*   **Properties:** `playerId` (string), `answerId` (number or string), `points` (calculated based on speed).
*   **Lifecycle:** Created when a player submits an answer during the `SELECT_ANSWER` phase. Erased/processed when the round transitions to `SHOW_RESULT`.
*   **Invariants:** A player can only submit one Answer per round.
