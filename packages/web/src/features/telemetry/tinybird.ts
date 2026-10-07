export const trackEvent = async (eventName: string, payload: Record<string, any>) => {
  try {
    const url = `https://api.tinybird.co/v0/events?name=${  eventName}`
    // NOTE: This is a stub for the tinybird token. In a real app this would come from env.
    const token = import.meta.env.VITE_TINYBIRD_TOKEN || "test_token"

    if (token === "test_token") {
      console.log("[Telemetry]", eventName, payload)


return
    }

    await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
  } catch (error) {
    console.error("Failed to send telemetry event", error)
  }
}
