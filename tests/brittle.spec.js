// @brittle: the same behaviours as the stable suite, written the way flaky tests
// usually are (fixed sleeps, CSS selectors, one-shot reads instead of web-first assertions).
// They exist so the study can compare the two styles on identical flows.
const { test, expect } = require('@playwright/test');

async function login(page) {
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.locator('#user-name').fill('standard_user');
  await page.locator('#password').fill('secret_sauce');
  await page.locator('#login-button').click();
  await page.waitForTimeout(500);
}

test.describe('@brittle Cart and checkout', () => {
  test('@brittle adding one item shows badge 1', async ({ page }) => {
    await login(page);
    await page.locator('.inventory_item:nth-child(1) button').click();
    await page.waitForTimeout(200);
    const badge = await page.locator('.shopping_cart_badge').textContent();
    expect(badge).toBe('1');
  });

  test('@brittle two items appear in the cart', async ({ page }) => {
    await login(page);
    await page.locator('.inventory_item:nth-child(1) button').click();
    await page.locator('.inventory_item:nth-child(2) button').click();
    await page.waitForTimeout(200);
    await page.locator('.shopping_cart_link').click();
    await page.waitForTimeout(300);
    const count = await page.locator('.cart_item').count();
    expect(count).toBe(2);
  });

  test('@brittle complete purchase shows confirmation', async ({ page }) => {
    await login(page);
    await page.locator('.inventory_item:nth-child(1) button').click();
    await page.locator('.shopping_cart_link').click();
    await page.waitForTimeout(300);
    await page.locator('#checkout').click();
    await page.locator('#first-name').fill('Test');
    await page.locator('#last-name').fill('User');
    await page.locator('#postal-code').fill('1200');
    await page.locator('#continue').click();
    await page.waitForTimeout(300);
    await page.locator('#finish').click();
    await page.waitForTimeout(300);
    const header = await page.locator('.complete-header').textContent();
    expect(header).toBe('Thank you for your order!');
  });
});
