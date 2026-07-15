import { Router } from 'express';
import { db } from '../config/db.js';
import { logAudit } from '../services/audit.js';

const router = Router();

router.get('/purchase-orders', async (req, res) => {
  try {
    const pos = await db('purchase_orders').select('*').orderBy('date', 'desc');
    const allItems = await db('purchase_order_items').select('*');
    
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
      
      return {
        ...po,
        total: Number(po.total),
        items
      };
    });

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/purchase-orders', async (req, res) => {
  try {
    const { po, currentUser } = req.body;

    await db.transaction(async (trx) => {
      const existing = await trx('purchase_orders').where({ id: po.id }).first();
      
      const poData = {
        id: po.id,
        poNumber: po.poNumber,
        date: po.date,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        total: po.total,
        status: po.status,
        receivedDate: po.receivedDate || null
      };

      if (existing) {
        await trx('purchase_orders').where({ id: po.id }).update(poData);
        await trx('purchase_order_items').where({ poId: po.id }).delete();
        
        if (currentUser) {
          await logAudit(
            currentUser.id,
            currentUser.nameAr,
            currentUser.role,
            'PO_UPDATE',
            `Updated Purchase Order: ${po.poNumber}, Status: ${po.status}`
          );
        }
      } else {
        await trx('purchase_orders').insert(poData);
        
        if (currentUser) {
          await logAudit(
            currentUser.id,
            currentUser.nameAr,
            currentUser.role,
            'PO_CREATE',
            `Created Purchase Order: ${po.poNumber} for supplier ${po.supplierName}`
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
          total: item.total
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
    const { currentUser } = req.body;

    await db.transaction(async (trx) => {
      const po = await trx('purchase_orders').where({ id }).first();
      if (!po) {
        throw new Error('Purchase order not found');
      }
      if (po.status === 'received') {
        throw new Error('Purchase order is already received');
      }

      const receivedDate = new Date().toISOString();
      await trx('purchase_orders').where({ id }).update({
        status: 'received',
        receivedDate
      });

      const poItems = await trx('purchase_order_items').where({ poId: id });
      
      for (const item of poItems) {
        const product = await trx('products').where({ id: item.productId }).first();
        if (product) {
          const newQty = Number(product.quantity) + Number(item.quantity);
          await trx('products').where({ id: item.productId }).update({
            quantity: newQty,
            costPrice: item.costPrice
          });
        }
      }

      const supplier = await trx('suppliers').where({ id: po.supplierId }).first();
      if (supplier) {
        const newBalance = Number(supplier.balance) + Number(po.total);
        await trx('suppliers').where({ id: po.supplierId }).update({
          balance: newBalance
        });
      }

      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.nameAr,
          currentUser.role,
          'PO_RECEIVE',
          `Received Purchase Order: ${po.poNumber}, inventory stock updated for ${poItems.length} items`
        );
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
