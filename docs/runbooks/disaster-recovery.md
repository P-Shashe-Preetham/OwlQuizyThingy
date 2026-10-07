# Disaster Recovery

1. **Database Corruption**: Restore from Firebase automated nightly backups via Google Cloud Console.
2. **Complete Region Outage**: Render allows redeployment to a different region (e.g. Frankfurt instead of Oregon) by updating `render.yaml` `region` parameter and executing a new push.
