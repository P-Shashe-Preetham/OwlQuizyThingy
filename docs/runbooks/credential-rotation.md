# Credential Rotation

1. **Firebase Service Account**: Generate a new key in Firebase Console -> Project Settings -> Service Accounts. Update `FIREBASE_SERVICE_ACCOUNT` in Render env vars.
2. **Manager Password**: Change `MANAGER_PASSWORD` in Render env vars. Wait for redeploy. All current manager sessions will persist until disconnected, but new logins will require the new password.
