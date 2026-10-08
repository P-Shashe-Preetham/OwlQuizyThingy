# Testing, Accessibility, Performance, and Resilience Engineering Handoff

## Testing Matrix

| Testing Type | Tool Used | Execution Command | Scope / Coverage |
| :--- | :--- | :--- | :--- |
| **Unit** | Vitest | `pnpm -r test` | `@rahoot/common` and `@rahoot/socket` utilities, state transitions, config validations, game lifecycle. |
| **Integration** | Vitest | `pnpm -r test` | Included with unit suite; verifies system-boundary mechanics (Firestore adapter, Socket.IO connections). |
| **Contract** | Vitest | `pnpm -r test` | Included with unit suite; validates Socket event shapes, payloads, shared schemas between client & server. |
| **E2E** | Playwright | `pnpm exec playwright test` | Automates and asserts full end-to-end user journeys (manager login, quiz management, game cycles, player join). |
| **Accessibility** | axe-core + Playwright | `pnpm exec playwright test` | Fully integrated in E2E. Sweeps pages for major accessibility defects (aria-roles, contrast, semantic tags). |
| **Performance** | Lighthouse CI (lhci) | `pnpm exec lhci autorun` | Evaluates Core Web Vitals across critical routes upon building. Fails on severe performance regression. |
| **Load** | k6 | `k6 run k6-load-test.js` | Simulates concurrent connection churn for WebSocket emulation and backend throughput verification. |
| **Mutation** | Stryker | `pnpm exec stryker run` | Injects programmatic faults into application behavior to strictly validate the effectiveness of the test suites. |

## Commands Reinstated for CI

The mocked and swallowed testing procedures inside `.github/workflows/ci.yml` have been replaced with the following genuine engineering commands:

*   **Integration / Contract Tests:** Replaced mocked commands with `pnpm test`.
*   **Performance (Lighthouse):** Replaced swallowed `|| echo "Lighthouse completed"` with strict execution `pnpm exec lhci autorun`.
*   **Mutation (Stryker):** Replaced swallowed `|| echo "Stryker run completed"` with strict execution `pnpm exec stryker run`.
*   **Load Testing (k6):** Removed the fake `k6` NPM dependency (`^0.0.0`) and added the `grafana/setup-k6-action@v1` GitHub Action to install the real k6 binary correctly.

## Execution Results

1.  **Vitest**: Identified and fixed missing dependencies (`zod` in `@rahoot/common` and `@tailwindcss/vite` in `@rahoot/web`). All 19 vitest tests now pass smoothly across the workspace.
2.  **Playwright (E2E & Accessibility)**: Passed both core journeys across chromium seamlessly in `~11.5s`. No severe axe-core accessibility errors detected.
3.  **Lighthouse (Performance)**: Successfully passed strict assertion standards. Updated `lighthouserc.json` to configure the correct server command ports ensuring the Lighthouse probe connects.

## Environment Limitations

*   **CI Dependency Resolution:** CI depends on having correct binary environments specifically for Load testing and Browser operations, making explicit setup commands necessary (e.g. `grafana/setup-k6-action`, Playwright dependency installer).

## Flaky Tests

*   No visibly flaky tests emerged in standard unit test suites.
*   However, game-state teardown delays can occasionally cause concurrency warnings if instances bleed memory context across Vitest environments. Test environments should strictly instantiate clear Game Engine states on every test run.

## Performance Observations

*   Lighthouse identified large JavaScript bundles in the `@rahoot/web` application (`>500kB` post-minification). Dynamic importing, route-based code-splitting, or manual rollup chunking configurations could significantly benefit total initial page load metrics for mobile.

## Remaining Gaps

*   The current `k6-load-test.js` is quite basic and primarily checks the main endpoint's HTTP status (`200 OK`). To thoroughly stress test the application, it should be expanded to simulate the Socket.IO lifecycle: heavy initial connection churn, rapid game state broadcasts, question submission bottlenecks, and large disconnect-reconnect waves simulating unstable mobile clients.
