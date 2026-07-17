import { test, expect } from '@playwright/test';
import { resetDatabase } from '../helpers/db.js';
import { signupAndAuthenticate } from '../helpers/fixtures.js';

const BACKEND_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Stores API', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
  });

  test('TC-STORES-01: List stores returns stores for the user\'s organization', async ({ request }) => {
    const signupPayload = {
      fullName: 'Owner Test',
      email: 'owner@test.com',
      password: 'SecurePassword123',
      organizationName: 'Test Org',
      storeName: 'Test Store Alpha',
      vatNumber: '310123456700003',
      phone: '0501234567',
      address: '123 Main St, Riyadh'
    };

    const session = await signupAndAuthenticate(request, signupPayload);

    // Call GET /api/stores
    const response = await request.get(`${BACKEND_URL}/api/stores`, {
      headers: {
        'Cookie': `token=${session.token}`
      }
    });

    expect(response.status()).toBe(200);
    const stores = await response.json();
    expect(Array.isArray(stores)).toBe(true);
    expect(stores.length).toBeGreaterThan(0);

    const store = stores.find((s: any) => s.id === session.storeId);
    expect(store).toBeDefined();
    expect(store.organization_id).toBe(session.organizationId);
    expect(store.nameAr).toBe(signupPayload.storeName);
    expect(store.vatNumber).toBe(signupPayload.vatNumber);
    expect(store.phone).toBe(signupPayload.phone);
    expect(store.address).toBe(signupPayload.address);
  });
});
