import { Router } from 'express';
import { db } from '../config/db.js';
import { logAudit } from '../services/audit.js';

const router = Router();

router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await db('suppliers').where({ store_id: req.storeId }).select('*');
    const sanitized = suppliers.map(s => ({
      ...s,
      balance: Number(s.balance)
    }));
    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const { supplier } = req.body;
    
    const existing = await db('suppliers').where({ id: supplier.id, store_id: req.storeId }).first();
    
    const supplierData = {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      vatNumber: supplier.vatNumber || null,
      balance: supplier.balance,
      store_id: req.storeId
    };

    if (existing) {
      await db('suppliers').where({ id: supplier.id, store_id: req.storeId }).update(supplierData);
      if (req.user) {
        await logAudit(
          req.user.id,
          req.user.nameAr,
          req.user.role,
          'SUPPLIER_UPDATE',
          `Updated supplier: ${supplier.name}`,
          req.storeId
        );
      }
    } else {
      await db('suppliers').insert(supplierData);
      if (req.user) {
        await logAudit(
          req.user.id,
          req.user.nameAr,
          req.user.role,
          'SUPPLIER_CREATE',
          `Created supplier: ${supplier.name}`,
          req.storeId
        );
      }
    }

    res.json(supplier);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await db('suppliers').where({ id, store_id: req.storeId }).first();
    if (supplier) {
      await db('suppliers').where({ id, store_id: req.storeId }).delete();
      if (req.user) {
        await logAudit(
          req.user.id,
          req.user.nameAr,
          req.user.role,
          'SUPPLIER_DELETE',
          `Deleted supplier: ${supplier.name}`,
          req.storeId
        );
      }
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Supplier not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/suppliers/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    await db.transaction(async (trx) => {
      const supplier = await trx('suppliers').where({ id, store_id: req.storeId }).first();
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      const newBalance = Number(supplier.balance) - Number(amount);
      await trx('suppliers').where({ id, store_id: req.storeId }).update({ balance: newBalance });

      if (req.user) {
        await logAudit(
          req.user.id,
          req.user.nameAr,
          req.user.role,
          'SUPPLIER_PAYMENT',
          `Paid ${amount.toFixed(2)} SAR to supplier ${supplier.name}`,
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

