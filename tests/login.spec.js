const { test, expect } = require('../fixtures');
const users = require('../data/users');

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('valid user reaches the products page', async ({ loginPage, inventoryPage }) => {
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('locked-out user sees an error', async ({ loginPage }) => {
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    await expect(loginPage.error).toContainText('locked out');
  });

  test('wrong password sees an error', async ({ loginPage }) => {
    await loginPage.login(users.standard.username, 'wrong_password');
    await expect(loginPage.error).toContainText('do not match');
  });

  test('empty username sees an error', async ({ loginPage }) => {
    await loginPage.login('', users.standard.password);
    await expect(loginPage.error).toContainText('Username is required');
  });
});
