import { test, expect } from "@playwright/test"

test("Creator page loads", async ({ page }) => {
  // If we try to go to creator directly, it should show checking auth and then redirect to manager
  await page.goto("/creator")

  // Should end up on the manager auth page since we are not authenticated
  await expect(page).toHaveURL(/.*\/manager/u)
})
