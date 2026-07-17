import { Router } from 'express';
import { db } from '../config/db.js';
import { logAudit } from '../services/audit.js';

const router = Router();

router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await db('audit_logs').where({ store_id: req.storeId }).orderBy('timestamp', 'desc');
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/audit-logs', async (req, res) => {
  try {
    const { action, details } = req.body;
    if (req.user) {
      await logAudit(
        req.user.id,
        req.user.nameAr,
        req.user.role,
        action,
        details,
        req.storeId
      );
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Current user info required' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

