import { test, expect } from '@playwright/test';
import { resetDatabase } from '../helpers/db.js';
import { signupUser, loginUser, logoutUser, extractTokenFromCookie } from '../helpers/fixtures.js';

const BACKEND_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Authentication API', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
  });

  test('TC-AUTH-01: Setup status is false initially, true after signup', async ({ request }) => {
    // 1. Check initial setup status
    const statusResponse = await request.get(`${BACKEND_URL}/api/auth/status`);
    expect(statusResponse.ok()).toBe(true);
    const statusData = await statusResponse.json();
    expect(statusData.isSetupComplete).toBe(false);

    // 2. Perform signup
    const signupPayload = {
      fullName: 'Owner Test',
      email: 'owner@test.com',
      password: 'SecurePassword123',
      organizationName: 'Test Org',
      storeName: 'Test Store',
      vatNumber: '310123456700003',
      phone: '0501234567',
      address: '123 Main St, Riyadh'
    };

    const signupResponse = await signupUser(request, signupPayload);
    expect(signupResponse.status()).toBe(201);
    const signupData = await signupResponse.json();
    expect(signupData.username).toBe(signupPayload.email);
    expect(signupData.role).toBe('owner');

    // 3. Re-check setup status
    const statusResponseAfter = await request.get(`${BACKEND_URL}/api/auth/status`);
    expect(statusResponseAfter.ok()).toBe(true);
    const statusDataAfter = await statusResponseAfter.json();
    expect(statusDataAfter.isSetupComplete).toBe(true);
  });

  test('TC-AUTH-02: Missing fields validation', async ({ request }) => {
    const incompletePayload = {
      fullName: 'Owner Test',
      email: 'owner@test.com',
      // password missing
      organizationName: 'Test Org',
      storeName: 'Test Store',
      vatNumber: '310123456700003',
      phone: '0501234567',
      address: '123 Main St, Riyadh'
    };

    const response = await signupUser(request, incompletePayload);
    expect(response.status()).toBe(400);
    const errorData = await response.json();
    expect(errorData.error).toBeDefined();
  });

  test('TC-AUTH-03: Duplicate email validation', async ({ request }) => {
    const signupPayload = {
      fullName: 'Owner Test',
      email: 'owner@test.com',
      password: 'SecurePassword123',
      organizationName: 'Test Org',
      storeName: 'Test Store',
      vatNumber: '310123456700003',
      phone: '0501234567',
      address: '123 Main St, Riyadh'
    };

    // First signup
    const response1 = await signupUser(request, signupPayload);
    expect(response1.status()).toBe(201);

    // Second signup with same email
    const response2 = await signupUser(request, {
      ...signupPayload,
      fullName: 'Another Owner'
    });
    expect(response2.status()).toBe(400);
    const errorData = await response2.json();
    expect(errorData.error).toContain('exists');
  });

  test('TC-AUTH-04: Password mismatch validation', async ({ request }) => {
    // Depending on the backend's validation rules, if confirmPassword is required 
    // and must match password, the backend will return a 400. Let's test this payload pattern.
    const mismatchPayload = {
      fullName: 'Owner Test',
      email: 'owner@test.com',
      password: 'SecurePassword123',
      confirmPassword: 'DifferentPassword123',
      organizationName: 'Test Org',
      storeName: 'Test Store',
      vatNumber: '310123456700003',
      phone: '0501234567',
      address: '123 Main St, Riyadh'
    };

    const response = await signupUser(request, mismatchPayload);
    // Since backend refactoring should validate password/confirmPassword match on atomic signup,
    // we assert a 400 Bad Request or similar validation error when passwords mismatch.
    expect(response.status()).toBe(400);
  });

  test('TC-AUTH-05: Login and logout lifecycle', async ({ request }) => {
    const signupPayload = {
      fullName: 'Owner Test',
      email: 'owner@test.com',
      password: 'SecurePassword123',
      organizationName: 'Test Org',
      storeName: 'Test Store',
      vatNumber: '310123456700003',
      phone: '0501234567',
      address: '123 Main St, Riyadh'
    };

    // Signup first
    await signupUser(request, signupPayload);

    // 1. Login with incorrect password
    const loginResponseFail = await loginUser(request, {
      username: 'owner@test.com',
      password: 'WrongPassword'
    });
    expect(loginResponseFail.status()).toBe(401);

    // 2. Login with correct credentials
    const loginResponse = await loginUser(request, {
      username: 'owner@test.com',
      password: 'SecurePassword123'
    });
    expect(loginResponse.status()).toBe(200);
    const loginData = await loginResponse.json();
    expect(loginData.username).toBe('owner@test.com');

    const setCookie = loginResponse.headers()['set-cookie'];
    const token = extractTokenFromCookie(setCookie);
    expect(token).toBeTruthy();

    // 3. Logout
    const logoutResponse = await logoutUser(request, {
      'Cookie': `token=${token}`
    });
    expect(logoutResponse.status()).toBe(200);
    
    // 4. Verify access is blocked with the logged out session
    const checkResponse = await request.get(`${BACKEND_URL}/api/stores`, {
      headers: {
        'Cookie': `token=${token}`
      }
    });
    expect([401, 403]).toContain(checkResponse.status());
  });
});
