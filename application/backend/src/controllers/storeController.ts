import { Router } from 'express';
import { db } from '../config/db.js';
import { logAudit } from '../services/audit.js';

const router = Router();

router.get('/store-info', async (req, res) => {
  try {
    const store = await db('store_info').first();
    res.json(store || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/store-info', async (req, res) => {
  try {
    const { nameAr, nameEn, vatNumber, phone, address, currentUser } = req.body;
    
    const existing = await db('store_info').first();
    if (existing) {
      await db('store_info').update({ nameAr, nameEn, vatNumber, phone, address });
    } else {
      await db('store_info').insert({ nameAr, nameEn, vatNumber, phone, address });
    }

    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.nameAr,
        currentUser.role,
        'STORE_INFO_UPDATE',
        `Updated store name: ${nameAr}, VAT: ${vatNumber}`
      );
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
