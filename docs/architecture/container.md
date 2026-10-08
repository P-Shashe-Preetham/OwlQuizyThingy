# Container Architecture

## Overview

The **Container Architecture** document breaks down OwlQuizyThingy into its independently executable subsystems and shows how they communicate.

## Container Diagram

```mermaid
C4Container
    title Container diagram for OwlQuizyThingy

    Person(manager, "Quiz Manager", "Creates and hosts quizzes.")
    Person(player, "Quiz Player", "Joins and plays quizzes.")

    System_Boundary(c1, "OwlQuizyThingy") {
        Container(webApp, "Web Application", "React, Vite, Tailwind CSS", "Delivers the user interface for both Managers and Players. Communicates via REST and WebSockets.")
        Container(socketServer, "Socket Server", "Node.js, Socket.IO", "Maintains in-memory game state, handles real-time events, validates payloads, and authenticates managers.")
        Container(localConfig, "Local Config", "JSON", "Optional local persistent storage fallback.")
    }

    System_Ext(firebase, "Firebase (Firestore)", "Stores quiz configurations.")

    Rel(manager, webApp, "Visits", "HTTPS")
    Rel(player, webApp, "Visits", "HTTPS")

    Rel(webApp, socketServer, "Real-time state sync", "WSS")

    Rel(socketServer, firebase, "Reads/Writes quizzes", "HTTPS/gRPC")
    Rel(socketServer, localConfig, "Reads config", "File I/O")
```

## Containers

1. **Web Application (`@rahoot/web`)**:
   - A single-page application (SPA) built in React 19.
   - Hosted statically or via a lightweight Nginx container.
   - Manages client-side state using Zustand and interacts with the backend strictly through Socket.IO.

2. **Socket Server (`@rahoot/socket`)**:
   - The authoritative backend running on Node.js.
   - Uses Socket.IO for duplex communication.
   - Enforces business logic and state machine transitions entirely in-memory.

3. **Local Config**:
   - For environments lacking Firebase, a local JSON file stores minimal quiz definitions.
