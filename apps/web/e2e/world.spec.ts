import { expect, test } from '@playwright/test';

test('world loads with inspector chrome', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('HUNDRED.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('world-canvas')).toBeVisible();
  await expect(page.getByTestId('inspector')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('provider-indicator')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('god-panel')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('event-feed')).toBeVisible();
  await expect(page.getByTestId('camera-first')).toBeVisible();
  await page.getByTestId('pause-toggle').click();
});
