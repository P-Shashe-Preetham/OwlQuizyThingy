# Persistence Boundary Audit & Refactor

## Mission
Make Firestore the clear, type-safe, authoritative source of truth for durable production data (quizzes). Remove silent dual-source conflicts between Firestore and local JSON config files.

## Summary of Changes
1. **FirebaseService (`packages/socket/src/services/firebase.ts`)**
   - Removed `any` and typed all inputs and outputs against `Quizz` and `QuizzWithId`.
   - Utilized `FirestoreDataConverter` for type safety on save/read.
   - Enhanced error handling to throw specific and readable error messages when Firestore encounters permission issues, uninitialized state, or validation failures.
   - Refactored away malformed documents dynamically filtering them instead of crashing the query process.

2. **Game Core (`packages/socket/src/index.ts`)**
   - Eliminated the dual-source conflict (`getCombinedQuizList`).
   - Refactored `game:create`, `manager:saveQuizz`, and `manager:deleteQuizz` to strictly respect Firestore as the canonical data source when initialized.
   - Local JSON loaded via `Config.quizz()` acts **only** as a development fallback when `FIREBASE_SERVICE_ACCOUNT` is absent.

3. **Config (`packages/socket/src/services/config.ts`)**
   - Formally documented `Config.quizz()` as a fallback in development environments to discourage assumptions that it persists into production.

4. **Persistence Tests (`packages/socket/src/__tests__/persistence.test.ts`)**
   - Added specific tests to validate schema failure and missing document behavior during saves/deletions.

## Remaining Risks
- The transition from local config to Firebase is dependent solely on `FirebaseService.isInitialized()`. A partial/incorrect Firebase service account will silently downgrade the system to development local fallback without crashing the app. Check server logs (`FIREBASE_SERVICE_ACCOUNT not found`) in production.

## Schema Decisions
- Used `zod` strictly to gate outgoing (and incoming) data.
- The authoritative ID resides entirely in Firestore (`doc.id`), eliminating ID overlap conflicts between local JSON and Firestore.

## Test Evidence
- Persistence unit tests explicitly guard against malformed data and missing initialization. All linter checks currently pass.
