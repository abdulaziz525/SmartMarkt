import { Router } from 'express';
import { dbType } from '../config/db.js';

const router = Router();

router.get('/status', (req, res) => {
  res.json({ status: 'ok', dbType });
});

export default router;
