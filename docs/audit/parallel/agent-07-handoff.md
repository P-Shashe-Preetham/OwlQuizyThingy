# Manager UX and Quiz Authoring Engineer - Handoff

## Manager Flows
- **Authentication**: Manager authentication state no longer relies on a stale local `sessionStorage` flag. Unauthorized errors sent from the backend will now reset the local context, gracefully redirecting the user back to the login screen.
- **Game Control**: Added unified error handling during actual game control. Actions that result in an authorization failure from the backend trigger a visual notification (`toast`) without silently breaking.
- **List and Deletion**: Display errors when attempts to fetch or delete existing quizzes are rejected.
- **Creation and Editing**: Added robust time-based fallbacks for the quiz creation mechanism and unified pre-submit schema validation to closely match backend parsing.

## Form Validation
- **Client-Side Zod Validation**: Imported and hooked `quizzSchema` from the common utilities to run over quiz modifications inside `packages/web/src/pages/creator/page.tsx`. This avoids firing a request completely if simple validation constraints such as question content or choice limits are missing.
- **Save Semantics**: Saving logic properly resets local loader flags with a specific 10-second timeout, rather than holding users hostage if the `manager:quizzSaved` or `manager:errorMessage` server responses fail to return promptly.

## Server Contract Dependencies
- **Socket Interfaces**: We depend strongly on receiving `manager:errorMessage` string payloads directly inside our socket listeners.
- **Authorization Enforcement**: Front-end handles state gracefully but respects that the actual blocking is done server-side using socket connection checks (e.g., verifying `socket.id` against `authenticatedManagers`).

## Tests
- The E2E Playwright test suite can verify components. Standard unit and formatting testing flows apply. The core logic change enables graceful recovery so it should be visible during active E2E sessions simulating manager disconnects.

## Known Issues
- Currently, when `manager:quizzList` fails during the initial load, it may require a manual interaction to reconnect the socket.
- The save timeout logic uses hardcoded 10-second delay constants; a scalable backend latency may exceed this under severe distress (but not under normal loads).
- The `isAuth` mechanism for `ManagerAuthPage` relies purely on `manager:quizzList` firing correctly; if a timeout occurs on that call, the view could remain at the password entry despite valid auth.

## Integration Notes
- This changeset affects socket interactions heavily; any subsequent changes to `ServerToClientEvents` must ensure `manager:errorMessage` retains its current signature.
