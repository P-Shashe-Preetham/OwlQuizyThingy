import { test, expect } from "@playwright/test"

test.describe("Manager Journey", () => {
  test("should load manager page", async ({ page }) => {
    await page.goto("/manager")
    await expect(page.locator("body")).toBeVisible()
  })
})
