import { test, expect } from '@playwright/test';
import { resetDatabase } from '../helpers/db.js';
import { signupAndAuthenticate } from '../helpers/fixtures.js';

const BACKEND_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Multi-Tenant Data Isolation API', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
  });

  test('TC-ISO-01: Owner A cannot access Store B resources', async ({ request }) => {
    // 1. Sign up Owner A (Organization A, Store A)
    const ownerAPayload = {
      fullName: 'Owner A',
      email: 'ownerA@orgA.com',
      password: 'SecurePasswordA123',
      organizationName: 'Org A',
      storeName: 'Store A',
      vatNumber: '310123456700001',
      phone: '0500000001',
      address: 'Store A Address'
    };
    const sessionA = await signupAndAuthenticate(request, ownerAPayload);

    // 2. Sign up Owner B (Organization B, Store B)
    const ownerBPayload = {
      fullName: 'Owner B',
      email: 'ownerB@orgB.com',
      password: 'SecurePasswordB123',
      organizationName: 'Org B',
      storeName: 'Store B',
      vatNumber: '310123456700002',
      phone: '0500000002',
      address: 'Store B Address'
    };
    const sessionB = await signupAndAuthenticate(request, ownerBPayload);

    // Verify that both owners got unique organization and store IDs
    expect(sessionA.organizationId).not.toBe(sessionB.organizationId);
    expect(sessionA.storeId).not.toBe(sessionB.storeId);

    // 3. Attempt to access Store B's resources using Owner A's session token and x-store-id set to Store B.
    // The request headers will combine Owner A's Cookie and Owner B's store ID.
    const crossTenantHeaders = {
      'Cookie': `token=${sessionA.token}`,
      'x-store-id': sessionB.storeId
    };

    // Test products endpoint
    const productsRes = await request.get(`${BACKEND_URL}/api/products`, {
      headers: crossTenantHeaders
    });
    expect(productsRes.status()).toBe(403);
    const productsErr = await productsRes.json();
    expect(productsErr.error).toContain('Forbidden');

    // Test invoices endpoint
    const invoicesRes = await request.get(`${BACKEND_URL}/api/invoices`, {
      headers: crossTenantHeaders
    });
    expect(invoicesRes.status()).toBe(403);
    const invoicesErr = await invoicesRes.json();
    expect(invoicesErr.error).toContain('Forbidden');

    // Test suppliers endpoint
    const suppliersRes = await request.get(`${BACKEND_URL}/api/suppliers`, {
      headers: crossTenantHeaders
    });
    expect(suppliersRes.status()).toBe(403);
    const suppliersErr = await suppliersRes.json();
    expect(suppliersErr.error).toContain('Forbidden');

    // Test purchase orders endpoint
    const poRes = await request.get(`${BACKEND_URL}/api/purchase-orders`, {
      headers: crossTenantHeaders
    });
    expect(poRes.status()).toBe(403);
    const poErr = await poRes.json();
    expect(poErr.error).toContain('Forbidden');

    // Test audit logs endpoint
    const auditLogsRes = await request.get(`${BACKEND_URL}/api/audit-logs`, {
      headers: crossTenantHeaders
    });
    expect(auditLogsRes.status()).toBe(403);
    const auditLogsErr = await auditLogsRes.json();
    expect(auditLogsErr.error).toContain('Forbidden');
  });
});
