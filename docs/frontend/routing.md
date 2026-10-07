# Routing Architecture

## Overview
We use React Router 7 for application routing.

## Layouts
- **App Shell (`GameLayout`):** The outermost layout providing global context (e.g., Socket.IO).
- **Auth Shell (`AuthLayout`):** Layout for authentication pages (player and manager).
- **Protected Routes:** Routes requiring manager authentication are wrapped in `ManagerProtectedRoute`.

## Routes
- `/` - Player Auth
- `/manager` - Manager Auth
- `/creator` - Quiz Creator (Protected)
- `/party/manager/:gameId` - Manager Game View (Protected)
- `/party/:gameId` - Player Game View
