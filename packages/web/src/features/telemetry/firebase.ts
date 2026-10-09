export const trackEvent = async (eventName: string, payload?: Record<string, any>) => {
  try {
    console.log(`[Firebase Analytics] ${eventName}`, payload);
  } catch (error) {
    console.error("Failed to send telemetry event", error)
  }
}
