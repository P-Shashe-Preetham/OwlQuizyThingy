# Architecture Data Flow Model

## Real-Time Synchronization

The system relies on a bi-directional, real-time data flow using WebSockets (Socket.IO).

### Manager Flow (Creation & Game Control)
1.  **Authentication:** Manager connects and emits `manager:auth` with a password payload.
2.  **Quiz Management:** Authenticated managers emit `manager:saveQuizz` or `manager:deleteQuizz`. The server updates the persistence layer (Firebase/Local) and broadcasts the updated `manager:quizzList`.
3.  **Game Initialization:** Manager emits `game:create` with a Quiz ID. Server loads the quiz, creates a new in-memory `Game` instance, generates a 6-digit invite code, and responds with `manager:gameCreated`.
4.  **Game Control:** Manager emits control events (`manager:startGame`, `manager:nextQuestion`, `manager:showLeaderboard`, `manager:abortQuiz`).
5.  **State Broadcast:** The server processes the manager's command, updates the in-memory game state, and broadcasts the new state (`game:status`) and relevant data to all clients in the specific game room.

### Player Flow (Participation)
1.  **Joining:** Player connects and emits `player:join` with a 6-digit invite code. If valid, the server returns `game:successRoom`.
2.  **Login:** Player emits `player:login` with a username. The server adds the player to the in-memory `Game` instance and notifies the manager (`manager:newPlayer`) and broadcasts the total player count (`game:totalPlayers`).
3.  **Answering:** During the `SELECT_ANSWER` phase, the player emits `player:selectedAnswer` with their choice. The server validates the answer, calculates points based on time elapsed, records it in the current round, and acknowledges the submission.
4.  **State Reception:** Players passively receive `game:status` broadcasts that dictate what the UI should render (e.g., waiting screen, question text, result feedback).

### State Authority
*   The **Socket Server** is the strict single source of truth for all live game state.
*   The **Web Client** is a "dumb" renderer. Its state (managed by Zustand) purely reflects the last status pushed by the server. It does not optimistically update game progression.
