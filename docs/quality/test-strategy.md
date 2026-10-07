# Testing Strategy

## Coverage Baseline
Unit and component test coverage is established and verified via Vitest. E2E UI coverage operates via Playwright. Contract testing focuses on Socket.IO events.

## Test Pyramid Implementation
- **Unit**: Focus on validators, parsers, helper functions (`@rahoot/common`).
- **Integration**: Service integration, component integration (React Context/Zustand logic).
- **Contract**: Socket.IO input/output validation (`@rahoot/socket`).
- **E2E**: Complete journeys (Player / Manager) via `@playwright/test`.
- **Accessibility**: Audited using `@axe-core/playwright`.
- **Load/Security/Resilience**: High load tested using `k6`. Resilience through negative path scenarios.
