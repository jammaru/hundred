import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';

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

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`world layout and controls at ${viewport.width}px with retina rendering`, async ({
    browser,
  }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByTestId('provider-indicator')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('locale-en').click();
    const canvas = await page.getByTestId('world-canvas').boundingBox();
    const inspector = await page.getByTestId('inspector').boundingBox();
    expect(canvas).not.toBeNull();
    expect(inspector).not.toBeNull();
    if (viewport.width > 640) {
      expect(canvas!.x + canvas!.width).toBeLessThanOrEqual(inspector!.x);
    } else {
      expect(canvas!.y + canvas!.height).toBeLessThanOrEqual(inspector!.y);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );
    await page.getByTestId('camera-follow').click();
    await expect(page.getByTestId('camera-follow')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('camera-first').click();
    await expect(page.getByTestId('camera-first')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('camera-town').click();
    await expect(page.getByTestId('camera-town')).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
    await page.getByRole('button', { name: 'Fit town to view', exact: true }).click();
    await page.getByTestId('god-panel').locator('summary').click();
    await expect(page.getByTestId('god-add-food')).toBeVisible();
    await page.getByTestId('god-panel').locator('summary').click();
    await page.screenshot({
      path: `../../test-results/world-${viewport.width}.png`,
      fullPage: true,
      scale: 'css',
    });
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('prepared sprites have transparent margins and recovered building surfaces', async ({
  request,
}) => {
  for (const name of [
    'building-clinic',
    'building-tavern',
    'building-workshop',
    'prop-tree-2',
    'prop-stall-2',
    'prop-fountain',
    'villager-2',
    'villager-4',
    'villager-5',
    'villager-6',
  ]) {
    const response = await request.get(`/assets/world/${name}.png`);
    expect(response.ok()).toBe(true);
    const png = PNG.sync.read(await response.body());
    for (const index of [
      0,
      png.width - 1,
      (png.height - 1) * png.width,
      png.width * png.height - 1,
    ]) {
      expect(png.data[index * 4 + 3], `${name} margin`).toBe(0);
    }
    let solid = 0;
    for (let i = 0; i < png.data.length; i += 4) {
      if (png.data[i + 3]! > 200) solid += 1;
    }
    expect(solid / (png.width * png.height), `${name} subject`).toBeGreaterThan(0.15);
  }
});
