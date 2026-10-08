export type LogLevel = "debug" | "info" | "warn" | "error"

const SENSITIVE_KEYS = ["password", "token", "secret", "credential", "FIREBASE_SERVICE_ACCOUNT", "MANAGER_PASSWORD"]

function sanitize(data: any): any {
  if (data === null || data === undefined) {return data}

  if (typeof data !== "object") {return data}

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item))
  }

  const sanitized: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey))) {
      sanitized[key] = "[REDACTED]"
    } else {
      sanitized[key] = typeof value === "object" ? sanitize(value) : value
    }
  }


return sanitized
}

export const logger = {
  log: (level: LogLevel, message: string, meta?: Record<string, any>) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta ? { meta: sanitize(meta) } : {}),
    }

    // Only output as JSON for production-like environments or generic structured logging
    const output = JSON.stringify(logEntry)

    switch (level) {
      case "debug":
        console.debug(output)

        break

      case "info":
        console.info(output)

        break

      case "warn":
        console.warn(output)

        break

      case "error":
        console.error(output)

        break
    }
  },

  debug: (message: string, meta?: Record<string, any>) => logger.log("debug", message, meta),
  info: (message: string, meta?: Record<string, any>) => logger.log("info", message, meta),
  warn: (message: string, meta?: Record<string, any>) => logger.log("warn", message, meta),
  error: (message: string, meta?: Record<string, any>) => logger.log("error", message, meta),
}
