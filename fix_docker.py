import sys

# Dockerfile
with open("Dockerfile", "r") as f:
    dockerfile = f.read()

# Make non root user changes in runner stage
if "adduser -D appuser" not in dockerfile:
    dockerfile = dockerfile.replace(
        "COPY --from=builder /app/config /app/config",
        """COPY --from=builder /app/config /app/config

RUN adduser -D appuser && \\
    chown -R appuser:appuser /app && \\
    chown appuser:appuser /etc/supervisord.conf && \\
    mkdir -p /tmp/supervisor && \\
    chown -R appuser:appuser /tmp/supervisor

USER appuser"""
    )

with open("Dockerfile", "w") as f:
    f.write(dockerfile)

# docker/supervisord.conf
with open("docker/supervisord.conf", "r") as f:
    supervisord = f.read()

if "pidfile=/tmp/supervisor/supervisord.pid" not in supervisord:
    supervisord = supervisord.replace(
        "pidfile=/tmp/supervisord.pid",
        "pidfile=/tmp/supervisor/supervisord.pid\nuser=appuser"
    )

with open("docker/supervisord.conf", "w") as f:
    f.write(supervisord)

# render.yaml
with open("render.yaml", "r") as f:
    render_yaml = f.read()

if "NODE_ENV" not in render_yaml:
    render_yaml = render_yaml.replace(
        "      - key: CORS_ORIGIN\n        sync: false",
        """      - key: CORS_ORIGIN
        sync: false
      - key: NODE_ENV
        value: production"""
    )
if "healthCheckPath" not in render_yaml:
    render_yaml = render_yaml.replace(
        "    startCommand: node packages/socket/dist/index.cjs",
        """    startCommand: node packages/socket/dist/index.cjs
    healthCheckPath: /health"""
    )

with open("render.yaml", "w") as f:
    f.write(render_yaml)

print("Docker and Render configs updated.")
