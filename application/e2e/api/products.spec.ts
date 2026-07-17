import { test, expect } from '@playwright/test';
import { resetDatabase } from '../helpers/db.js';
import { signupAndAuthenticate } from '../helpers/fixtures.js';

const BACKEND_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Products API', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
  });

  test('TC-PRODUCTS-01: Product CRUD operations', async ({ request }) => {
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

    // 1. Get initial products (should contain seeded products)
    const listResponse = await request.get(`${BACKEND_URL}/api/products`, {
      headers: session.headers
    });
    expect(listResponse.status()).toBe(200);
    const initialProducts = await listResponse.json();
    expect(Array.isArray(initialProducts)).toBe(true);
    expect(initialProducts.length).toBe(3); //Milk, Cheese, Pepsi seeded in performSignup

    // 2. Create a new product manual
    const newProduct = {
      id: `p-${Date.now()}-new`,
      barcode: '6281234567890',
      nameAr: 'شوكولاتة جالاكسي',
      nameEn: 'Galaxy Chocolate',
      category: 'حلويات (Sweets)',
      costPrice: 3.00,
      sellingPrice: 5.00,
      quantity: 100,
      unit: 'pcs',
      lowStockThreshold: 10,
      expiryDate: '2026-12-31',
      isPerishable: true
    };

    const createResponse = await request.post(`${BACKEND_URL}/api/products`, {
      headers: session.headers,
      data: { product: newProduct }
    });
    expect(createResponse.status()).toBe(200);

    // 3. Verify product is created
    const listResponse2 = await request.get(`${BACKEND_URL}/api/products`, {
      headers: session.headers
    });
    const products2 = await listResponse2.json();
    const createdProduct = products2.find((p: any) => p.id === newProduct.id);
    expect(createdProduct).toBeDefined();
    expect(createdProduct.barcode).toBe(newProduct.barcode);
    expect(createdProduct.sellingPrice).toBe(newProduct.sellingPrice);

    // 4. Edit product details
    const updatedProduct = {
      ...newProduct,
      sellingPrice: 6.00,
      quantity: 120
    };

    const editResponse = await request.post(`${BACKEND_URL}/api/products`, {
      headers: session.headers,
      data: { product: updatedProduct }
    });
    expect(editResponse.status()).toBe(200);

    // Verify edit persists
    const listResponse3 = await request.get(`${BACKEND_URL}/api/products`, {
      headers: session.headers
    });
    const products3 = await listResponse3.json();
    const edited = products3.find((p: any) => p.id === newProduct.id);
    expect(edited.sellingPrice).toBe(6.00);
    expect(edited.quantity).toBe(120);

    // 5. Delete product
    const deleteResponse = await request.delete(`${BACKEND_URL}/api/products/${newProduct.id}`, {
      headers: session.headers
    });
    expect(deleteResponse.status()).toBe(200);

    // Verify it is removed
    const listResponse4 = await request.get(`${BACKEND_URL}/api/products`, {
      headers: session.headers
    });
    const products4 = await listResponse4.json();
    const deleted = products4.find((p: any) => p.id === newProduct.id);
    expect(deleted).toBeUndefined();
  });

  test('TC-PRODUCTS-02: Bulk CSV import', async ({ request }) => {
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

    const importData = {
      productsList: [
        {
          id: `p-${Date.now()}-imp1`,
          barcode: '9991234560001',
          nameAr: 'مياه صفا 330 مل',
          nameEn: 'Safa Water 330ml',
          category: 'مشروبات (Beverages)',
          costPrice: 0.50,
          sellingPrice: 1.00,
          quantity: 200,
          unit: 'pcs',
          lowStockThreshold: 20,
          expiryDate: null,
          isPerishable: false
        },
        {
          id: `p-${Date.now()}-imp2`,
          barcode: '9991234560002',
          nameAr: 'عصير برتقال المراعي',
          nameEn: 'Almarai Orange Juice',
          category: 'مشروبات (Beverages)',
          costPrice: 1.50,
          sellingPrice: 2.25,
          quantity: 60,
          unit: 'pcs',
          lowStockThreshold: 10,
          expiryDate: '2026-08-01',
          isPerishable: true
        }
      ]
    };

    const importResponse = await request.post(`${BACKEND_URL}/api/products/import-csv`, {
      headers: session.headers,
      data: importData
    });
    expect(importResponse.status()).toBe(200);
    const importResult = await importResponse.json();
    expect(importResult.successCount).toBe(2);

    // Verify imported products are searchable and correct
    const listResponse = await request.get(`${BACKEND_URL}/api/products`, {
      headers: session.headers
    });
    const products = await listResponse.json();
    const imp1 = products.find((p: any) => p.barcode === '9991234560001');
    const imp2 = products.find((p: any) => p.barcode === '9991234560002');
    
    expect(imp1).toBeDefined();
    expect(imp1.sellingPrice).toBe(1.00);
    expect(imp2).toBeDefined();
    expect(imp2.quantity).toBe(60);
  });
});
