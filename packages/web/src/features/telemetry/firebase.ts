export const trackEvent = (
  eventName: string,
  payload?: Record<string, unknown>,
): void => {
  console.info(`[Firebase Analytics] ${eventName}`, payload)
}
