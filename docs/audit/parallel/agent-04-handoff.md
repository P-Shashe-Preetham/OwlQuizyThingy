# Agent 04 Handoff: Production Deployment Architecture

## Goal
Move the production deployment to a Firebase-only ecosystem and eliminate the dependencies on Render and Vercel.

## Selected Architecture
- **Frontend**: Firebase Hosting.
- **Backend (Realtime)**: Cloud Run (`rahoot-socket`).
- **Routing**: Firebase Hosting acts as a proxy, rewriting `/ws/**` and `/health` to the Cloud Run service instance.

## Scaling and State Decision
**Selected Option A**: Constrain realtime deployment to a safe operating model.
- Because the `socket.io` state (`Game`, `Registry`) is currently held entirely in-memory and not durable, the Cloud Run service MUST be configured with `--max-instances 1` for a stable deployment, forcing a single authoritative instance.
- Using Firebase App Hosting was rejected because it lacks precise controls for max-instances limits and WebSocket compatibility needed for a single-node in-memory store.

## Rejected Alternatives
1. **Firebase App Hosting**: App Hosting focuses heavily on Next.js/Angular SSR and does not gracefully support generic `Node` servers holding WebSocket instances without strict concurrency boundaries.
2. **Kubernetes / Redis / Horizontally Scalable WebSockets**: The prompt specifically banned adopting these merely to claim scalability. Therefore, scaling state out and using standard `max-instances=100` was rejected in favor of adhering to Option A.

## WebSocket Implications
- Cloud Run handles WebSocket traffic gracefully, provided the client establishes connections. We configured Firebase Hosting to route `/ws` path to the Cloud Run container.
- Firebase Hosting enforces a timeout and some limits. Specifically, if a socket connection sits completely idle, Firebase Hosting/Cloud Run may close it. However, `socket.io` supports automatic ping/pong mechanisms to keep connections active.

## Environment Variables
- Ensure Cloud Run has access to the standard backend variables:
  - `MANAGER_PASSWORD`
  - `CORS_ORIGIN` (Can be set to the Firebase Hosting domain or `*`)
  - `FIREBASE_SERVICE_ACCOUNT` (Required for the backend to interact with Firestore quizzes).
- The Frontend build process (`.env` file) should no longer contain hardcoded `VITE_WS_URL=https://owlquizythingy.onrender.com`. By removing this URL entirely or keeping it default (`/`), it safely resolves connections back to the Firebase host context where the reverse proxy routes them to `/ws`.

## Validation Results
- Verified that `packages/web/src/features/game/contexts/socketProvider.tsx` removes Render.
- Updated `Dockerfile` specifically isolates the node runtime without multi-process supervisor complexity (nginx is gone).
- Configured `firebase.json` for proper rewriting.

## Remaining Risks
- **Concurrency Bottleneck**: Being bound to a single Cloud Run instance limits global traffic capacity directly to Cloud Run's CPU bounds and max concurrency limit per instance.
- **Cloud Run Instance Lifecycle**: Deployments or automated Google patches will cycle the single container instance, disconnecting clients and completely clearing any active game rooms from memory.

## Deployment Commands
When deploying to GCP / Firebase, assuming the `gcloud` and `firebase` CLIs are configured:

```bash
# 1. Build and deploy backend to Cloud Run
# Make sure to specify --max-instances=1
gcloud run deploy rahoot-socket \
  --source . \
  --allow-unauthenticated \
  --region us-central1 \
  --max-instances 1 \
  --port 3000

# 2. Build the frontend
pnpm install
pnpm --filter @rahoot/web build

# 3. Deploy frontend to Firebase Hosting
firebase deploy --only hosting
```
