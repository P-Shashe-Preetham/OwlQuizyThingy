# Credential Rotation Runbook

## Overview
How to rotate secrets used by OwlQuizyThingy.

## Manager Password
1. Generate a new, secure password (e.g., using `openssl rand -base64 32`).
2. Update the `MANAGER_PASSWORD` environment variable on the host environment (or via your secrets manager).
3. Restart the Socket Server container:
   ```bash
   docker restart <container_name>
   ```
4. Notify authorized managers of the new password.

## Firebase Service Account
If the service account key is compromised:
1. Navigate to the Firebase Console -> Project Settings -> Service Accounts.
2. Generate a new private key.
3. Revoke/delete the old compromised key.
4. Base64 encode the new JSON file.
5. Update the `FIREBASE_SERVICE_ACCOUNT` environment variable.
6. Restart the Socket Server container.
