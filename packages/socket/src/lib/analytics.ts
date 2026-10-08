import fetch from "node-fetch"
import { logger } from "./observability/logger"

export async function trackEvent(eventName: string, data: Record<string, any> = {}) {
  const token = process.env.TINYBIRD_TOKEN

  if (!token) {
    // Graceful fallback if analytics token is not provided (avoids single point of failure)
    return
  }

  try {
    const payload = {
      timestamp: new Date().toISOString(),
      event: eventName,
      ...data,
    }

    // Using Tinybird events endpoint (assuming datasource named `events`)
    await fetch(`https://api.tinybird.co/v0/events?name=owlquiz_events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      timeout: 2000,
    })
  } catch (err: any) {
    logger.warn("Telemetry error (ignored)", { error: err?.message || err })
  }
}
