# Architecture Threat Model

## Security Boundaries & Controls

Based on `SECURITY.md` and codebase analysis, the following controls and risks are identified.

### 1. Manager Authentication
*   **Control:** A shared password (`MANAGER_PASSWORD` env var) protects manager actions. Every privileged Socket.IO event handler checks `isAuthenticatedManager(socket.id)`.
*   **Risk:** The password is sent in plaintext over the WebSocket payload. While WebSockets (WSS) provide transport layer encryption (TLS), the internal architecture trusts the connection entirely once authenticated. If the shared password is compromised, all games can be manipulated.
*   **Risk:** Connection dropping requires re-authenticating the new socket.

### 2. Input Validation (Zod)
*   **Control:** The `@rahoot/common` package defines Zod schemas for all client-to-server events. The server parses payloads against these schemas before processing.
*   **Risk:** Some custom endpoints might lack deep validation (e.g. media URL sanitization within quiz creation payloads).

### 3. Cross-Origin Resource Sharing (CORS)
*   **Control:** The `CORS_ORIGIN` environment variable restricts which origins can connect to the Socket.IO server.
*   **Risk:** If misconfigured (e.g., set to `*` in production), arbitrary external sites could attempt to interact with the WebSocket server.

### 4. Player Impersonation
*   **Control:** Players use a client-generated UUID (`clientId`) sent during the handshake to establish identity.
*   **Risk:** If a malicious user observes or guesses another player's `clientId` and the active `gameId`, they could theoretically hijack the session via the `player:reconnect` flow. However, UUIDv4 makes guessing computationally infeasible.

### 5. Denial of Service (DoS) / Rate Limiting
*   **Control:** The codebase implements basic rate limiting on the `manager:auth` endpoint per IP address to prevent brute-forcing the manager password.
*   **Control:** The `Registry` limits the total number of concurrent games (`MAX_GAMES`).
*   **Risk:** There is no explicit rate limiting on player joins or answer submissions documented in the primary index file, potentially exposing the server to application-layer memory exhaustion (creating too many players or answers).

### 6. Media Payloads
*   **Control:** Media references (images, audio, video) in quizzes are currently handled as URLs.
*   **Risk:** Stored Cross-Site Scripting (XSS) if URL validation is bypassed, or Server-Side Request Forgery (SSRF) if the server attempts to fetch these URLs (currently, it appears only the client fetches them, shifting the risk to the client browser).
