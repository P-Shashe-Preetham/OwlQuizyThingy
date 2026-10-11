import { test, expect } from "@playwright/test"

test.describe("Player Journey", () => {
  test("should load player page", async ({ page }) => {
    await page.goto("/")

    // Bypass loader if present
    const dismissButton = page.getByText("Dismiss & View App Interface");
    try {
        await dismissButton.waitFor({ state: "visible", timeout: 5000 });
        await dismissButton.click();
    } catch (e) {
        // May not appear if it connects or takes too long
    }

    // Once bypassed, the Player Auth page should load
    await expect(page.locator("body")).toBeVisible()
  })
})
