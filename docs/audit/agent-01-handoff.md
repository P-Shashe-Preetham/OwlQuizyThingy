# Agent 01 - Audit & Architecture Baseline Handoff

## Verified Architecture
*   **Web App:** React 19 + Vite frontend (deployed via Vercel).
*   **Socket Server:** Node.js + Socket.IO holding in-memory game state (deployed via Render).
*   **Database:** Firebase Firestore (optional) or local JSON for quiz persistence.
*   **Validation:** Zod schemas in `@rahoot/common` enforce boundary validation.
*   **Documentation:** Fully mapped in `docs/architecture/`.

## Major Findings
1.  **Security (P1):** Manager password is at risk of being committed to repo via `render.yaml`.
2.  **Scalability (P1):** Game state relies purely on in-memory mapping (`this.players`, `this.round`). The server cannot scale horizontally.
3.  **Identity (P2):** Manager authentication is tied strictly to a specific Socket ID and a shared global password. Disconnects result in auth loss.
4.  **UX (P2):** The frontend lacks robust visual indicators when the underlying WebSocket drops, leading to confused players.

## Decisions Made (ADRs)
*   **ADR 01:** Retain Zod schemas in `@rahoot/common` for strict runtime safety.
*   **ADR 02:** Accept single-node limitation for the Socket Server. Refactoring to a distributed state (e.g., Redis) is out of scope.
*   **ADR 03:** Retain Firebase Firestore. Do not migrate to a relational DB (Neon/Supabase) to preserve existing stack simplicity.
*   **ADR 04:** Manager password remains global, but requires better secret management (DevOps) and a more robust session mechanism (Auth Agent).

## Unresolved Questions
*   Should media URLs (images, videos, audio in quizzes) be fetched and proxied by the server to prevent client-side SSRF/CORS issues, or purely validated as `https://`? (Assigned to Security Agent).
*   What is the specific maximum number of concurrent games the Node.js process can handle before garbage collection pauses impact real-time syncing?

## Multi-Agent Workplan
The work has been broken down and assigned:
1.  **Agent 02:** Security, Auth, and Identity (Focus: Robust Manager sessions, URL sanitization).
2.  **Agent 03:** Game Engine (Focus: Edge case state handling).
3.  **Agent 04:** Player & Manager UX (Focus: Reconnection UI, Accessibility).
4.  **Agent 05:** DevOps / CI / CD (Focus: Secret management, CI pipeline hardening).

See `docs/audit/multi-agent-workplan.md` for exact boundaries and expected artifacts.

## Recommended Execution Order
1.  **Agent 02 (Security/Auth):** Must establish the robust session token mechanism first, as it changes the `manager:auth` socket contract.
2.  **Agent 03 (Game Engine):** Can work in parallel with Agent 02, focusing on internal state machine robustness.
3.  **Agent 04 (UX):** Must wait for Agent 02's auth contract changes, but can begin working on the offline/reconnection toast notifications immediately.
4.  **Agent 05 (DevOps):** Can work independently on `render.yaml` and `.github/workflows/ci.yml`.
