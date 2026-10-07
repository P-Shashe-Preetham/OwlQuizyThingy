# Multi-Agent Work Breakdown

## 1. Security / Auth / Identity (Agent 02)
*   **Allowed Areas:** `@rahoot/socket/src/index.ts`, `@rahoot/common/src/validators/*`
*   **Forbidden Areas:** Web UI, Game Engine logic, Render config.
*   **Expected Artifacts:** JWT/Token based auth middleware for Managers. Stricter Zod validation for media URLs (HTTPS only).
*   **Tests:** Unit tests for Auth flow and validation schemas.
*   **Dependencies:** Audit Baseline.

## 2. Game Engine (Agent 03)
*   **Allowed Areas:** `@rahoot/socket/src/services/game.ts`, `@rahoot/common/src/types/game/*`
*   **Forbidden Areas:** Web UI, Auth logic, Deployment configurations.
*   **Expected Artifacts:** Refactored state machine (if needed) to handle edge cases in scoring and reconnects.
*   **Tests:** Unit tests covering full game lifecycle and edge case reconnects.
*   **Dependencies:** Security/Auth baseline.

## 3. Player & Manager UX (Agent 04)
*   **Allowed Areas:** `@rahoot/web/src/*`
*   **Forbidden Areas:** `@rahoot/socket/*`, `@rahoot/common/*` (unless adding new shared types requested by backend).
*   **Expected Artifacts:** Implement global reconnection indicators (toasts/overlays) using Zustand and Socket.IO connection state. Accessibility improvements in UI.
*   **Tests:** React Testing Library tests for reconnection components.
*   **Dependencies:** Realtime Contract.

## 4. DevOps / CI / CD (Agent 05)
*   **Allowed Areas:** `.github/workflows/*`, `render.yaml`, `Dockerfile`, `compose.yml`
*   **Forbidden Areas:** Application source code (`src/`).
*   **Expected Artifacts:** Ensure secrets are not hardcoded in `render.yaml` (`sync: false` properly configured). Robust health checks.
*   **Tests:** Pipeline execution verification.
*   **Dependencies:** All application code complete.
