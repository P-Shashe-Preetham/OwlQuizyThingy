# Threat Model

## Overview

This threat model outlines trust boundaries, potential threats, and the implemented mitigations within OwlQuizyThingy.

## Trust Boundaries Diagram

```mermaid
flowchart TD
    subgraph Untrusted Network [Untrusted Internet]
        M[Manager Client]
        P[Player Client]
    end

    subgraph Trust Boundary [Server Infrastructure]
        S[Socket Server]
        C[Local Config]
    end

    subgraph External Trusted [Cloud Provider]
        F[Firebase Firestore]
    end

    M -- "WSS (Auth required)" --> S
    P -- "WSS (PIN required)" --> S
    S -- "File I/O" --> C
    S -- "HTTPS (Service Account)" --> F

    classDef boundary fill:none,stroke:#f66,stroke-width:2px,stroke-dasharray: 5 5;
    class Trust Boundary boundary;
```

## Threat Matrix

| Threat | Component | Risk Level | Mitigation | Validation |
| :--- | :--- | :---: | :--- | :--- |
| **Unauthorized Manager Access** | Socket Server | High | Authentication required for privileged events. Hardcoded default passwords prohibited. | E2E Tests, unit tests for auth middleware. |
| **Payload Injection / Fuzzing** | Socket Server | Medium | Strict schema validation using Zod for all incoming WebSocket messages. | Payload bounds checking tests. |
| **Cross-Origin Resource Sharing** | Web Server | Medium | Strict CORS enforcement (`CORS_ORIGIN`). Refusal of unauthorized WebSocket handshake attempts. | Network trace verification. |
| **Secret Exposure** | Source Code | High | `.gitignore` and `.dockerignore` enforcement. Secrets loaded exclusively via ENV variables at runtime. | CI/CD Gitleaks scanning. |
| **Overlapping Round Transitions** | Socket Server | High | Added `currentGeneration` tokens and `abortCooldown()` timer cancellation to prevent race conditions. | Game engine concurrency tests. |
