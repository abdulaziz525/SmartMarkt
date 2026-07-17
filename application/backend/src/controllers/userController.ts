import { Router } from 'express';
import { db } from '../config/db.js';

const router = Router();

router.get('/users', async (req, res) => {
  try {
    const users = await db('users').where({ organization_id: req.user.organization_id }).select('*');
    const sanitized = users.map(u => ({ ...u, active: !!u.active }));
    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

