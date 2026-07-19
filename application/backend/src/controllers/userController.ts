import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';

const router = Router();

// GET /api/users — list all users in the organization
router.get('/users', async (req, res) => {
  try {
    const users = await db('users')
      .where({ organization_id: req.user.organization_id })
      .select('id', 'username', 'nameAr', 'nameEn', 'role', 'active', 'organization_id', 'store_id', 'store_ids');
    const sanitized = users.map(u => ({
      ...u,
      active: !!u.active,
      store_ids: u.store_ids ? JSON.parse(u.store_ids) : (u.store_id ? [u.store_id] : []),
    }));
    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — create a new employee (manager or cashier)
router.post('/users', async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only owners can create employees' });
  }
  try {
    const { fullName, username, password, role, store_ids } = req.body;

    if (!fullName || !username || !password || !role) {
      return res.status(400).json({ error: 'fullName, username, password and role are required' });
    }
    if (!['manager', 'cashier'].includes(role)) {
      return res.status(400).json({ error: 'Role must be manager or cashier' });
    }

    const existing = await db('users').where({ username }).first();
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // For cashier: assigned to one store (first in list). For manager: can span many.
    const assignedStoreIds: string[] = Array.isArray(store_ids) ? store_ids : [];
    const primaryStoreId = assignedStoreIds[0] || null;

    const newUser = {
      id: userId,
      username,
      password: hashedPassword,
      nameAr: fullName,
      nameEn: fullName,
      role,
      active: true,
      organization_id: req.user.organization_id,
      store_id: primaryStoreId,
      store_ids: JSON.stringify(assignedStoreIds),
    };

    await db('users').insert(newUser);

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({
      ...safeUser,
      active: true,
      store_ids: assignedStoreIds,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — update employee role, name, store assignment, active status
router.put('/users/:id', async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only owners can update employees' });
  }
  try {
    const { id } = req.params;
    const { fullName, role, store_ids, active, password } = req.body;

    // Verify target user belongs to same org
    const target = await db('users')
      .where({ id, organization_id: req.user.organization_id })
      .first();
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (target.role === 'owner') {
      return res.status(403).json({ error: 'Cannot modify the owner account' });
    }

    const assignedStoreIds: string[] = Array.isArray(store_ids) ? store_ids : [];
    const primaryStoreId = assignedStoreIds[0] || null;

    const updatePayload: any = {
      nameAr: fullName || target.nameAr,
      nameEn: fullName || target.nameEn,
      role: role || target.role,
      store_id: primaryStoreId,
      store_ids: JSON.stringify(assignedStoreIds),
    };
    if (typeof active === 'boolean') updatePayload.active = active;
    if (password) updatePayload.password = await bcrypt.hash(password, 10);

    await db('users').where({ id }).update(updatePayload);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id — delete an employee
router.delete('/users/:id', async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only owners can delete employees' });
  }
  try {
    const { id } = req.params;
    const target = await db('users')
      .where({ id, organization_id: req.user.organization_id })
      .first();
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'owner') return res.status(403).json({ error: 'Cannot delete the owner account' });

    await db('users').where({ id }).delete();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
