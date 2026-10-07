const fs = require('fs');

let content = fs.readFileSync('e2e/player.spec.ts', 'utf8');

const additionalTests = `
  test('should handle invalid invite correctly', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder="PIN Code here"]', '000000');
    await page.click('button:has-text("Submit")');
    // Note: since this is just UI tests without a real backend in this context,
    // the loading state will resolve or it will show error, but the button should become usable again.
    await expect(page.locator('button:has-text("Submit")')).not.toBeDisabled({ timeout: 5000 });
  });`;

content = content.replace(
  `  });\n});`,
  `  });${additionalTests}\n});`
);

fs.writeFileSync('e2e/player.spec.ts', content);
