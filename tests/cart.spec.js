const { test, expect } = require('../fixtures');

test.describe('Cart', () => {
  test('adding one item shows badge 1', async ({ loggedIn, inventoryPage }) => {
    await inventoryPage.addToCart('sauce-labs-backpack');
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('two items appear in the cart', async ({ loggedIn, inventoryPage, cartPage }) => {
    await inventoryPage.addToCart('sauce-labs-backpack');
    await inventoryPage.addToCart('sauce-labs-bike-light');
    await expect(inventoryPage.cartBadge).toHaveText('2');
    await inventoryPage.openCart();
    await expect(cartPage.items).toHaveCount(2);
  });

  test('removing an item updates the cart', async ({ loggedIn, inventoryPage, cartPage }) => {
    await inventoryPage.addToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.remove('sauce-labs-backpack');
    await expect(cartPage.items).toHaveCount(0);
  });
});
