# System Context

## Overview

The **System Context** document defines the high-level boundaries, users, and external systems that interact with **OwlQuizyThingy**.

## Context Diagram

```mermaid
C4Context
    title System Context diagram for OwlQuizyThingy

    Person(manager, "Quiz Manager", "Creates, hosts, and manages quiz sessions.")
    Person(player, "Quiz Player", "Joins a live quiz session using a unique PIN to answer questions.")

    System(owlQuiz, "OwlQuizyThingy", "Real-time, interactive quiz platform.")

    System_Ext(firebase, "Firebase (Firestore)", "Stores quiz configurations, collections, and handles basic authentication configuration for managers.")

    Rel(manager, owlQuiz, "Hosts quizzes, manages state", "HTTPS/WSS")
    Rel(player, owlQuiz, "Joins and plays quizzes", "HTTPS/WSS")
    Rel(owlQuiz, firebase, "Reads/writes quiz data", "HTTPS")
```

## System Elements

- **Quiz Manager**: The primary user who authenticates into the system, creates the quiz logic, opens a session, and navigates players through the questions.
- **Quiz Player**: The end-user connecting to a live session. They do not require authentication beyond providing the session PIN and a username.
- **OwlQuizyThingy**: The core application, consisting of the frontend user interface and the backend Socket.IO state machine.
- **Firebase**: The external cloud database.
