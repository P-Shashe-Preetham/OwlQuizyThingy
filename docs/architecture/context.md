# Architecture Context Model

## System Context
OwlQuizThingy is a real-time, interactive quiz platform designed for live classroom and group game sessions.

### Core Actors
*   **Manager (Teacher/Host):** Creates quizzes, manages game sessions, starts games, kicks players, and advances rounds.
*   **Player (Student/Participant):** Joins game sessions via a 6-digit invite code, submits answers to questions in real-time, and views their score and leaderboard position.

### External Systems
*   **Firebase Firestore:** Optional persistent storage for quizzes.
*   **Local JSON Configuration:** Fallback/alternative local persistent storage for quizzes.

## Interactions
*   **Managers** authenticate using a shared password, manage quizzes, and start/control live game sessions.
*   **Players** join a game session without a password using an invite code and participate by providing a username.
*   **The System** reads quizzes from Firebase or local storage, manages the live real-time game state via WebSockets (Socket.IO), and synchronizes state between all connected participants.
