# Database Restore Runbook

## Overview
How to restore Firebase Firestore data if corruption or accidental deletion occurs.

## Prerequisites
- Google Cloud SDK (`gcloud`) installed and authenticated.
- Firestore backups must be enabled in the project (Point-in-Time Recovery or scheduled backups).

## Procedure (Point-in-Time Recovery - PITR)
If PITR is enabled (allows recovery within the last 7 days):
1. Identify the exact timestamp just before the corruption occurred.
2. Use the `gcloud` CLI to initiate a restore operation to a new database instance:
   ```bash
   gcloud firestore databases restore \
       --source-backup=<backup_id> \
       --destination-database=<new_database_id>
   ```
3. Update backend configuration to point to the restored database if applicable, or manually export/import the recovered collections back into the primary default database.

## Validation
1. Start a local instance of the application using the restored database credentials.
2. Verify that the expected quiz collections are present and load correctly in the UI.
