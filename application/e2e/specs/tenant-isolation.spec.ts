import { test, expect } from '@playwright/test';
import { resetDatabase } from '../helpers/db.js';
import { signupAndAuthenticate } from '../helpers/fixtures.js';
import { LoginPage } from '../page-objects/LoginPage.js';
import { DashboardPage } from '../page-objects/DashboardPage.js';

test.describe('Tenant Data Isolation UI Spec', () => {
  let ownerAPayload: any;
  let ownerBPayload: any;

  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);

    // Register Owner A
    ownerAPayload = {
      fullName: 'Owner A',
      email: 'ownerA@orgA.com',
      password: 'SecurePasswordA123',
      organizationName: 'Org A',
      storeName: 'Store A',
      vatNumber: '310123456700001',
      phone: '0500000001',
      address: 'Store A Address'
    };
    await signupAndAuthenticate(request, ownerAPayload);

    // Register Owner B
    ownerBPayload = {
      fullName: 'Owner B',
      email: 'ownerB@orgB.com',
      password: 'SecurePasswordB123',
      organizationName: 'Org B',
      storeName: 'Store B',
      vatNumber: '310123456700002',
      phone: '0500000002',
      address: 'Store B Address'
    };
    await signupAndAuthenticate(request, ownerBPayload);
  });

  test('UI Data Isolation between Tenants', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // 1. Log in as Owner A
    await loginPage.goto();
    await loginPage.login(ownerAPayload.email, ownerAPayload.password);
    await expect(dashboardPage.dashboardTab).toBeVisible();

    // Go to Inventory and add Owner A's product
    await dashboardPage.switchTab('inventory');
    await page.locator('[data-testid="new-product-button"]').click();

    await page.locator('[data-testid="product-barcode"]').fill('6289999999999');
    await page.locator('[data-testid="product-category"]').fill('Drinks');
    await page.locator('[data-testid="product-name-ar"]').fill('عصير تفاح معزول');
    await page.locator('[data-testid="product-name-en"]').fill('Isolated Apple Juice');
    await page.locator('[data-testid="product-cost-price"]').fill('2.50');
    await page.locator('[data-testid="product-selling-price"]').fill('4.00');
    await page.locator('[data-testid="product-quantity"]').fill('50');
    await page.locator('[data-testid="product-unit"]').fill('pcs');
    await page.locator('[data-testid="product-threshold"]').fill('5');

    await page.locator('[data-testid="product-save-button"]').click();

    // Verify Owner A's product is visible in their inventory
    await expect(page.locator('[data-testid="product-row-6289999999999"]')).toBeVisible();

    // 2. Log out
    await page.locator('[data-testid="logout-button"]').click();
    await expect(loginPage.usernameInput).toBeVisible(); // Redirect to login

    // 3. Log in as Owner B
    await loginPage.login(ownerBPayload.email, ownerBPayload.password);
    await expect(dashboardPage.dashboardTab).toBeVisible();

    // Go to Inventory tab and check isolation
    await dashboardPage.switchTab('inventory');

    // Assert Owner A's product is not visible
    await expect(page.locator('[data-testid="product-row-6289999999999"]')).not.toBeVisible();
  });
});
