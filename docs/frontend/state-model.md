# State Architecture

## Overview
State management in OwlQuizThingy relies primarily on Context API + Zustand.

## Categories
1. **Server/Realtime State:** Managed via Socket.IO events and local contexts (`SocketProvider`).
2. **Global UI State:** Minimal use of Zustand for cross-feature UI state (e.g., manager/player stores).
3. **Local State:** React `useState` for component-specific interactions.
