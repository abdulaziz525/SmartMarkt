import { Router } from 'express';
import { db } from '../config/db.js';
import { logAudit } from '../services/audit.js';

const router = Router();

router.get('/purchase-orders', async (req, res) => {
  try {
    const pos = await db('purchase_orders').where({ store_id: req.storeId }).orderBy('date', 'desc');
    const allItems = await db('purchase_order_items').where({ store_id: req.storeId });
    const allPayments = await db('supplier_payments').where({ store_id: req.storeId });
    
    const formatted = pos.map(po => {
      const items = allItems
        .filter(item => item.poId === po.id)
        .map(item => ({
          productId: item.productId,
          productNameAr: item.productNameAr,
          productNameEn: item.productNameEn,
          costPrice: Number(item.costPrice),
          quantity: Number(item.quantity),
          total: Number(item.total)
        }));

      const payments = allPayments
        .filter(p => p.poId === po.id)
        .map(p => ({
          ...p,
          amount: Number(p.amount)
        }));
      
      return {
        ...po,
        total: Number(po.total),
        paidAmount: Number(po.paidAmount || 0),
        items,
        payments
      };
    });

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/purchase-orders', async (req, res) => {
  try {
    const { po } = req.body;

    await db.transaction(async (trx) => {
      const targetStoreId = po.store_id || req.storeId;
      const existing = await trx('purchase_orders').where({ id: po.id, store_id: targetStoreId }).first();
      
      const poData = {
        id: po.id,
        poNumber: po.poNumber,
        date: po.date,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        total: po.total,
        status: po.status,
        receivedDate: po.receivedDate || null,
        store_id: targetStoreId
      };

      if (existing) {
        await trx('purchase_orders').where({ id: po.id, store_id: targetStoreId }).update(poData);
        await trx('purchase_order_items').where({ poId: po.id, store_id: targetStoreId }).delete();
        
        if (req.user) {
          await logAudit(
            req.user.id,
            req.user.nameAr,
            req.user.role,
            'PO_UPDATE',
            `Updated Purchase Order: ${po.poNumber}, Status: ${po.status}`,
            req.storeId
          );
        }
      } else {
        await trx('purchase_orders').insert(poData);
        
        if (req.user) {
          await logAudit(
            req.user.id,
            req.user.nameAr,
            req.user.role,
            'PO_CREATE',
            `Created Purchase Order: ${po.poNumber} for supplier ${po.supplierName}`,
            req.storeId
          );
        }
      }

      if (po.items && po.items.length > 0) {
        const itemRows = po.items.map((item: any) => ({
          poId: po.id,
          productId: item.productId,
          productNameAr: item.productNameAr,
          productNameEn: item.productNameEn,
          costPrice: item.costPrice,
          quantity: item.quantity,
          total: item.total,
          store_id: targetStoreId
        }));
        await trx('purchase_order_items').insert(itemRows);
      }
    });

    res.json(po);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/purchase-orders/:id/receive', async (req, res) => {
  try {
    const { id } = req.params;

    await db.transaction(async (trx) => {
      const po = await trx('purchase_orders').where({ id, store_id: req.storeId }).first();
      if (!po) {
        throw new Error('Purchase order not found');
      }
      if (po.status === 'received') {
        throw new Error('Purchase order is already received');
      }

      const receivedDate = new Date().toISOString();
      await trx('purchase_orders').where({ id, store_id: req.storeId }).update({
        status: 'received',
        receivedDate,
        receivedBy: req.user ? (req.user.nameAr || req.user.username) : 'غير مسجل'
      });

      const poItems = await trx('purchase_order_items').where({ poId: id, store_id: req.storeId });
      
      for (const item of poItems) {
        const product = await trx('products').where({ id: item.productId, store_id: req.storeId }).first();
        if (product) {
          const newQty = Number(product.quantity) + Number(item.quantity);
          await trx('products').where({ id: item.productId, store_id: req.storeId }).update({
            quantity: newQty,
            costPrice: item.costPrice
          });
        }
      }

      const supplier = await trx('suppliers').where({ id: po.supplierId, store_id: req.storeId }).first();
      if (supplier) {
        const newBalance = Number(supplier.balance) + Number(po.total);
        await trx('suppliers').where({ id: po.supplierId, store_id: req.storeId }).update({
          balance: newBalance
        });
      }

      if (req.user) {
        await logAudit(
          req.user.id,
          req.user.nameAr,
          req.user.role,
          'PO_RECEIVE',
          `Received Purchase Order: ${po.poNumber}, inventory stock updated for ${poItems.length} items`,
          req.storeId
        );
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/purchase-orders/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    await db.transaction(async (trx) => {
      const po = await trx('purchase_orders').where({ id, store_id: req.storeId }).first();
      if (!po) {
        throw new Error('Purchase order not found');
      }

      if (po.status !== 'received') {
        throw new Error('Cannot pay an unreceived purchase order');
      }

      const currentPaid = Number(po.paidAmount || 0);
      const total = Number(po.total);
      
      if (currentPaid + Number(amount) > total) {
        throw new Error('Payment amount exceeds remaining balance for this invoice');
      }

      const newPaidAmount = currentPaid + Number(amount);
      const paymentStatus = newPaidAmount >= total ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'unpaid');

      // Update PO
      await trx('purchase_orders').where({ id, store_id: req.storeId }).update({
        paidAmount: newPaidAmount,
        paymentStatus
      });

      // Create Payment Record
      const paymentId = `sp-${Date.now()}`;
      await trx('supplier_payments').insert({
        id: paymentId,
        poId: id,
        supplierId: po.supplierId,
        amount: Number(amount),
        date: new Date().toISOString(),
        cashierId: req.user?.id || 'unknown',
        cashierName: req.user ? (req.user.nameAr || req.user.username) : 'غير مسجل',
        store_id: req.storeId
      });

      // We no longer reduce supplier balance here because the balance 
      // can represent overall balance. But actually, if balance is increased when PO is received,
      // it should be decreased when paid.
      const supplier = await trx('suppliers').where({ id: po.supplierId, store_id: req.storeId }).first();
      if (supplier) {
        const newBalance = Number(supplier.balance) - Number(amount);
        await trx('suppliers').where({ id: po.supplierId, store_id: req.storeId }).update({
          balance: newBalance
        });
      }

      if (req.user) {
        await logAudit(
          req.user.id,
          req.user.nameAr,
          req.user.role,
          'PO_PAYMENT',
          `Paid ${amount} SAR for PO: ${po.poNumber}`,
          req.storeId
        );
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

