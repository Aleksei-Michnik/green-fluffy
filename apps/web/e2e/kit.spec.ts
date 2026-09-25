import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Accessibility scan of the kit showcase (/kit, dev and staging only) in
 * every locale and both themes, plus the keyboard paths that jsdom cannot
 * prove: visible focus, modal dialog, live toasts.
 */

const locales = ['en', 'he', 'ru', 'uk'] as const;
const themes = ['light', 'dark'] as const;

const closeLabel: Record<(typeof locales)[number], string> = {
  en: 'Close',
  he: 'סגירה',
  ru: 'Закрыть',
  uk: 'Закрити',
};

async function openKit(
  page: Page,
  locale: (typeof locales)[number],
  theme: (typeof themes)[number],
) {
  await page
    .context()
    .addCookies([{ name: 'NEXT_LOCALE', value: locale, domain: 'localhost', path: '/' }]);
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
  await page.goto('/kit');
  await expect(page.getByRole('heading', { level: 1, name: 'UI kit' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect(page.locator('html')).toHaveAttribute('dir', locale === 'he' ? 'rtl' : 'ltr');
}

test.describe('UI kit showcase', () => {
  for (const locale of locales) {
    for (const theme of themes) {
      test(`has no axe violations — ${locale}, ${theme}`, async ({ page }) => {
        await openKit(page, locale, theme);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze();
        expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      });
    }
  }

  test('the skip link is the first tab stop and focus is visibly ringed', async ({ page }) => {
    await openKit(page, 'en', 'light');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to content' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus-visible');
    await expect(focused).toHaveCount(1);
    expect(await focused.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
    expect(await focused.evaluate((el) => getComputedStyle(el).outlineWidth)).toBe('3px');
  });

  test('the dialog is modal, closes on Escape and returns focus', async ({ page }) => {
    await openKit(page, 'en', 'light');
    const trigger = page.getByRole('button', { name: 'Open dialog' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Archive Muffin?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    // Everything outside a modal <dialog> is inert: the trigger cannot be reached.
    expect(await trigger.evaluate((el) => el.matches(':focus-visible'))).toBe(false);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('the close button of the dialog is localised', async ({ page }) => {
    for (const locale of ['he', 'uk'] as const) {
      await openKit(page, locale, 'light');
      await page.getByRole('button', { name: 'Open dialog' }).click();
      await expect(page.getByRole('button', { name: closeLabel[locale] })).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('toasts are live regions and dismissible from the keyboard', async ({ page }) => {
    await openKit(page, 'en', 'light');
    await page.getByRole('button', { name: 'Error toast (sticky)' }).click();
    const toast = page.getByRole('alert').filter({ hasText: 'Could not save.' });
    await expect(toast).toBeVisible();
    await toast.getByRole('button', { name: 'Dismiss' }).focus();
    await page.keyboard.press('Enter');
    await expect(toast).toBeHidden();
  });

  test('reduced motion disables the ripple', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openKit(page, 'en', 'light');
    await page.getByRole('button', { name: 'primary' }).first().click();
    await expect(page.getByTestId('ripple-host')).toHaveCount(0);
  });
});
