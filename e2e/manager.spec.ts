import { test, expect } from "@playwright/test"

test.describe("Manager Journey", () => {
  test("should load manager page", async ({ page }) => {
    await page.goto("/manager")

    const dismissButton = page.getByText("Dismiss & View App Interface");
    try {
        await dismissButton.waitFor({ state: "visible", timeout: 5000 });
        await dismissButton.click();
    } catch (e) {
        // Ignored
    }

    await expect(page.locator("body")).toBeVisible()
  })
})
