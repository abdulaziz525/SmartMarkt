import { Router } from 'express';
import { db } from '../config/db.js';
import { logAudit } from '../services/audit.js';

const router = Router();

router.get('/stores', async (req, res) => {
  try {
    let stores = await db('stores')
      .where({ organization_id: req.user.organization_id })
      .select('*');
      
    if (req.user.role === 'manager' || req.user.role === 'cashier') {
      const dbUser = await db('users').where({ id: req.user.id }).first();
      const assignedStoreIds = dbUser?.store_ids ? JSON.parse(dbUser.store_ids) : (dbUser?.store_id ? [dbUser.store_id] : []);
      stores = stores.filter(s => assignedStoreIds.includes(s.id));
    }
    res.json(stores);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/branches', async (req, res) => {
  try {
    let stores = await db('stores')
      .where({ organization_id: req.user.organization_id })
      .select('*');
      
    if (req.user.role === 'manager' || req.user.role === 'cashier') {
      const dbUser = await db('users').where({ id: req.user.id }).first();
      const assignedStoreIds = dbUser?.store_ids ? JSON.parse(dbUser.store_ids) : (dbUser?.store_id ? [dbUser.store_id] : []);
      stores = stores.filter(s => assignedStoreIds.includes(s.id));
    }
    
    const branches = stores.map(s => ({
      id: s.id,
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      location: s.address,
      status: s.status
    }));
    res.json(branches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/branches', async (req, res) => {
  try {
    const { branch } = req.body;
    const { id, nameAr, nameEn, location, status } = branch;

    const existing = await db('stores').where({ id }).first();
    if (existing) {
      await db('stores')
        .where({ id })
        .update({
          nameAr,
          nameEn,
          address: location,
          status
        });
    } else {
      const baseStore = await db('stores').where({ organization_id: req.user.organization_id }).first();
      await db('stores').insert({
        id,
        nameAr,
        nameEn,
        vatNumber: baseStore?.vatNumber || '300000000000003',
        phone: baseStore?.phone || '0500000000',
        address: location,
        organization_id: req.user.organization_id,
        status
      });
    }
    res.json(branch);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db('stores').where({ id, organization_id: req.user.organization_id }).delete();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/store-info', async (req, res) => {
  try {
    const store = await db('stores').where({ id: req.storeId }).first();
    res.json(store || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/store-info', async (req, res) => {
  try {
    const { nameAr, nameEn, vatNumber, phone, address, is_website_enabled } = req.body;
    
    const updateData: any = { nameAr, nameEn, vatNumber, phone, address };
    if (is_website_enabled !== undefined) {
      updateData.is_website_enabled = is_website_enabled;
    }
    
    await db('stores')
      .where({ id: req.storeId })
      .update(updateData);

    if (req.user) {
      await logAudit(
        req.user.id,
        req.user.nameAr,
        req.user.role,
        'STORE_INFO_UPDATE',
        `Updated store name: ${nameAr}, VAT: ${vatNumber}`,
        req.storeId
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

