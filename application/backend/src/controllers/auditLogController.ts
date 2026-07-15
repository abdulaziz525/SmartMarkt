import { Router } from 'express';
import { db } from '../config/db.js';
import { logAudit } from '../services/audit.js';

const router = Router();

router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await db('audit_logs').select('*').orderBy('timestamp', 'desc');
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/audit-logs', async (req, res) => {
  try {
    const { action, details, currentUser } = req.body;
    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.nameAr,
        currentUser.role,
        action,
        details
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
