import { test, expect } from "@playwright/test"

test.describe("Player Journey", () => {
  test("should load player page and display Game PIN input", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole('heading', { name: 'Enter Game PIN' })).toBeVisible()
  })

  test("should show error on invalid PIN", async ({ page }) => {
    test.setTimeout(60000)
    await page.goto("/")
    await expect(page.getByRole('heading', { name: 'Enter Game PIN' })).toBeVisible()

    await page.getByPlaceholder("PIN").fill("123456")
    await page.getByRole('button', { name: 'Enter' }).click()

    await expect(page.getByText(/Game not found|INTERNAL|failed/i).first()).toBeVisible({ timeout: 15000 })
  })
})
