# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/store-switching.spec.ts >> Store Switching Flow >> TC-F3-03: Dynamic data fetching upon branch/store toggle
- Location: e2e/specs/store-switching.spec.ts:75:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { resetDatabase } from '../helpers/db.js';
  3   | import { signupAndAuthenticate } from '../helpers/fixtures.js';
  4   | import { StoreSwitcher } from '../page-objects/StoreSwitcher.js';
  5   | import { DashboardPage } from '../page-objects/DashboardPage.js';
  6   | 
  7   | const BACKEND_URL = process.env.API_URL || 'http://localhost:3001';
  8   | 
  9   | test.describe('Store Switching Flow', () => {
  10  |   let session: any;
  11  | 
  12  |   test.beforeEach(async ({ request, context }) => {
  13  |     await resetDatabase(request);
  14  | 
  15  |     // 1. Sign up Owner (creates First Store "Ahmadi Supermarket")
  16  |     const signupPayload = {
  17  |       fullName: 'Owner Ahmadi',
  18  |       email: 'owner@ahmadi.com',
  19  |       password: 'SecurePassword123',
  20  |       organizationName: 'Ahmadi Group',
  21  |       storeName: 'Ahmadi Supermarket',
  22  |       vatNumber: '300012345600003',
  23  |       phone: '0501234567',
  24  |       address: 'Riyadh, KSA'
  25  |     };
  26  |     session = await signupAndAuthenticate(request, signupPayload);
  27  | 
  28  |     // 2. Add second branch "North Branch" via API
  29  |     const response = await request.post(`${BACKEND_URL}/api/branches`, {
  30  |       headers: {
  31  |         'Cookie': `token=${session.token}`
  32  |       },
  33  |       data: {
  34  |         branch: {
  35  |           id: 'store-secondary-id',
  36  |           nameAr: 'North Branch',
  37  |           nameEn: 'North Branch',
  38  |           location: 'Riyadh North',
  39  |           status: 'active'
  40  |         }
  41  |       }
  42  |     });
> 43  |     expect(response.ok()).toBe(true);
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
  44  | 
  45  |     // 3. Inject cookie to browser context
  46  |     await context.addCookies([
  47  |       {
  48  |         name: 'token',
  49  |         value: session.token,
  50  |         domain: 'localhost',
  51  |         path: '/'
  52  |       }
  53  |     ]);
  54  |   });
  55  | 
  56  |   test('TC-F3-01: Correct dropdown list items', async ({ page }) => {
  57  |     const switcher = new StoreSwitcher(page);
  58  |     await page.goto('/');
  59  | 
  60  |     const options = await switcher.listOptions();
  61  |     expect(options.length).toBe(2);
  62  |     expect(options.some(opt => opt.includes('Ahmadi Supermarket'))).toBe(true);
  63  |     expect(options.some(opt => opt.includes('North Branch'))).toBe(true);
  64  |   });
  65  | 
  66  |   test('TC-F3-02: Header branding update upon store selection', async ({ page }) => {
  67  |     const switcher = new StoreSwitcher(page);
  68  |     const dashboard = new DashboardPage(page);
  69  |     await page.goto('/');
  70  | 
  71  |     await switcher.selectStore('store-secondary-id');
  72  |     await expect(dashboard.activeStoreName).toContainText('North Branch');
  73  |   });
  74  | 
  75  |   test('TC-F3-03: Dynamic data fetching upon branch/store toggle', async ({ page }) => {
  76  |     const switcher = new StoreSwitcher(page);
  77  |     const dashboard = new DashboardPage(page);
  78  |     await page.goto('/');
  79  | 
  80  |     // Initially in Ahmadi Supermarket, should see products in POS catalog
  81  |     await dashboard.switchTab('pos');
  82  |     await expect(page.locator('[data-testid^="pos-product-item-"]')).toHaveCount(3); // seeded Milk, Cheese, Pepsi
  83  | 
  84  |     // Switch to North Branch
  85  |     await switcher.selectStore('store-secondary-id');
  86  | 
  87  |     // POS catalog should now be empty (0 items) since North Branch has no products
  88  |     await expect(page.locator('[data-testid^="pos-product-item-"]')).toHaveCount(0);
  89  |   });
  90  | 
  91  |   test('TC-F3-04: Page refresh context persistence', async ({ page }) => {
  92  |     const switcher = new StoreSwitcher(page);
  93  |     const dashboard = new DashboardPage(page);
  94  |     await page.goto('/');
  95  | 
  96  |     // Switch to North Branch
  97  |     await switcher.selectStore('store-secondary-id');
  98  |     await expect(dashboard.activeStoreName).toContainText('North Branch');
  99  | 
  100 |     // Reload page
  101 |     await page.reload();
  102 | 
  103 |     // Context should persist
  104 |     await expect(dashboard.activeStoreName).toContainText('North Branch');
  105 |   });
  106 | 
  107 |   test('TC-F3-09: Cart clearing on store switch', async ({ page }) => {
  108 |     const switcher = new StoreSwitcher(page);
  109 |     const dashboard = new DashboardPage(page);
  110 |     await page.goto('/');
  111 | 
  112 |     await dashboard.switchTab('pos');
  113 |     
  114 |     // Add Milk to cart (using seeded barcode for Milk: '6281007011234')
  115 |     await page.locator('[data-testid="pos-product-item-6281007011234"]').click();
  116 |     await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  117 | 
  118 |     // Switch to North Branch
  119 |     await switcher.selectStore('store-secondary-id');
  120 | 
  121 |     // Cart should be cleared
  122 |     await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
  123 |   });
  124 | });
  125 | 
```