# Dependency Outage (Firebase/Tinybird)

1. **Firebase**: If Firestore is down, fallback to local JSON configuration automatically handles Quiz loading, but saving is disabled.
2. **Tinybird**: Telemetry is fully async and non-blocking. If Tinybird is down, events are dropped silently without affecting user experience.
