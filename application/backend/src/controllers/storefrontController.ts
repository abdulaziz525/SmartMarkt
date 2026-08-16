import { Router } from 'express';
import { db } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_SECRET } from '../config/jwt.js';
import { customerAuthMiddleware } from '../middlewares/customerAuthMiddleware.js';

const router = Router();

const CUSTOMER_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

class CheckoutError extends Error {}

function signCustomerToken(customerId: string) {
  return jwt.sign({ id: customerId, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
}

function setCustomerCookie(res: any, token: string) {
  res.cookie('customer_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: CUSTOMER_COOKIE_MAX_AGE
  });
}

// Middleware to check if the store's e-commerce website is enabled.
// Bound via router.param (not router.use) so it only runs for routes that
// actually declare a :storeId segment — router.use('/:storeId', ...) would
// also match /auth/register, /auth/login, etc., treating "auth" as a
// storeId and 404ing those routes.
router.param('storeId', async (req, res, next, storeId) => {
  try {
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

    setCustomerCookie(res, signCustomerToken(customerId));

    res.json({ success: true, customer: { id: customerId, name, email, phone } });
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

    setCustomerCookie(res, signCustomerToken(customer.id));

    res.json({
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

router.post('/auth/logout', (req, res) => {
  res.clearCookie('customer_token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// BNPL Credit Guard & Checkout
router.post('/:storeId/checkout', customerAuthMiddleware, async (req, res) => {
  try {
    const { storeId } = req.params;
    const customerId = req.customer!.id;
    const { items, paymentMethod, fulfillmentMode } = req.body;

    // items: { productId, quantity }[] — price is always derived server-side

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

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

    const invoiceId = crypto.randomUUID();

    await db.transaction(async (trx) => {
      // 2. Authorize, Update Inventory & Calculate Totals from server-side prices
      const productIds = items.map((item: any) => item.productId);
      const dbProducts = await trx('products').whereIn('id', productIds).andWhere({ store_id: storeId });
      const productMap = new Map(dbProducts.map((p: any) => [p.id, p]));

      let total = 0;
      const itemRows: any[] = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new CheckoutError(`Product not found: ${item.productId}`);
        }

        // Atomic, condition-guarded decrement avoids the TOCTOU race between
        // checking and decrementing stock under concurrent checkouts.
        const updatedRows = await trx('products')
          .where({ id: item.productId, store_id: storeId })
          .andWhere('quantity', '>=', item.quantity)
          .decrement('quantity', item.quantity);

        if (!updatedRows) {
          throw new CheckoutError(`Insufficient inventory for product: ${product.nameEn}`);
        }

        const price = product.sellingPrice;
        const subtotal = item.quantity * price;
        const vatAmount = subtotal * 0.15;
        total += subtotal;

        itemRows.push({
          invoiceId,
          productId: product.id,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          quantity: item.quantity,
          sellingPrice: price,
          costPrice: product.costPrice,
          discount: 0,
          taxRate: 0.15,
          subtotal,
          vatAmount,
          total: subtotal + vatAmount,
          store_id: storeId
        });
      }

      // 3. Create Invoice
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      await trx('invoices').insert({
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

      await trx('invoice_items').insert(itemRows);

      // 4. Create BNPL Schedule if applicable
      if (paymentMethod === 'installments') {
        const planId = crypto.randomUUID();
        await trx('installment_plans').insert({
          id: planId,
          customer_id: customerId,
          invoice_id: invoiceId,
          store_id: storeId,
          total_amount: total * 1.15,
          status: 'ACTIVE'
        });

        // Split into 4 installments (for example)
        const installmentAmount = (total * 1.15) / 4;
        const installmentRows: any[] = [];
        for (let i = 1; i <= 4; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);

          installmentRows.push({
            id: crypto.randomUUID(),
            plan_id: planId,
            installment_number: i,
            amount: installmentAmount,
            due_date: dueDate.toISOString(),
            status: 'PENDING'
          });
        }
        await trx('installments').insert(installmentRows);
      }
    });

    res.json({ success: true, invoiceId, message: 'Checkout completed successfully!' });
  } catch (err: any) {
    if (err instanceof CheckoutError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// Pay an installment
router.post('/installments/:installmentId/pay', customerAuthMiddleware, async (req, res) => {
  try {
    const { installmentId } = req.params;
    const customerId = req.customer!.id;

    const installment = await db('installments')
      .join('installment_plans', 'installments.plan_id', '=', 'installment_plans.id')
      .where('installments.id', installmentId)
      .andWhere('installment_plans.customer_id', customerId)
      .select('installments.*')
      .first();

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
