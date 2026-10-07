# Architecture Game State Machine Model

## State Flow

The core game logic relies on a strictly managed state machine. The states are defined in `@rahoot/common/types/game/status.ts`.

### 1. Game Initialization & Lobby
*   `WAITING`: The initial state when a game is created. The server generates an invite code and waits for players to join.

### 2. Game Start Sequence
When the manager triggers the start of the game (`manager:startGame`):
*   `SHOW_START`: Displays a countdown timer (e.g., 3 seconds) before the first question.
*   *Internal transition via server-side cooldown timer.*

### 3. Round Sequence (Repeats per question)
For each question in the quiz:
*   `SHOW_PREPARED`: Announces the upcoming question number and the number of total answers.
*   *Internal transition via server-side `sleep(2)`.*
*   `SHOW_QUESTION`: Displays the question text (and optional media) for reading. During this phase, answers cannot be submitted.
*   *Internal transition via server-side question `cooldown` timer.*
*   `SELECT_ANSWER`: The active answering phase. Players can submit their answers. The server accepts `player:selectedAnswer` events.
*   *Player-specific state during this phase:* Once a player submits an answer, they individually receive a `WAIT` status while others finish.
*   *Internal transition via server-side question `time` timer.*
*   `SHOW_RESULT` (Players) / `SHOW_RESPONSES` (Manager): The answering phase ends.
    *   Players receive `SHOW_RESULT` with feedback (correct/incorrect, points earned, rank).
    *   The Manager receives `SHOW_RESPONSES` with an aggregate view of all submitted answers and the correct solution.
*   *Wait for manual Manager action (`manager:showLeaderboard` or `manager:nextQuestion`).*

### 4. Leaderboard & Progression
*   `SHOW_LEADERBOARD`: Displays the current top 5 players and their score changes. Triggered manually by the manager.
*   *Wait for manual Manager action (`manager:nextQuestion` or game ends).*

### 5. Termination States
*   `FINISHED`: Triggered if the manager requests the leaderboard after the final question has been completed. Shows the final top 3 players.
*   `CANCELLED`: Triggered if the manager explicitly aborts the game (`manager:abortQuiz`), or if the manager disconnects and fails to reconnect within a predefined timeout.
