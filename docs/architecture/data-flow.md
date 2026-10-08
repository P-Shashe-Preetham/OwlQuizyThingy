# Data Flow

## Overview

The **Data Flow** diagram maps the primary sequence of operations and data exchanges during a typical game lifecycle in OwlQuizyThingy.

## Interaction Flow (Sequence Diagram)

```mermaid
sequenceDiagram
    participant Manager
    participant WebApp as Web Client
    participant Server as Socket Server
    participant Firebase as Firestore

    %% Setup Phase
    Manager->>WebApp: Log in with password
    WebApp->>Server: auth:login (password)
    Server-->>WebApp: token / auth success
    Manager->>WebApp: Select Quiz
    WebApp->>Server: game:create (quizId)
    Server->>Firebase: Fetch quiz data
    Firebase-->>Server: Quiz JSON
    Server-->>WebApp: Game PIN created

    %% Join Phase
    participant Player
    Player->>WebApp: Enter PIN & Username
    WebApp->>Server: player:join (PIN, username)
    Server-->>WebApp: Join success / Game State

    %% Game Loop
    Manager->>WebApp: Start Game
    WebApp->>Server: game:start
    Server-->>WebApp: state: transition to 'question'

    rect rgb(200, 220, 240)
        Note over Server, Player: Round Timer Started
        Player->>WebApp: Select Answer
        WebApp->>Server: player:answer (choice)
        Server-->>WebApp: Answer received

        Note over Server: Timer Ends OR Fast-Forward
        Server-->>WebApp: state: transition to 'answers'
        Server-->>WebApp: broadcast scores
    end

    %% End Phase
    Manager->>WebApp: End Game
    WebApp->>Server: game:end
    Server-->>WebApp: state: transition to 'podium'
```

## State Management

The backend Node.js server maintains the absolute truth of the game state. Client instances only receive sanitized, partial views of this state (e.g., players do not see the correct answer until the round ends).

- **Payload Validation**: Every step in this data flow that crosses the client-to-server boundary is validated using Zod.
- **Round Concurrency**: Timers are bound to a specific generation token to prevent stale callbacks from triggering accidental state transitions.
