# Resilience Matrix

Testing application states under failure conditions:
- **Server Restart**: Socket reconnects without throwing fatal client errors.
- **Persistence Outage**: Falls back to temporary memory maps where applicable.
- **Network Interruptions**: Simulated network delays to ensure debouncing and buffering.
- **Malformed Data**: Handled and rejected gracefully via Zod parsing constraints.
