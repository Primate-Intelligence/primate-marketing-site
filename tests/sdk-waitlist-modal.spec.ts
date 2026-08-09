import { test, expect } from '@playwright/test';

/**
 * SDK waitlist modal (2026-08-09).
 *
 * The homepage "Join the SDK waitlist" CTA opens a modal that POSTs to the
 * API's /v1/waitlist with source:'sdk' + device_target. The API call is
 * intercepted here so the suite never writes real waitlist rows.
 */

test.describe('SDK waitlist modal', () => {
  test('CTA opens the modal; Escape closes it', async ({ page }) => {
    await page.goto('/');
    const modal = page.locator('#sdk-waitlist-modal');
    await expect(modal).toBeHidden();

    await page.click('#sdk-waitlist-open');
    await expect(modal).toBeVisible();
    await expect(page.locator('#sdk-modal-title')).toHaveText('Join the SDK waitlist');

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('submits sdk payload and shows success state', async ({ page }) => {
    let capturedBody: Record<string, unknown> | null = null;
    await page.route('**/v1/waitlist', async (route) => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'wl-test', email: 'e2e@test.com', status: 'pending', position: 42 }),
      });
    });

    await page.goto('/');
    await page.click('#sdk-waitlist-open');
    await page.fill('#sdk-waitlist-form input[name="full_name"]', 'E2E Tester');
    await page.fill('#sdk-waitlist-form input[name="email"]', 'e2e@test.com');
    await page.selectOption('#sdk-waitlist-form select[name="device_target"]', 'jetson');
    await page.fill('#sdk-waitlist-form input[name="company"]', 'Test Co');
    await page.click('#sdk-waitlist-form .sdk-modal-submit');

    await expect(page.locator('.sdk-modal-success-view')).toBeVisible();
    await expect(page.locator('.sdk-modal-success-view h3')).toContainText("You're on the list");

    expect(capturedBody).toMatchObject({
      email: 'e2e@test.com',
      full_name: 'E2E Tester',
      company: 'Test Co',
      source: 'sdk',
      device_target: 'jetson',
    });
  });

  test('shows friendly message on 409 already-on-waitlist', async ({ page }) => {
    await page.route('**/v1/waitlist', (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'already_on_waitlist', message: 'dup' } }),
      }),
    );

    await page.goto('/');
    await page.click('#sdk-waitlist-open');
    await page.fill('#sdk-waitlist-form input[name="full_name"]', 'Dup User');
    await page.fill('#sdk-waitlist-form input[name="email"]', 'dup@test.com');
    await page.selectOption('#sdk-waitlist-form select[name="device_target"]', 'macos');
    await page.click('#sdk-waitlist-form .sdk-modal-submit');

    const err = page.locator('.sdk-modal-error');
    await expect(err).toBeVisible();
    await expect(err).toContainText('already on the waitlist');
  });

  test('shows rate-limit message on 429', async ({ page }) => {
    await page.route('**/v1/waitlist', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'rate_limited', message: 'slow down' } }),
      }),
    );

    await page.goto('/');
    await page.click('#sdk-waitlist-open');
    await page.fill('#sdk-waitlist-form input[name="full_name"]', 'Rate User');
    await page.fill('#sdk-waitlist-form input[name="email"]', 'rate@test.com');
    await page.selectOption('#sdk-waitlist-form select[name="device_target"]', 'other');
    await page.click('#sdk-waitlist-form .sdk-modal-submit');

    const err = page.locator('.sdk-modal-error');
    await expect(err).toBeVisible();
    await expect(err).toContainText('Too many attempts');
  });
});
