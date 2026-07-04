import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Verify the page title
    await expect(page).toHaveTitle(/Green and Fluffy/);

    // Verify main heading is visible
    await expect(page.getByRole('heading', { name: 'Green and Fluffy' })).toBeVisible();
  });

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test.describe('locales', () => {
    for (const { locale, appName } of [
      { locale: 'en', appName: 'Green and Fluffy' },
      { locale: 'he', appName: 'ירוק ופלאפי' },
      { locale: 'ru', appName: 'Зелёные и пушистые' },
      { locale: 'uk', appName: 'Зелені та пухнасті' },
    ]) {
      test(`renders in ${locale}`, async ({ page, context }) => {
        await context.addCookies([
          { name: 'NEXT_LOCALE', value: locale, domain: 'localhost', path: '/' },
        ]);
        await page.goto('/');
        await expect(page.getByRole('heading', { name: appName })).toBeVisible();
        if (locale === 'he') {
          await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
        }
      });
    }
  });

  test('theme toggle switches theme', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('theme-toggle');
    await expect(toggle).toBeVisible();
    const before = await page.locator('html').getAttribute('data-theme');
    await toggle.click();
    const after = await page.locator('html').getAttribute('data-theme');
    expect(after).not.toBe(before);
  });
});
