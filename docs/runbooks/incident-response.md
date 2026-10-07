# Incident Response Runbook

## 1. Preparation
Ensure you have access to the production environment, Docker host logs, and the Firebase Console.

## 2. Detection and Identification
- **Symptom:** Players cannot connect, or game state is unresponsive.
- **Action:** Check the `/health` endpoint of the Socket Server.
- **Action:** Review Docker container logs: `docker logs <container_name> --tail 100`.

## 3. Containment
- If the issue is severe (e.g., suspected unauthorized access or payload flooding), immediately restart the container to flush in-memory state:
  ```bash
  docker restart <container_name>
  ```
- *Note:* Restarting the Socket Server will drop all active games. Communicate to managers that they must create new game sessions.

## 4. Remediation
- Review application logs for Zod validation errors or authentication failures.
- If the issue stems from an infrastructure change (e.g., an outage in Firebase), see `dependency-outage.md`.

## 5. Post-Incident Review
Within 48 hours, document the root cause, timeline, and mitigation strategies in an internal incident report.
