const base = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');
const { InventoryPage } = require('./pages/InventoryPage');
const { CartPage } = require('./pages/CartPage');
const { CheckoutPage } = require('./pages/CheckoutPage');
const users = require('./data/users');
const { applyThrottling } = require('./throttle');

exports.test = base.test.extend({
  // Runs automatically before every test; does nothing unless THROTTLE_* env vars are set.
  throttling: [async ({ page }, use) => {
    await applyThrottling(page);
    await use();
  }, { auto: true }],

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),

  // Request `loggedIn` in a test to start from the inventory page.
  loggedIn: async ({ loginPage }, use) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await use();
  },
});

exports.expect = base.expect;
