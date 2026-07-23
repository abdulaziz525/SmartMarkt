import { Router } from 'express';
import { db } from '../config/db.js';
import { logAudit } from '../services/audit.js';

const router = Router();

router.get('/audit-logs', async (req, res) => {
  try {
    let query = db('audit_logs').where({ store_id: req.storeId }).orderBy('timestamp', 'desc');
    
    if (req.user && req.user.role === 'manager') {
      query = query.where(function() {
        this.where('role', 'cashier').orWhere('userId', req.user.id);
      });
    }
    
    const logs = await query;
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

