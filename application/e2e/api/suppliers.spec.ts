import { test, expect } from '@playwright/test';
import { resetDatabase } from '../helpers/db.js';
import { signupAndAuthenticate } from '../helpers/fixtures.js';

const BACKEND_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Suppliers and Purchase Orders API', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
  });

  test('TC-SUPPLIERS-01: Supplier CRUD, payment, and PO receipt lifecycle', async ({ request }) => {
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

    const session = await signupAndAuthenticate(request, signupPayload);

    // 1. Get seeded products to use in PO
    const productsResponse = await request.get(`${BACKEND_URL}/api/products`, {
      headers: session.headers
    });
    const products = await productsResponse.json();
    const milk = products.find((p: any) => p.barcode === '6281007011234');
    expect(milk).toBeDefined();
    expect(milk.quantity).toBe(45);

    // 2. Create a new supplier
    const newSupplier = {
      id: `s-${Date.now()}-custom`,
      name: 'Custom Supplier Ltd',
      phone: '0599999999',
      email: 'custom@supplier.com',
      vatNumber: '310999999900003',
      balance: 1000.00
    };

    const createSupplierResponse = await request.post(`${BACKEND_URL}/api/suppliers`, {
      headers: session.headers,
      data: { supplier: newSupplier }
    });
    expect(createSupplierResponse.status()).toBe(200);

    // Verify it exists
    const listSuppliersResponse1 = await request.get(`${BACKEND_URL}/api/suppliers`, {
      headers: session.headers
    });
    const suppliers1 = await listSuppliersResponse1.json();
    const createdSupplier = suppliers1.find((s: any) => s.id === newSupplier.id);
    expect(createdSupplier).toBeDefined();
    expect(Number(createdSupplier.balance)).toBe(1000.00);

    // 3. Settle supplier balance (Pay supplier)
    const payResponse = await request.post(`${BACKEND_URL}/api/suppliers/${newSupplier.id}/pay`, {
      headers: session.headers,
      data: { amount: 300.00 }
    });
    expect(payResponse.status()).toBe(200);

    // Verify balance is decremented to 700.00
    const listSuppliersResponse2 = await request.get(`${BACKEND_URL}/api/suppliers`, {
      headers: session.headers
    });
    const suppliers2 = await listSuppliersResponse2.json();
    const paidSupplier = suppliers2.find((s: any) => s.id === newSupplier.id);
    expect(Number(paidSupplier.balance)).toBe(700.00);

    // 4. Draft a Purchase Order for this supplier
    const poTotal = 150.00;
    const poQuantity = 10;
    const newPO = {
      id: `po-${Date.now()}-custom`,
      poNumber: 'PO-2026-0001',
      date: new Date().toISOString().split('T')[0],
      supplierId: newSupplier.id,
      supplierName: newSupplier.name,
      total: poTotal,
      status: 'pending',
      items: [
        {
          productId: milk.id,
          productNameAr: milk.nameAr,
          productNameEn: milk.nameEn,
          costPrice: milk.costPrice,
          quantity: poQuantity,
          total: poTotal
        }
      ]
    };

    const createPOResponse = await request.post(`${BACKEND_URL}/api/purchase-orders`, {
      headers: session.headers,
      data: { po: newPO }
    });
    expect(createPOResponse.status()).toBe(200);

    // Verify PO status is pending
    const listPOResponse = await request.get(`${BACKEND_URL}/api/purchase-orders`, {
      headers: session.headers
    });
    const pos = await listPOResponse.json();
    const createdPO = pos.find((p: any) => p.id === newPO.id);
    expect(createdPO).toBeDefined();
    expect(createdPO.status).toBe('pending');

    // 5. Receive the PO (Increments stock & increments supplier balance)
    const receiveResponse = await request.post(`${BACKEND_URL}/api/purchase-orders/${newPO.id}/receive`, {
      headers: session.headers,
      data: {}
    });
    expect(receiveResponse.status()).toBe(200);

    // Verify PO status is now received
    const listPOResponse2 = await request.get(`${BACKEND_URL}/api/purchase-orders`, {
      headers: session.headers
    });
    const pos2 = await listPOResponse2.json();
    const receivedPO = pos2.find((p: any) => p.id === newPO.id);
    expect(receivedPO.status).toBe('received');

    // Verify product stock increased: 45 + 10 = 55
    const productsResponse2 = await request.get(`${BACKEND_URL}/api/products`, {
      headers: session.headers
    });
    const products2 = await productsResponse2.json();
    const milkAfter = products2.find((p: any) => p.id === milk.id);
    expect(milkAfter.quantity).toBe(55);

    // Verify supplier balance increased by PO total: 700.00 + 150.00 = 850.00
    const listSuppliersResponse3 = await request.get(`${BACKEND_URL}/api/suppliers`, {
      headers: session.headers
    });
    const suppliers3 = await listSuppliersResponse3.json();
    const finalSupplier = suppliers3.find((s: any) => s.id === newSupplier.id);
    expect(Number(finalSupplier.balance)).toBe(850.00);
  });
});
