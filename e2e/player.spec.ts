import { test, expect } from "@playwright/test"

test.describe("Player Journey", () => {
  test("should load player page", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("body")).toBeVisible()
  })
})
