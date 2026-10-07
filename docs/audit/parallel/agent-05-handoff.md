# Frontend Architecture & Application Shell Engineer Handoff

## Frontend Architecture Changes
- Integrated an accessible, dismissible alert banner in `GameWrapper.tsx` for handling game errors, moving away from relying purely on transient toasts, which can be easily missed or hard to interact with using assistive technology.
- Strengthened the `SocketProvider` context wrapper.
- Implemented environment-driven socket URL configuration falling back appropriately between Vite's `import.meta.env` and production settings. Hardcoded Render configuration was removed to allow multi-cloud integration.
- Wrapped `localStorage` and `sessionStorage` in `try/catch` statements within `socketProvider.tsx` and `router.tsx` to prevent the application from crashing in restricted storage environments (e.g. strict ITP or Incognito mode without cookies allowed).

## Connection Lifecycle Design
- Implemented a more resilient Socket.IO connection handling. The lifecycle correctly responds to React 18 / 19 Strict Mode double invocation by tracking unmounting via an `isMounted` flag and `socketRef`.
- Handled `connect_error`, `disconnect`, and standard connection failures gracefully. The application shell will now provide a clear, non-blocking UI alert and allow for retry logic when the connection is permanently lost or severed.
- Adjusted how event listeners are bound to prevent stale closures and duplicate listener registration during re-renders, relying on stable callback refs for `socket.on` assignments inside `useEvent`.

## Firebase Integration Assumptions
- **No direct frontend DB connection**: Firebase client-side SDK has been deliberately left out (as indicated by the notes in `packages/web/src/lib/firebase.ts`).
- **Socket Relay**: It is assumed that all real-time events, questions, updates, and persistence triggers are executed securely via the socket connection (`@rahoot/socket` handled by backend agent).
- **Credentials isolation**: The frontend contains absolutely no Firebase service account or client configuration keys, nor manager passwords or sensitive infrastructure tokens.

## Tests & Reliability
- Run the full project linting, typechecking, and tests via `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`.
- Playwright E2E tests are configured. Make sure the socket server is running when tests are executed if required.

## Files Changed
- `packages/web/src/features/game/contexts/socketProvider.tsx` (Socket lifecycle, strict mode safety, storage safety, URL config)
- `packages/web/src/router.tsx` (SessionStorage safety)
- `packages/web/src/features/game/components/GameWrapper.tsx` (Accessible connection & error banners)

## Remaining Risks
- Relying purely on the `sessionStorage` flag for Manager authentication means a reload on another tab won't carry the session over. This should ideally be replaced with an HTTP-Only cookie handled by the socket server's initial handshake.
- The `SocketProvider` creates a local `clientId` via UUID which remains indefinitely unless cleared. While good for anonymous game play, long-running games or reconnections rely heavily on this client ID not changing.

## Dependencies on Agents 01–04
- Dependent on Agent 04's deployment output to provide the correct `VITE_WS_URL` in the production CI/CD environment.
- Dependent on Backend Agent to manage the actual flow of `manager:auth` and connection tracking since the frontend strictly proxies those requests without local validation.
