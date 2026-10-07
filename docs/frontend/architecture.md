# Frontend Architecture

## Overview
The frontend of OwlQuizThingy follows a modular architecture based on strong feature boundaries. We separate the application shell, shared utilities/components, authentication, and specific feature domains (e.g., game, player, manager, quiz).

## Structure
- `src/shell`: Application shell, top-level layouts, routing wrappers, and global error/loading boundaries.
- `src/shared`: Reusable components (UI primitives), hooks, utilities, and types that are truly shared across features.
- `src/features`: Domain-specific modules (e.g., game). Each feature should be self-contained with its own components, hooks, stores, and utilities.
- `src/pages`: Route-level components that compose features into views.
