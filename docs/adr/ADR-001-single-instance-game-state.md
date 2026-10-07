# ADR-001: Single-Instance In-Memory Game State Engine

## Status
Accepted

## Context
The real-time game engine maintains live game lobbies, timers, and connected player references in-memory within `@rahoot/socket`.

## Decision
Retain single-instance in-memory state architecture with horizontal single-node deployment (e.g. Render Web Service).

## Rationale
Distributed state synchronization (e.g. via Redis adapters) adds operational complexity. A single-instance architecture provides maximum simplicity, lower latency, and determinism for room-based quiz sessions.
