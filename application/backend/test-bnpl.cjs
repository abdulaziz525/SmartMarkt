const crypto = require('crypto');

const API_BASE = 'http://localhost:3001/api/storefront';

async function runTests() {
  console.log('--- Starting BNPL Integration Tests ---');

  const storeId = 'store-test-123';
  const productId = 'prod-test-123';

  // We assume DB is set up, or we can just call API directly if we registered the store already, 
  // but let's test using the API only.
  // Wait, we need a valid storeId. I'll just use a random storeId, the API doesn't check if the store exists for products, it just returns empty if no products. 
  // Wait, checkout checks if the product exists in DB and has quantity. So I need to use an existing store and product. Let's do a raw sqlite insertion first.

  const sqlite3 = require('sqlite3');
  const db = new sqlite3.Database('./database.sqlite');
  
  await new Promise((res) => {
    db.run("INSERT OR IGNORE INTO organizations (id, name) VALUES ('org1', 'Test Org')", res);
  });
  await new Promise((res) => {
    db.run("INSERT OR IGNORE INTO stores (id, nameAr, nameEn, vatNumber, phone, address, organization_id) VALUES ('store1', 's', 's', 'v', 'p', 'a', 'org1')", res);
  });
  await new Promise((res) => {
    db.run("INSERT OR IGNORE INTO products (id, barcode, nameAr, nameEn, category, costPrice, sellingPrice, quantity, unit, store_id) VALUES ('prod1', '123', 'p', 'p', 'c', 10, 20, 100, 'pcs', 'store1')", res);
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
  const checkout1Res = await fetch(`${API_BASE}/store1/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId,
      paymentMethod: 'installments',
      fulfillmentMode: 'pickup',
      items: [{ productId: 'prod1', quantity: 1, price: 20 }]
    })
  });
  const checkout1Data = await checkout1Res.json();
  if (checkout1Data.success) {
    console.log('✅ Scenario A SUCCESS: First BNPL order approved.');
  } else {
    console.log('❌ Scenario A FAILED:', checkout1Data);
  }

  // Get the first installment ID from DB
  let firstInstallmentId = null;
  await new Promise((resolve) => {
    db.get(`
      SELECT i.id FROM installments i
      JOIN installment_plans ip ON i.plan_id = ip.id
      WHERE ip.customer_id = ? AND i.installment_number = 1
    `, [customerId], (err, row) => {
      firstInstallmentId = row ? row.id : null;
      resolve();
    });
  });
  
  console.log('Created First Installment ID:', firstInstallmentId);

  // Scenario B: Second BNPL Order (Should Reject)
  console.log('\n--- Scenario B: Second BNPL Order (Unpaid Installment 1) ---');
  const checkout2Res = await fetch(`${API_BASE}/store1/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId,
      paymentMethod: 'installments',
      fulfillmentMode: 'pickup',
      items: [{ productId: 'prod1', quantity: 1, price: 20 }]
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
  const payRes = await fetch(`${API_BASE}/installments/${firstInstallmentId}/pay`, {
    method: 'POST'
  });
  const payData = await payRes.json();
  console.log('Payment Response:', payData);

  // Scenario C: Second BNPL Order (After Payment)
  console.log('\n--- Scenario C: Second BNPL Order (Paid Installment 1) ---');
  const checkout3Res = await fetch(`${API_BASE}/store1/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId,
      paymentMethod: 'installments',
      fulfillmentMode: 'pickup',
      items: [{ productId: 'prod1', quantity: 1, price: 20 }]
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
