class CartPage {
  constructor(page) {
    this.page = page;
    this.items = page.getByTestId('inventory-item');
    this.checkoutButton = page.getByTestId('checkout');
  }

  async remove(slug) {
    await this.page.getByTestId(`remove-${slug}`).click();
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}

module.exports = { CartPage };
