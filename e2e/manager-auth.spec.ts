import { test, expect } from "@playwright/test"

test("Manager authentication flow with invalid credentials", async ({ page }) => {
  await page.goto("/manager")

  // Wait for the auth layout or password field
  const passwordInput = page.getByPlaceholder('Enter password...')
  await expect(passwordInput).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Manager Access' })).toBeVisible()

  // Fill in invalid credentials
  await passwordInput.fill('invalidpassword')

  // Submit the form
  await page.getByRole('button', { name: 'Sign In' }).click()

  // The toast should show Invalid credentials or a similar failure message from Firebase Auth
  await expect(page.getByText(/Invalid credentials|INTERNAL|failed/i).first()).toBeVisible({ timeout: 15000 })
})
