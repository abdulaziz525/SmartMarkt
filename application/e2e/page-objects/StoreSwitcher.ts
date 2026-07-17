import { Page, Locator } from '@playwright/test';

export class StoreSwitcher {
  readonly page: Page;
  readonly switcherButton: Locator;
  readonly switcherMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.switcherButton = page.locator('[data-testid="store-switcher-button"]');
    this.switcherMenu = page.locator('[data-testid="store-switcher-menu"]');
  }

  async openSwitcher() {
    await this.switcherButton.click();
  }

  async listOptions(): Promise<string[]> {
    const isVisible = await this.switcherMenu.isVisible();
    if (!isVisible) {
      await this.openSwitcher();
    }
    return await this.page.locator('[data-testid^="store-option-"]').allTextContents();
  }

  async selectStore(storeId: string) {
    const isVisible = await this.switcherMenu.isVisible();
    if (!isVisible) {
      await this.openSwitcher();
    }
    await this.page.locator(`[data-testid="store-option-${storeId}"]`).click();
  }
}
