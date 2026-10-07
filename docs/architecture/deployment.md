# Architecture Deployment Model

## Topology

The application supports multiple deployment strategies based on the configuration files present in the repository (`render.yaml`, `vercel.json`, `Dockerfile`, `compose.yml`).

### 1. Hybrid Serverless / PaaS (Vercel & Render)
This appears to be the primary intended cloud deployment model based on the proxy configuration in `vercel.json`.

*   **Frontend (Vercel):** The `@rahoot/web` static assets are built and served globally via Vercel's CDN (`vercel.json`).
*   **Backend (Render):** The `@rahoot/socket` Node.js server runs as a Web Service on Render (`render.yaml`).
*   **Networking:** Vercel acts as a reverse proxy for WebSocket connections. Requests to `/ws/*` are rewritten to `https://owlquizythingy.onrender.com/ws/*`.

### 2. Single-Node Docker Container
A self-contained deployment model using the provided `Dockerfile` and `compose.yml`.

*   **Container:** An Alpine Linux based container running both Nginx (static file server for frontend) and Node.js (backend) managed by `supervisord`.
*   **Networking:** Nginx serves the static React build and proxies `/ws/` requests internally to the Node.js process running on port 3001. The container exposes port 3000 to the host.
*   **Volumes:** The `config` directory is mounted to persist local JSON quizzes if Firebase is not used.

### Configuration Injection
*   **Environment Variables:** Runtime configuration is injected via environment variables:
    *   `MANAGER_PASSWORD`: Required for manager authentication.
    *   `CORS_ORIGIN`: Restricts WebSocket connections.
    *   `FIREBASE_SERVICE_ACCOUNT`: Base64 encoded or raw JSON for Firebase initialization (optional).

### Scalability Considerations
*   **Stateful Backend:** The `Socket Server` currently holds game state completely in memory. It cannot be horizontally scaled (multiple instances) without introducing a distributed pub/sub system (e.g., Redis) and sticky sessions for Socket.IO. Render must be configured to run a single instance.
