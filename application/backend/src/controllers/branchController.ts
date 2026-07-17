import { Router } from 'express';
import { db } from '../config/db.js';
import { logAudit } from '../services/audit.js';

const router = Router();

router.get('/branches', async (req, res) => {
  try {
    const branches = await db('branches').select('*');
    res.json(branches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/branches', async (req, res) => {
  try {
    const { branch } = req.body;
    
    const existing = await db('branches').where({ id: branch.id }).first();
    
    const branchData = {
      id: branch.id,
      nameAr: branch.nameAr,
      nameEn: branch.nameEn,
      location: branch.location,
      status: branch.status || 'active'
    };

    if (existing) {
      await db('branches').where({ id: branch.id }).update(branchData);
      if (req.user) {
        await logAudit(
          req.user.id,
          req.user.nameAr,
          req.user.role,
          'BRANCH_UPDATE',
          `Updated branch: ${branch.nameAr}`
        );
      }
    } else {
      await db('branches').insert(branchData);
      if (req.user) {
        await logAudit(
          req.user.id,
          req.user.nameAr,
          req.user.role,
          'BRANCH_CREATE',
          `Created branch: ${branch.nameAr}`
        );
      }
    }

    res.json(branch);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await db('branches').where({ id }).first();
    if (branch) {
      await db('branches').where({ id }).delete();
      if (req.user) {
        await logAudit(
          req.user.id,
          req.user.nameAr,
          req.user.role,
          'BRANCH_DELETE',
          `Deleted branch: ${branch.nameAr}`
        );
      }
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Branch not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
