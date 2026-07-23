import { Router } from 'express';
import { db } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();

// Middleware to check if the store's e-commerce website is enabled
router.use('/:storeId', async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const store = await db('stores').where({ id: storeId }).first();
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    if (store.is_website_enabled === 0 || store.is_website_enabled === false) {
      return res.status(403).json({ error: 'E-commerce website is currently disabled for this branch.' });
    }
    next();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Publicly fetch products for a specific branch
router.get('/:storeId/products', async (req, res) => {
  try {
    const { storeId } = req.params;
    const products = await db('products').where({ store_id: storeId });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Registration
router.post('/auth/register', async (req, res) => {
  try {
    const { name, phone, email, password, nationalAddress } = req.body;
    
    // Validate nationalAddress
    if (!nationalAddress || !/^[A-Za-z]{4}\d{4}$/.test(nationalAddress)) {
      return res.status(400).json({ error: 'National address must consist of 4 English letters followed by 4 numbers (e.g., AAAA1111).' });
    }

    // Check existing
    const existing = await db('customers').where({ email }).first();
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const customerId = crypto.randomUUID();

    await db('customers').insert({
      id: customerId,
      name,
      phone,
      email,
      password: passwordHash,
      nationalAddress: nationalAddress.toUpperCase(),
      status: 'active'
    });

    res.json({ success: true, customerId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const customer = await db('customers').where({ email }).first();
    
    if (!customer) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: customer.id, role: 'customer' },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// BNPL Credit Guard & Checkout
router.post('/:storeId/checkout', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { customerId, items, paymentMethod, fulfillmentMode } = req.body;
    
    // items: { productId, quantity, price }[]
    
    // 1. If deferred/BNPL, apply Credit Guard
    if (paymentMethod === 'installments' || paymentMethod === 'deferred') {
      const unpaidFirstInstallment = await db('installments')
        .join('installment_plans', 'installments.plan_id', '=', 'installment_plans.id')
        .where('installment_plans.customer_id', customerId)
        .andWhere('installments.installment_number', 1)
        .andWhere('installments.status', 'PENDING')
        .first();

      if (unpaidFirstInstallment) {
        return res.status(403).json({
          error: 'Credit Denied: You have an unpaid first installment. Please settle it to unlock further BNPL purchases.'
        });
      }
    }

    // 2. Authorize, Update Inventory & Calculate Totals
    let total = 0;
    for (const item of items) {
      const product = await db('products').where({ id: item.productId, store_id: storeId }).first();
      if (!product || product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient inventory for product: ${product?.nameEn || item.productId}` });
      }
      total += item.quantity * item.price;
    }

    // Deduct Inventory
    for (const item of items) {
      await db('products')
        .where({ id: item.productId, store_id: storeId })
        .decrement('quantity', item.quantity);
    }

    // 3. Create Invoice
    const invoiceId = crypto.randomUUID();
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    await db('invoices').insert({
      id: invoiceId,
      invoiceNumber,
      date: new Date().toISOString(),
      subtotal: total,
      vatAmount: total * 0.15,
      total: total * 1.15,
      paymentMethod,
      zatcaQrCode: 'PENDING_QR', // To be generated properly
      cashierId: 'ONLINE_SYSTEM',
      cashierName: 'E-Commerce Storefront',
      store_id: storeId,
      customer_id: customerId,
      fulfillment_mode: fulfillmentMode // 'pickup' or 'delivery'
    });

    const itemRows: any[] = [];
    for (const item of items) {
      const product = await db('products').where({ id: item.productId, store_id: storeId }).first();
      if (product) {
        const subtotal = item.quantity * item.price;
        const vatAmount = subtotal * 0.15;
        itemRows.push({
          invoiceId: invoiceId,
          productId: product.id,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          quantity: item.quantity,
          sellingPrice: item.price,
          costPrice: product.costPrice,
          discount: 0,
          taxRate: 0.15,
          subtotal: subtotal,
          vatAmount: vatAmount,
          total: subtotal + vatAmount,
          store_id: storeId
        });
      }
    }
    if (itemRows.length > 0) {
      await db('invoice_items').insert(itemRows);
    }

    // 4. Create BNPL Schedule if applicable
    if (paymentMethod === 'installments') {
      const planId = crypto.randomUUID();
      await db('installment_plans').insert({
        id: planId,
        customer_id: customerId,
        invoice_id: invoiceId,
        store_id: storeId,
        total_amount: total * 1.15,
        status: 'ACTIVE'
      });

      // Split into 4 installments (for example)
      const installmentAmount = (total * 1.15) / 4;
      for (let i = 1; i <= 4; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        
        await db('installments').insert({
          id: crypto.randomUUID(),
          plan_id: planId,
          installment_number: i,
          amount: installmentAmount,
          due_date: dueDate.toISOString(),
          status: 'PENDING'
        });
      }
    }

    res.json({ success: true, invoiceId, message: 'Checkout completed successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Pay an installment
router.post('/installments/:installmentId/pay', async (req, res) => {
  try {
    const { installmentId } = req.params;
    
    const installment = await db('installments').where({ id: installmentId }).first();
    if (!installment) {
      return res.status(404).json({ error: 'Installment not found' });
    }
    
    if (installment.status === 'PAID') {
      return res.status(400).json({ error: 'Installment is already paid' });
    }

    await db('installments')
      .where({ id: installmentId })
      .update({ status: 'PAID' });
      
    res.json({ success: true, message: 'Installment paid successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
