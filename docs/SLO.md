# Service Level Objectives (SLOs)

## 1. Availability
- **Objective**: 99.9% uptime for the WebSocket server and Web frontend.
- **Measurement**: Render health checks (`/health`) returning 200 OK, monitored externally.

## 2. Latency
- **Objective**: 95% of API requests and WebSocket payload responses complete in < 200ms.
- **Measurement**: Tinybird / proxy metrics for HTTP, socket emission RTT.

## 3. Error Rate
- **Objective**: < 1% of total requests/connections result in 5xx errors or unexpected drops.
- **Measurement**: Nginx reverse proxy error rates & Node.js unhandled exceptions logged in Render.

## 4. Realtime Connectivity
- **Objective**: > 99% connection success rate for players joining a room.
- **Measurement**: `trackEvent("player_joined_room")` vs connection attempt ratios.
