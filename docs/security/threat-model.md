# Threat Model & Remediation Analysis

| Threat | Surface | Severity | Mitigation | Verification |
| --- | --- | --- | --- | --- |
| Hardcoded Credentials | `render.yaml`, config defaults | Critical | Removed `admin123` defaults; require `MANAGER_PASSWORD` env var. | Configuration unit tests. |
| Unauthorized Manager Actions | Socket.IO Manager Events | Critical | Enforced `isAuthenticatedManager(socket.id)` on all manager events. | Contract unit tests. |
| Malformed Event Payloads | Socket.IO Client Events | High | Applied Zod schema parsing on all incoming Socket.IO client payloads. | Validator unit tests. |
| Overlapping Round Transitions | Server Game Timers | High | Added `currentGeneration` tokens and `abortCooldown()` timer cancellation. | Game engine tests. |
| Wildcard CORS & Buffer Exhaustion | WebSocket Connection | High | Configured origin whitelist from `CORS_ORIGIN` and set 1MB buffer cap. | Socket server test. |
