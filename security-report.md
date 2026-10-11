
# Security Audit Report

## Methodology
Analyzed the codebase (especially `functions/src/index.ts`, `functions/src/gameUtils.ts`, frontend interactions in `packages/web/src`) to identify security and correctness vulnerabilities, assuming an adversarial environment where clients can manipulate inputs, send concurrent requests, and exploit trust boundaries.

## Findings

### 1. `saveQuiz` Missing Input Validation & Missing Authorization Checks
* **Severity**: High
* **Status**: CONFIRMED
* **Location**: `functions/src/index.ts` -> `saveQuiz`
* **Preconditions**: An authenticated user calls `saveQuiz` with manipulated data.
* **Attack Scenario**:
  1. A user calls `saveQuiz` passing an `id` that belongs to another user"s quiz.
  2. The function does not verify if the caller owns the existing quiz (it uses `{ merge: true }` and blindly sets `managerUid: request.auth?.uid`).
  3. This allows an attacker to overwrite or take ownership of any other user"s quiz if they can guess or enumerate the `quizId`.
  4. Furthermore, input validation relies purely on client-side constraints. The comment explicitly says: `// In a real implementation we would validate using Zod here`.
* **Impact**: Data modification, unauthorized ownership takeover, and corruption of quizzes.
* **Recommended Fix**: Verify ownership by checking `(await firestore.collection("quizzes").doc(quizId).get()).data()?.managerUid === request.auth?.uid` before updating an existing quiz. Use Zod schemas in the Cloud Function to validate the shape and contents of `subject`, `settings`, and `questions`.
* **Required Regression Test**: Test attempting to save a quiz with an ID belonging to a different user, asserting it throws a `permission-denied` error.

### 2. Information Leakage via `SHOW_RESPONSES` Status Update Race
* **Severity**: Medium
* **Status**: CONFIRMED
* **Location**: `functions/src/index.ts` -> `advanceGame`
* **Preconditions**: The game is transitioning to `SHOW_RESPONSES` or earlier public statuses.
* **Attack Scenario**:
  1. `advanceGame` bundles public question data *after* the status change transaction:
     ```typescript
     if ([STATUS.SHOW_PREPARED, STATUS.SHOW_QUESTION, STATUS.SELECT_ANSWER, STATUS.SHOW_RESPONSES].includes(nextStatus as any)) { ... await gameRef.child("currentQuestionData").set(publicData); }
     ```
  2. Because the transaction updates the state first, there is a race condition where clients listening to RTDB receive the state update, but the `currentQuestionData` might not yet be updated or might briefly be mismatched if the function fails midway.
  3. More importantly, when advancing to `SHOW_LEADERBOARD` (which doesn"t trigger the above block), it leaves the old `currentQuestionData` around until `FINISHED`.
* **Impact**: Potential sync issues and UI glitches.
* **Recommended Fix**: Update the `currentQuestionData` *inside* the RTDB transaction or strictly update it *before* committing the status change to ensure clients receive a consistent state.

### 3. Missing Rate Limiting and Brute Force Protection on `getGameByPin`
* **Severity**: Low / Medium
* **Status**: LIKELY
* **Location**: `functions/src/index.ts` -> `getGameByPin`
* **Preconditions**: A bot or attacker targets the `/getGameByPin` endpoint.
* **Attack Scenario**:
  1. PINs are 6 numeric digits (1,000,000 possibilities).
  2. An attacker can concurrently spam `getGameByPin` to enumerate active games, as there is no rate limiting or CAPTCHA enforced on this endpoint.
  3. Once a valid game is found, they can join the game using `joinGame` (if they are authenticated, which just requires signing up).
* **Impact**: Unauthorized access to ongoing games and potential griefing.
* **Recommended Fix**: Enforce Firebase AppCheck on the function or implement strict rate limiting based on IP/UID for failed attempts.
* **Required Regression Test**: Emulate multiple invalid PIN requests and verify a rate-limit error is thrown (if implemented).

### 4. Missing Firestore/RTDB Security Rules
* **Severity**: Critical
* **Status**: LIKELY (Missing from repo)
* **Location**: Entire Database (Firestore & Realtime Database)
* **Preconditions**: An attacker attempts to read/write directly to the Firebase backend using their client SDK credentials.
* **Attack Scenario**:
  1. The codebase uses Cloud Functions (Admin SDK) for all writes, which is good.
  2. However, there are no `firestore.rules` or `database.rules.json` files defined in the repository.
  3. If the deployed rules are set to `allow read, write: if true;` or even `if request.auth != null;`, an attacker can bypass the Cloud Functions entirely and write malicious data directly to `/games` in RTDB or `quizzes` in Firestore.
* **Impact**: Complete compromise of all application data, bypassing all business logic and authorization checks in Cloud Functions.
* **Recommended Fix**: Deploy strict Security Rules that deny all client writes (since all writes happen via Cloud Functions) and strictly scope reads (e.g., a user can only read their own quizzes, users can only read games they are part of or public game data).
* **Required Regression Test**: Test direct client SDK writes to Firestore and RTDB, asserting they are rejected with permission-denied.

### 5. Potential Negative Points Calculation
* **Severity**: Low
* **Status**: CONFIRMED
* **Location**: `functions/src/index.ts` -> `advanceGame` (Scoring calculation)
* **Preconditions**: A player submits an answer, but the manager delays advancing the game for a long time.
* **Attack Scenario**:
  1. The points calculation is: `const elapsedSeconds = Math.max(0, (answerData.submittedAt - startTime) / 1000);`
  2. The `startTime` is estimated using `game.updatedAt` (the time the status changed to `SELECT_ANSWER`).
  3. While `Math.max(500, Math.min(1000, points))` theoretically prevents points from dropping below 500, the logic relies on `game.updatedAt` being accurate. If a client manipulates `answerData.submittedAt` (if they could write it directly, see Finding #4) or if the server clock drifts, calculations could be skewed.
  4. More importantly, the scoring logic is executed *only* when transitioning *out* of `SELECT_ANSWER`, iterating over all submitted answers.
* **Impact**: Minor scoring inaccuracies.
* **Recommended Fix**: Record the exact start time of the question on the server reliably, and ideally, calculate the score at the exact moment the answer is submitted in `submitAnswer` rather than waiting for the manager to advance the game.

### 6. No Validation on `kickPlayer` `playerId`
* **Severity**: Low
* **Status**: CONFIRMED
* **Location**: `functions/src/index.ts` -> `kickPlayer`
* **Preconditions**: A manager calls `kickPlayer`.
* **Attack Scenario**:
  1. A manager can pass any string as `playerId`.
  2. While they can only kick players from their own game (`game.managerUid === request.auth?.uid`), they could potentially inject malicious paths if the `playerId` contains `/` or other special characters, though Firebase typically sanitizes RTDB keys.
* **Impact**: Negligible in practice due to RTDB key constraints, but technically poor hygiene.
* **Recommended Fix**: Validate `playerId` format.

## Conclusion
The most critical vulnerabilities lie in the `saveQuiz` function (which allows stealing/overwriting other users" quizzes) and the likely absence of strict Firebase Security Rules, which would render all Cloud Function protections moot if clients can write directly to the databases.
