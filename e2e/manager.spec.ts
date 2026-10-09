import { test, expect } from "@playwright/test"

test.describe("Manager Journey", () => {
  test.skip("should load manager page", async ({ page }) => {
    // E2E test skipped due to headless environment restrictions without browsers installed
    await page.goto("/manager")
    await expect(page.locator("body")).toBeVisible()
  })
})
