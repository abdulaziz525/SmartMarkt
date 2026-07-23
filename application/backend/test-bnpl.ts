import fetch from 'node-fetch';
import { db } from './src/config/db.js';
import crypto from 'crypto';

const API_BASE = 'http://localhost:3001/api/storefront';

async function runTests() {
  console.log('--- Starting BNPL Integration Tests ---');
  
  // 1. Setup Data
  const storeId = 'store-' + Date.now();
  const productId = 'prod-' + Date.now();
  const orgId = 'org-' + Date.now();
  
  await db('organizations').insert({ id: orgId, name: 'Test Org' });
  await db('stores').insert({ 
    id: storeId, nameAr: 'Store', nameEn: 'Store', vatNumber: '123', 
    phone: '123', address: '123', organization_id: orgId 
  });
  await db('products').insert({
    id: productId, barcode: '12345', nameAr: 'Prod', nameEn: 'Prod',
    category: 'cat', costPrice: 10, sellingPrice: 20, quantity: 100,
    unit: 'pcs', store_id: storeId
  });

  const email = `test-${Date.now()}@test.com`;

  // 2. Register User
  console.log('Registering user...');
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', phone: '123', email, password: 'password' })
  });
  const regData = await regRes.json();
  const customerId = regData.customerId;
  console.log('Registered User:', customerId);

  // Scenario A: First BNPL Order
  console.log('\n--- Scenario A: First BNPL Order ---');
  const checkout1Res = await fetch(`${API_BASE}/${storeId}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId,
      paymentMethod: 'installments',
      fulfillmentMode: 'pickup',
      items: [{ productId, quantity: 1, price: 20 }]
    })
  });
  const checkout1Data = await checkout1Res.json();
  if (checkout1Data.success) {
    console.log('✅ Scenario A SUCCESS: First BNPL order approved.');
  } else {
    console.log('❌ Scenario A FAILED:', checkout1Data);
  }

  // Get the first installment ID
  const firstInstallment = await db('installments')
    .join('installment_plans', 'installments.plan_id', '=', 'installment_plans.id')
    .where('installment_plans.customer_id', customerId)
    .andWhere('installments.installment_number', 1)
    .first();
  console.log('Created First Installment ID:', firstInstallment.id);

  // Scenario B: Second BNPL Order (Should Reject)
  console.log('\n--- Scenario B: Second BNPL Order (Unpaid Installment 1) ---');
  const checkout2Res = await fetch(`${API_BASE}/${storeId}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId,
      paymentMethod: 'installments',
      fulfillmentMode: 'pickup',
      items: [{ productId, quantity: 1, price: 20 }]
    })
  });
  const checkout2Data = await checkout2Res.json();
  if (checkout2Res.status === 403 && checkout2Data.error.includes('Credit Denied')) {
    console.log('✅ Scenario B SUCCESS: Second BNPL order correctly REJECTED.');
  } else {
    console.log('❌ Scenario B FAILED:', checkout2Data);
  }

  // Pay Installment 1
  console.log('\n--- Paying First Installment ---');
  const payRes = await fetch(`${API_BASE}/installments/${firstInstallment.id}/pay`, {
    method: 'POST'
  });
  const payData = await payRes.json();
  console.log('Payment Response:', payData);

  // Scenario C: Second BNPL Order (After Payment)
  console.log('\n--- Scenario C: Second BNPL Order (Paid Installment 1) ---');
  const checkout3Res = await fetch(`${API_BASE}/${storeId}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId,
      paymentMethod: 'installments',
      fulfillmentMode: 'pickup',
      items: [{ productId, quantity: 1, price: 20 }]
    })
  });
  const checkout3Data = await checkout3Res.json();
  if (checkout3Data.success) {
    console.log('✅ Scenario C SUCCESS: Second BNPL order approved after paying installment 1.');
  } else {
    console.log('❌ Scenario C FAILED:', checkout3Data);
  }

  console.log('\n--- Integration Tests Complete ---');
  process.exit(0);
}

runTests().catch(console.error);
