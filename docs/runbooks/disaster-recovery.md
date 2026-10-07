# Disaster Recovery Runbook

## Overview
Procedures for recovering the OwlQuizyThingy platform after a catastrophic failure of the hosting environment or primary database.

## Host Failure (Compute)
Because the Socket Server relies entirely on in-memory state for live games, a compute failure results in total data loss for active game sessions.
1. Provision a new Docker host or fail over to a standby environment.
2. Deploy the application using `docker compose up -d`.
3. Update DNS records (or load balancer targets) to point to the new host.
4. Active games cannot be recovered; users must start new sessions.

## Firebase Failure (Database)
If Firebase Firestore suffers regional failure:
1. Since Firestore provides its own replication, verify status at the Google Cloud Status Dashboard.
2. If total data loss occurs and backups were configured, see `database-restore.md`.
3. If no backups exist or Firebase is permanently unreachable, the application can temporarily fallback to Local JSON mode by removing the `FIREBASE_SERVICE_ACCOUNT` variable, though this disables dynamic quiz creation.
