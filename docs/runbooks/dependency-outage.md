# Dependency Outage Runbook

## Overview
Procedures for handling outages of external dependencies.

## Firebase Outage
If Firebase is experiencing an outage (auth or Firestore):
1. **Detection:** Backend logs will show gRPC or timeout errors attempting to read/write quizzes.
2. **Impact:** Managers cannot create new quizzes. Existing quizzes cannot be loaded. Active games *in progress* might survive since state is held in memory, unless they require loading new media assets.
3. **Action:** Monitor the [Google Cloud Status Dashboard](https://status.cloud.google.com/).
4. **Action:** Communicate the degraded functionality to users.
5. **Mitigation:** If prolonged, consider falling back to Local JSON Config (requires restarting the server and manually porting over quiz JSON files if available).

## Cloudflare / CDN Outage
If the frontend CDN is down:
1. Users will be unable to load the web interface.
2. Monitor provider status page.
3. Keep the backend running; once the CDN recovers, clients will be able to reconnect.
