# Final Architecture: OwlQuizyThingy

## Frontend
The frontend is built using React 19, Vite, Tailwind CSS V4, and React Router 7. State management relies on React Context API and Zustand. It is separated into `shell` (app-wide layouts/providers), `shared` (reusable UI primitives), and `features` (domain-specific modules). The frontend connects to the backend via Socket.IO for real-time interactions.

## Backend
The backend is a Node.js application built with Socket.IO to handle real-time game state synchronization. It uses a custom game engine to manage game lifecycle, scoring, and connections.

## Game Engine
The game engine handles the core logic: creating games, joining players, advancing questions, scoring answers, and tracking state. It relies on a centralized Registry to track active games.

## Persistence
Currently, quizzes are loaded from static JSON files in the `config/quizz` directory. Future enhancements may incorporate a real database (like Neon or Supabase) based on the infrastructure decisions made during development.

## Identity & Authorization
Player identity is session-based and tied to the Socket.IO connection. Manager authorization requires a valid token (e.g., matching a `MANAGER_PASSWORD`) to perform administrative actions.

## Realtime
Socket.IO is used exclusively for all client-server communication, ensuring low latency and synchronized game state across all connected clients.

## Telemetry
Basic telemetry is set up to log events and errors, but comprehensive observability (like tracing and metrics) might require further integration with tools like Datadog or New Relic.

## Deployment
The application can be deployed via Docker. The `Dockerfile` packages both the frontend (served via Nginx) and the backend (Node.js) into a single container managed by `supervisord`.

## Failure Recovery
The backend can handle client disconnects and reconnects gracefully, allowing players to rejoin a game if their session is still active.
