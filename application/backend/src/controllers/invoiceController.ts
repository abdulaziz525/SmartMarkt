import { Router } from 'express';
import { z } from 'zod';
import { db } from '../config/db.js';
import { logAudit } from '../services/audit.js';
import { generateZatcaBase64 } from '../services/zatca.js';

const router = Router();

const createInvoiceSchema = z.object({
  items: z.array(z.object({
    product: z.object({ id: z.string(), nameAr: z.string(), nameEn: z.string(), sellingPrice: z.number() }).passthrough(),
    quantity: z.number().positive(),
    discount: z.number().min(0).max(100),
    customPrice: z.number().nonnegative().optional(),
  })).min(1, 'Invoice must contain at least one item'),
  paymentMethod: z.enum(['cash', 'card', 'split', 'installments', 'deferred']),
  paymentDetails: z.object({
    cashAmount: z.number().nonnegative().optional(),
    cardAmount: z.number().nonnegative().optional(),
  }),
});

router.get('/invoices', async (req, res) => {
  try {
    const invoices = await db('invoices').where({ store_id: req.storeId }).orderBy('date', 'desc');
    const allItems = await db('invoice_items').where({ store_id: req.storeId });

    const formatted = invoices.map(inv => {
      const items = allItems
        .filter(item => item.invoiceId === inv.id)
        .map(item => ({
          productId: item.productId,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          quantity: Number(item.quantity),
          sellingPrice: Number(item.sellingPrice),
          costPrice: Number(item.costPrice),
          discount: Number(item.discount),
          taxRate: Number(item.taxRate),
          subtotal: Number(item.subtotal),
          vatAmount: Number(item.vatAmount),
          total: Number(item.total)
        }));

      return {
        ...inv,
        subtotal: Number(inv.subtotal),
        discountAmount: Number(inv.discountAmount),
        vatAmount: Number(inv.vatAmount),
        total: Number(inv.total),
        paymentDetails: {
          cashAmount: inv.cashAmount ? Number(inv.cashAmount) : 0,
          cardAmount: inv.cardAmount ? Number(inv.cardAmount) : 0
        },
        items
      };
    });

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/invoices', async (req, res) => {
  try {
    const parsed = createInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid invoice payload', details: parsed.error.flatten() });
    }
    const { items, paymentMethod, paymentDetails } = parsed.data;

    const store = await db('stores').where({ id: req.storeId }).first();
    if (!store) {
      return res.status(500).json({ error: 'Store information is missing. Set store settings first.' });
    }

    let createdInvoice: any = null;

    await db.transaction(async (trx) => {
      const productIds = items.map((i: any) => i.product.id);
      const dbProducts = await trx('products').whereIn('id', productIds).andWhere({ store_id: req.storeId });

      const invoiceItems = items.map((item: any) => {
        const p = item.product;
        const basePrice = item.customPrice !== undefined ? item.customPrice : p.sellingPrice;
        const subtotal = item.quantity * basePrice * (1 - item.discount / 100);
        const vatAmount = subtotal * 0.15;
        const total = subtotal + vatAmount;

        const prodInDb = dbProducts.find((prod: any) => prod.id === p.id);
        if (!prodInDb) {
          throw new Error(`Product ${p.nameEn} not found in database`);
        }

        const costPrice = Number(prodInDb.costPrice);

        return {
          productId: p.id,
          nameAr: p.nameAr,
          nameEn: p.nameEn,
          quantity: item.quantity,
          sellingPrice: basePrice,
          costPrice,
          discount: item.discount,
          taxRate: 0.15,
          subtotal,
          vatAmount,
          total,
          store_id: req.storeId
        };
      });

      for (const item of items) {
        const prod = dbProducts.find((p: any) => p.id === item.product.id);
        if (prod) {
          const newQty = Math.max(0, Number(prod.quantity) - item.quantity);
          await trx('products').where({ id: prod.id, store_id: req.storeId }).update({ quantity: newQty });
        }
      }

      const subtotal = invoiceItems.reduce((acc: number, item: any) => acc + item.subtotal, 0);
      const vatAmount = invoiceItems.reduce((acc: number, item: any) => acc + item.vatAmount, 0);
      const total = subtotal + vatAmount;

      const countRes = await trx('invoices').where({ store_id: req.storeId }).count('id as cnt').first();
      const count = Number(countRes?.cnt || 0);
      const invSeq = count + 1001;
      const invoiceNumber = `INV-2026-${invSeq}`;
      const timestamp = new Date().toISOString();

      const zatcaQrCode = generateZatcaBase64(
        store.nameAr,
        store.vatNumber,
        timestamp,
        total,
        vatAmount
      );

      const discountAmount = items.reduce((acc: number, item: any) => {
        const base = item.customPrice !== undefined ? item.customPrice : item.product.sellingPrice;
        return acc + (item.quantity * base * (item.discount / 100));
      }, 0);

      const invId = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const invoiceData = {
        id: invId,
        invoiceNumber,
        date: timestamp,
        subtotal,
        discountAmount,
        vatAmount,
        total,
        paymentMethod,
        cashAmount: paymentDetails.cashAmount || null,
        cardAmount: paymentDetails.cardAmount || null,
        zatcaQrCode,
        cashierId: req.user.id,
        cashierName: req.user.nameAr,
        store_id: req.storeId
      };

      await trx('invoices').insert(invoiceData);

      // ZATCA compliance trail: record that a QR/TLV payload was generated for this invoice.
      await trx('invoice_audit_log').insert({
        invoice_id: invId,
        sent_at: timestamp,
        status: 'QR_GENERATED',
        response: null,
        store_id: req.storeId
      });

      const itemRows = invoiceItems.map((item: any) => ({
        invoiceId: invId,
        productId: item.productId,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        costPrice: item.costPrice,
        discount: item.discount,
        taxRate: item.taxRate,
        subtotal: item.subtotal,
        vatAmount: item.vatAmount,
        total: item.total,
        store_id: req.storeId
      }));
      
      await trx('invoice_items').insert(itemRows);

      const auditMsg = `Completed sale ${invoiceNumber}, Total: ${total.toFixed(2)} SAR, items count: ${invoiceItems.length}`;
      
      await trx('audit_logs').insert({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        userId: req.user.id,
        userName: req.user.nameAr,
        role: req.user.role,
        action: 'SALES_CHECKOUT',
        details: auditMsg,
        store_id: req.storeId
      });

      for (const item of invoiceItems) {
        const prod = dbProducts.find((p: any) => p.id === item.productId);
        if (prod) {
          const finalQty = Math.max(0, Number(prod.quantity) - item.quantity);
          if (finalQty <= Number(prod.lowStockThreshold)) {
            await trx('audit_logs').insert({
              id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              timestamp: new Date().toISOString(),
              userId: req.user.id,
              userName: req.user.nameAr,
              role: req.user.role,
              action: 'STOCK_ALERT',
              details: `Low stock warning: ${prod.nameEn} quantity is now ${finalQty} (threshold: ${prod.lowStockThreshold})`,
              store_id: req.storeId
            });
          }
        }
      }

      createdInvoice = {
        id: invId,
        invoiceNumber,
        date: timestamp,
        items: invoiceItems,
        subtotal,
        discountAmount,
        vatAmount,
        total,
        paymentMethod,
        paymentDetails,
        zatcaQrCode,
        cashierId: req.user.id,
        cashierName: req.user.nameAr
      };
    });

    res.json(createdInvoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
