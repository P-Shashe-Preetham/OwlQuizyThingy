# Architecture Container Model

## Containers

### 1. Web Application (`@rahoot/web`)
*   **Technology:** React 19, Vite, Tailwind CSS, Zustand, React Router, Socket.IO Client.
*   **Purpose:** Provides the user interface for both Managers and Players. It maintains client-side state using Zustand and handles routing and rendering.
*   **Responsibilities:**
    *   Presenting the login/join screens.
    *   Displaying the creator interface for quiz management.
    *   Rendering live game states (questions, answers, leaderboards).
    *   Communicating with the Socket Server via WebSockets.

### 2. Socket Server (`@rahoot/socket`)
*   **Technology:** Node.js, Socket.IO, Zod.
*   **Purpose:** The central authority for real-time game logic, state management, and persistence integration.
*   **Responsibilities:**
    *   Handling WebSocket connections from the Web Application.
    *   Managing in-memory game state (`Registry`, `Game` instances).
    *   Validating incoming events using Zod schemas (defined in `@rahoot/common`).
    *   Authenticating managers.
    *   Interfacing with persistence layers (Firebase or Local JSON).

### 3. Shared Library (`@rahoot/common`)
*   **Technology:** TypeScript, Zod.
*   **Purpose:** Enforces strong typing and runtime validation boundaries between the Web App and Socket Server.
*   **Responsibilities:**
    *   Defining shared domain models (Quizz, Player, GameState).
    *   Providing Zod validation schemas.
    *   Defining the exact Socket.IO event contracts.

### 4. Firebase Firestore (Optional)
*   **Technology:** Google Firebase Firestore.
*   **Purpose:** Cloud-based NoSQL persistence for created quizzes.
*   **Responsibilities:**
    *   Storing quiz definitions securely.

### 5. Local JSON Config (Fallback)
*   **Technology:** File System (JSON).
*   **Purpose:** Fallback persistence for quizzes when Firebase is not configured.
