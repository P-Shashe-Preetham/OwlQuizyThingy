# Manager Experience

The Manager Experience has been overhauled to provide a robust control console and authoring environment for the `OwlQuizThingy` system. The core responsibilities include:

1. **Manager Dashboard (`/manager`)**
   - Displays all quizzes available for hosting.
   - Includes functionality to launch games (via a Game Settings Modal), edit quizzes, duplicate quizzes, or delete them.

2. **Quiz Creator (`/creator`)**
   - Authoring environment allowing creation and editing of questions.
   - Includes the ability to set timers, choose options, and select answer types.
   - **Local Drafts**: Drafts are preserved using `draft_quizz_${id}` local storage keys and are only cleared once authoritative server confirmation is received via the `manager:quizzSaved` socket event.
   - **Ordering**: Reorder questions quickly using the up/down arrows.

3. **Live Game Control (`/party/manager/:gameId`)**
   - Acts as the main console.
   - Provides live controls like skipping timers ("End Countdown"), waiting for responses, and navigating between rounds.
   - A newly designed Podium displays a complete post-game analysis listing all top players.

All manager features map strictly to the backend `socket` APIs, avoiding desyncs and maintaining canonical quiz identifiers.
