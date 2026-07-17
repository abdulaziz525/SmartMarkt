import { test, expect } from '@playwright/test';
import { resetDatabase } from '../helpers/db.js';
import { signupAndAuthenticate } from '../helpers/fixtures.js';
import { StoreSwitcher } from '../page-objects/StoreSwitcher.js';
import { DashboardPage } from '../page-objects/DashboardPage.js';

const BACKEND_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Store Switching Flow', () => {
  let session: any;

  test.beforeEach(async ({ request, context }) => {
    await resetDatabase(request);

    // 1. Sign up Owner (creates First Store "Ahmadi Supermarket")
    const signupPayload = {
      fullName: 'Owner Ahmadi',
      email: 'owner@ahmadi.com',
      password: 'SecurePassword123',
      organizationName: 'Ahmadi Group',
      storeName: 'Ahmadi Supermarket',
      vatNumber: '300012345600003',
      phone: '0501234567',
      address: 'Riyadh, KSA'
    };
    session = await signupAndAuthenticate(request, signupPayload);

    // 2. Add second branch "North Branch" via API
    const response = await request.post(`${BACKEND_URL}/api/branches`, {
      headers: {
        'Cookie': `token=${session.token}`
      },
      data: {
        branch: {
          id: 'store-secondary-id',
          nameAr: 'North Branch',
          nameEn: 'North Branch',
          location: 'Riyadh North',
          status: 'active'
        }
      }
    });
    expect(response.ok()).toBe(true);

    // 3. Inject cookie to browser context
    await context.addCookies([
      {
        name: 'token',
        value: session.token,
        domain: 'localhost',
        path: '/'
      }
    ]);
  });

  test('TC-F3-01: Correct dropdown list items', async ({ page }) => {
    const switcher = new StoreSwitcher(page);
    await page.goto('/');

    const options = await switcher.listOptions();
    expect(options.length).toBe(2);
    expect(options.some(opt => opt.includes('Ahmadi Supermarket'))).toBe(true);
    expect(options.some(opt => opt.includes('North Branch'))).toBe(true);
  });

  test('TC-F3-02: Header branding update upon store selection', async ({ page }) => {
    const switcher = new StoreSwitcher(page);
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    await switcher.selectStore('store-secondary-id');
    await expect(dashboard.activeStoreName).toContainText('North Branch');
  });

  test('TC-F3-03: Dynamic data fetching upon branch/store toggle', async ({ page }) => {
    const switcher = new StoreSwitcher(page);
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    // Initially in Ahmadi Supermarket, should see products in POS catalog
    await dashboard.switchTab('pos');
    await expect(page.locator('[data-testid^="pos-product-item-"]')).toHaveCount(3); // seeded Milk, Cheese, Pepsi

    // Switch to North Branch
    await switcher.selectStore('store-secondary-id');

    // POS catalog should now be empty (0 items) since North Branch has no products
    await expect(page.locator('[data-testid^="pos-product-item-"]')).toHaveCount(0);
  });

  test('TC-F3-04: Page refresh context persistence', async ({ page }) => {
    const switcher = new StoreSwitcher(page);
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    // Switch to North Branch
    await switcher.selectStore('store-secondary-id');
    await expect(dashboard.activeStoreName).toContainText('North Branch');

    // Reload page
    await page.reload();

    // Context should persist
    await expect(dashboard.activeStoreName).toContainText('North Branch');
  });

  test('TC-F3-09: Cart clearing on store switch', async ({ page }) => {
    const switcher = new StoreSwitcher(page);
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    await dashboard.switchTab('pos');
    
    // Add Milk to cart (using seeded barcode for Milk: '6281007011234')
    await page.locator('[data-testid="pos-product-item-6281007011234"]').click();
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);

    // Switch to North Branch
    await switcher.selectStore('store-secondary-id');

    // Cart should be cleared
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
  });
});
