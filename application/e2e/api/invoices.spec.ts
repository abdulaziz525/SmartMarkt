import { test, expect } from '@playwright/test';
import { resetDatabase } from '../helpers/db.js';
import { signupAndAuthenticate } from '../helpers/fixtures.js';

const BACKEND_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Invoices (POS Checkout) API', () => {
  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
  });

  test('TC-INVOICES-01: POS checkout, stock decrement, audit logs, and ZATCA QR generation', async ({ request }) => {
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

    // 1. Get seeded products to obtain valid product IDs
    const productsResponse = await request.get(`${BACKEND_URL}/api/products`, {
      headers: session.headers
    });
    expect(productsResponse.status()).toBe(200);
    const products = await productsResponse.json();

    // Find the fresh milk product: Almarai Fresh Milk 1L (has stock 45, lowStockThreshold 15)
    const milk = products.find((p: any) => p.barcode === '6281007011234');
    expect(milk).toBeDefined();
    expect(milk.quantity).toBe(45);

    // 2. Perform POS Checkout with quantity that triggers low stock warning
    // We buy 35 milk bottles, so remaining stock will be 10 <= 15
    const checkoutQuantity = 35;
    const basePrice = milk.sellingPrice;
    const subtotal = checkoutQuantity * basePrice;
    const vatAmount = subtotal * 0.15;
    const total = subtotal + vatAmount;

    const checkoutPayload = {
      items: [
        {
          product: {
            id: milk.id,
            barcode: milk.barcode,
            nameAr: milk.nameAr,
            nameEn: milk.nameEn,
            sellingPrice: milk.sellingPrice
          },
          quantity: checkoutQuantity,
          discount: 0,
          customPrice: basePrice
        }
      ],
      paymentMethod: 'cash',
      paymentDetails: {
        cashAmount: total,
        cardAmount: 0
      }
    };

    const checkoutResponse = await request.post(`${BACKEND_URL}/api/invoices`, {
      headers: session.headers,
      data: checkoutPayload
    });

    expect(checkoutResponse.status()).toBe(200);
    const invoice = await checkoutResponse.json();
    expect(invoice.invoiceNumber).toBeDefined();
    expect(invoice.zatcaQrCode).toBeDefined();
    expect(invoice.zatcaQrCode.length).toBeGreaterThan(0);
    expect(Number(invoice.total)).toBeCloseTo(total, 2);

    // 3. Verify stock decrement
    const productsResponseAfter = await request.get(`${BACKEND_URL}/api/products`, {
      headers: session.headers
    });
    const productsAfter = await productsResponseAfter.json();
    const milkAfter = productsAfter.find((p: any) => p.id === milk.id);
    expect(milkAfter.quantity).toBe(10); // 45 - 35 = 10

    // 4. Verify audit logs: should contain SALES_CHECKOUT and STOCK_ALERT
    const auditLogsResponse = await request.get(`${BACKEND_URL}/api/audit-logs`, {
      headers: session.headers
    });
    expect(auditLogsResponse.status()).toBe(200);
    const logs = await auditLogsResponse.json();

    const checkoutLog = logs.find((l: any) => l.action === 'SALES_CHECKOUT');
    expect(checkoutLog).toBeDefined();
    expect(checkoutLog.details).toContain(invoice.invoiceNumber);

    const stockAlertLog = logs.find((l: any) => l.action === 'STOCK_ALERT');
    expect(stockAlertLog).toBeDefined();
    expect(stockAlertLog.details).toContain('Low stock warning');
  });
});
