import sys

readme_content = """# OwlQuizyThingy

**OwlQuizyThingy** is a real-time, interactive quiz platform designed for live classroom and group game sessions. Inspired by live quiz engines, it features real-time Socket.IO synchronization, instant scoring, leaderboards, quiz creation/editing, and persistent storage via Firebase Firestore or local JSON configuration.

---

## What is OwlQuizyThingy?

OwlQuizyThingy allows a manager to host real-time quizzes. Participants connect to the game via a web browser using a unique PIN, answer questions in real-time, and get scored based on correctness and speed.

---

## Architecture Overview

OwlQuizyThingy operates as a monorepo workspace managed via `pnpm`:

```text
[ Client Web App (@rahoot/web) ] <---> [ Reverse Proxy / static server (Nginx / Docker) ]
                                                | WebSocket (/ws)
                                                v
                                   [ Socket Server (@rahoot/socket) ]
                                                |
                       +------------------------+------------------------+
                       |                                                 |
                       v                                                 v
        [ Firebase Firestore ]                                [ Local JSON Config ]
```

### Firebase Architecture

OwlQuizyThingy integrates with Firebase to manage persistent game data and manager authentication.
- Firebase handles secure storage and retrieval of quiz collections.
- It acts as the remote backend when the application isn't configured for local JSON storage.

### Frontend (`@rahoot/web`)

The frontend is a React 19 + Vite application.
- Uses **Zustand** for state management and **Socket.IO-client** for real-time synchronization.
- **Tailwind CSS V4** handles styling.
- Features routing and role-based guards for Managers and Players.

### Socket.IO Backend (`@rahoot/socket`)

The backend is a Node.js + Socket.IO server.
- Contains an in-memory game state machine.
- Handles manager authentication and persistence connection to Firebase.
- Validates real-time payloads via **Zod**.

### Firestore

Firebase Firestore is the primary cloud database used for saving quiz configurations.
- Data structures are validated at runtime before saving.
- Provides scalable NoSQL document storage for quizzes.

---

## Local Development

### Prerequisites

- **Node.js**: v24+
- **pnpm**: v10+
- **Docker** (Optional, for containerized execution)

### Installation

```bash
# Clone the repository
git clone https://github.com/P-Shashe-Preetham/OwlQuizyThingy.git
cd OwlQuizyThingy

# Install dependencies
pnpm install
```

---

## Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Define the required variables:

```env
# Manager authentication password
MANAGER_PASSWORD=your_secure_manager_password

# Allowed CORS origin(s)
CORS_ORIGIN=http://localhost:3000

# Base64-encoded or raw JSON Firebase Service Account (optional)
FIREBASE_SERVICE_ACCOUNT=
```

---

## Testing

Testing is split into unit, integration, and end-to-end tests:
- **Unit/Integration Tests**: Handled by **Vitest**.
- **End-to-End Tests**: Managed by **Playwright**.

To run tests:
```bash
# Run Vitest suites
pnpm test

# Install browser dependencies for E2E
pnpm exec playwright install --with-deps chromium

# Run Playwright E2E tests
pnpm exec playwright test
```

---

## Deployment

OwlQuizyThingy is designed to be deployed using Docker.
A `Dockerfile` and `compose.yml` are provided in the root directory for easy orchestration.

```bash
# Build and run using Docker Compose
docker compose up --build -d
```
*Note: Any previously hardcoded hosting platforms (e.g., Vercel, Render) are not verified as the absolute deployment mechanisms, and Docker is the standard deployment approach.*

---

## Troubleshooting

- **Socket connection fails**: Check if `VITE_WS_URL` is set correctly and the backend is running.
- **Authentication errors**: Ensure `MANAGER_PASSWORD` matches the environment variable.
- **Port already in use**: Kill existing processes using `kill $(lsof -t -i :3000)`.

---

## Security

Please refer to our [SECURITY.md](SECURITY.md) for detailed guidelines.
- **Credential Isolation**: All manager passwords and credentials must be injected via environment variables (`MANAGER_PASSWORD`).
- **Server-Side Authorization**: Every privileged manager Socket.IO event requires active, authenticated session validation (`isAuthenticatedManager`).

---

## Known Limitations

- **Horizontal Scaling**: The `Socket Server` currently holds game state completely in memory. It cannot be horizontally scaled without introducing a distributed pub/sub system (e.g., Redis).
- **Session Persistence**: If the socket server restarts, all active game sessions and player connections are lost.
"""

with open("README.md", "w") as f:
    f.write(readme_content)

print("README.md updated.")
