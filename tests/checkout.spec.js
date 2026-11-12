const { test, expect } = require('../fixtures');

test.describe('Checkout', () => {
  test('complete purchase shows confirmation', async ({
    loggedIn, inventoryPage, cartPage, checkoutPage,
  }) => {
    await inventoryPage.addToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.checkout();
    await checkoutPage.fillInfo('Test', 'User', '1200');
    await checkoutPage.finish();
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
  });

  test('missing postal code shows an error', async ({
    loggedIn, inventoryPage, cartPage, checkoutPage,
  }) => {
    await inventoryPage.addToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.checkout();
    await checkoutPage.fillInfo('Test', 'User', '');
    await expect(checkoutPage.error).toContainText('Postal Code is required');
  });
});
