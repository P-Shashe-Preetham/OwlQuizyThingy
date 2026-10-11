# ADR 001: Move to Vercel and Firebase BaaS Architecture

## Status
Accepted

## Context
The original architecture of OwlQuizyThingy included a Node.js + Socket.IO server (`@rahoot/socket`) to manage real-time game state, backed by Firebase Firestore for persistent quiz configurations, and deployed using Docker Compose. A recent remediation PR (#30) removed the socket server directory but did not complete the migration of the frontend or the backend logic, leaving the application in a broken state. The frontend still heavily depends on the removed `socket.io-client` contracts, and the Docker deployment files are stale.

Furthermore, we need a scalable, maintainable, and secure architecture that leverages modern serverless capabilities without maintaining custom distributed state infrastructure for WebSockets.

## Decision
We are moving the application exclusively to **Vercel** for hosting the React frontend and serverless API endpoints (if needed for privileged actions), while relying entirely on **Firebase** as the backend-as-a-service (BaaS):
- **Firebase Firestore** for quiz configuration persistence (CRUD operations).
- **Firebase Realtime Database (RTDB)** for real-time game state synchronization.
- **Firebase Auth** for manager authentication and player session tracking.
- **Firebase Cloud Functions** (or Vercel Serverless Functions) for authoritative, privileged commands (e.g., advancing rounds, scoring, joining games, kicking players) to prevent untrusted clients from writing directly to the game state.

The dedicated `@rahoot/socket` server and all associated Docker deployment configurations (`compose.yml`, `Dockerfile`, `.github/workflows/docker-release.yml`) will be permanently retired.

## Consequences
- **Positive:** Simpler deployment story (Vercel + Firebase). Reduced maintenance burden of a custom Node.js server. Native real-time capabilities via Firebase RTDB. Secure by default using Firebase Security Rules and authorized callable functions.
- **Negative:** Firebase RTDB has limits on concurrent connections per database instance (though sufficient for our target scale). We depend heavily on Firebase's proprietary APIs rather than open standards like Socket.IO.
- **Mitigation:** Ensure we write robust Firebase Security Rules and use Cloud Functions for state transitions to keep the business logic secure and testable.
