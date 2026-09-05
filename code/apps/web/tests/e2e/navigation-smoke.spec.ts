import { expect, test } from '@playwright/test';

const routes = ['/notifications', '/activity', '/messages', '/driver', '/ride-hailing', '/admin/pricing', '/admin/trips'];

test.describe('critical route navigation', () => {
  for (const route of routes) {
    test(`${route} resolves without 404`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).not.toBe(404);
      await expect(page.locator('body')).not.toContainText('This page could not be found');
    });
  }

  for (const width of [375, 768, 1024, 1440]) {
    test(`ride-hailing has no horizontal overflow at ${width}px`, async ({ page, context }) => {
      await context.addCookies([{ name: 'refreshToken', value: 'layout-smoke', domain: 'localhost', path: '/' }]);
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
      await page.goto('/ride-hailing');
      const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
      await expect(page.getByRole('heading', { name: 'Bạn muốn đi đâu?' })).toBeVisible();
    });
  }
});
