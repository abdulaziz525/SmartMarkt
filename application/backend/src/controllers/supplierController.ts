import { Router } from 'express';
import { db } from '../config/db.js';
import { logAudit } from '../services/audit.js';

const router = Router();

router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await db('suppliers').select('*');
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
    const { supplier, currentUser } = req.body;
    
    const existing = await db('suppliers').where({ id: supplier.id }).first();
    
    const supplierData = {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      vatNumber: supplier.vatNumber || null,
      balance: supplier.balance
    };

    if (existing) {
      await db('suppliers').where({ id: supplier.id }).update(supplierData);
      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.nameAr,
          currentUser.role,
          'SUPPLIER_UPDATE',
          `Updated supplier: ${supplier.name}`
        );
      }
    } else {
      await db('suppliers').insert(supplierData);
      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.nameAr,
          currentUser.role,
          'SUPPLIER_CREATE',
          `Created supplier: ${supplier.name}`
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
    const { currentUser } = req.body;

    const supplier = await db('suppliers').where({ id }).first();
    if (supplier) {
      await db('suppliers').where({ id }).delete();
      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.nameAr,
          currentUser.role,
          'SUPPLIER_DELETE',
          `Deleted supplier: ${supplier.name}`
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
    const { amount, currentUser } = req.body;

    await db.transaction(async (trx) => {
      const supplier = await trx('suppliers').where({ id }).first();
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      const newBalance = Number(supplier.balance) - Number(amount);
      await trx('suppliers').where({ id }).update({ balance: newBalance });

      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.nameAr,
          currentUser.role,
          'SUPPLIER_PAYMENT',
          `Paid ${amount.toFixed(2)} SAR to supplier ${supplier.name}`
        );
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
