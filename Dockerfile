# ---- BASE ----
FROM node:26-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

# ---- BUILDER ----
FROM base AS builder
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/common/package.json ./packages/common/
COPY packages/web/package.json ./packages/web/
COPY packages/socket/package.json ./packages/socket/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# ---- RUNNER ----
FROM alpine:3.24 AS runner

RUN apk add --no-cache nginx nodejs supervisor wget

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

COPY --from=builder /app/packages/web/dist /app/web
COPY --from=builder /app/packages/socket/dist/index.cjs /app/socket/index.cjs
COPY --from=builder /app/config /app/config

RUN adduser -D appuser && \
    chown -R appuser:appuser /app && \
    chown appuser:appuser /etc/supervisord.conf && \
    mkdir -p /tmp/supervisor && \
    chown -R appuser:appuser /tmp/supervisor

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/health

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
