# OwlQuizThingy

**OwlQuizThingy** is a real-time, interactive quiz platform designed for live classroom and group game sessions. Inspired by live quiz engines, it features real-time Socket.IO synchronization, instant scoring, leaderboards, quiz creation/editing, and persistent storage via Firebase Firestore or local JSON configuration.

---

## Architecture Overview

OwlQuizThingy operates as a monorepo workspace managed via `pnpm`:

```text
[ Client Web App (@rahoot/web) ] <---> [ Reverse Proxy / static server (Nginx / Vercel) ]
                                                | WebSocket (/ws)
                                                v
                                   [ Socket Server (@rahoot/socket) ]
                                                |
                       +------------------------+------------------------+
                       |                                                 |
                       v                                                 v
        [ Firebase Firestore ]                                [ Local JSON Config ]
```

### Monorepo Packages

- **`@rahoot/common`**: Shared TypeScript types, status maps, and Zod runtime validation schemas.
- **`@rahoot/socket`**: Real-time Node.js Socket.IO server, in-memory game state machine, manager authentication, and persistence connector.
- **`@rahoot/web`**: React 19 + Vite frontend user interface with Zustand state management, Tailwind CSS, and router guards.

---

## Getting Started

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

### Environment Variables

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

### Running Locally

```bash
# Run all services in development mode
pnpm dev

# Build all packages
pnpm build

# Run linting and test suites
pnpm lint
pnpm test
```

---

## Security & Deployment

- **Security Policy**: Refer to [SECURITY.md](SECURITY.md) for vulnerability reporting and credential handling guidelines.
- **Deployment**: Docker containerization is provided via `Dockerfile` and `compose.yml`. Render backend settings are defined in `render.yaml`.
- **Health Check**: Health status can be monitored at `/health` returning JSON application metrics.
