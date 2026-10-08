# Rollback Runbook

## Overview
This runbook describes the procedure to roll back a problematic deployment of OwlQuizyThingy.

## Procedure

1. **Identify Stable Tag**: Locate the Git hash or Docker image tag of the last known stable release.
2. **Pull Stable Image**:
   ```bash
   docker pull owlquizythingy:stable_tag
   ```
3. **Update Compose File**: Temporarily modify `compose.yml` to point to the stable image tag.
4. **Deploy Rollback**:
   ```bash
   docker compose up -d
   ```
5. **Verify Health**: Check the `/health` endpoint to ensure the service has initialized correctly.
6. **Revert Git Repository**: If the change was deployed via CI/CD, revert the offending PR in GitHub to ensure the main branch reflects the stable state.
