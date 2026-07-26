import { test, expect } from '@playwright/test';

test('basic spreadsheet edit', async ({ page }) => {
  await page.goto('/');
  // Wait for app to load
  await page.waitForSelector('text=MiniTab');
  // Check that a cell exists
  const cell = page.locator('[style*="gridColumn"]').first();
  await expect(cell).toBeVisible();
});
