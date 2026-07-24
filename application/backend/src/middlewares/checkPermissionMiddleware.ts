import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db.js';

export const checkPermissionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || !user.role) {
    return res.status(403).json({ error: 'Forbidden: Role not found' });
  }

  const role = user.role;
  const path = req.originalUrl;
  const method = req.method;

  if (role === 'owner') {
    return next();
  }

  if (role === 'cashier') {
    // Cashier can only access POS, and handle Purchase Orders (requests)
    const isPOSRelated = path.startsWith('/api/invoices') || 
                         (path.startsWith('/api/products') && method === 'GET') ||
                         path.startsWith('/api/purchase-orders') ||
                         (path.startsWith('/api/suppliers') && method === 'GET') ||
                         (path.startsWith('/api/store-info') && method === 'GET') ||
                         (path.startsWith('/api/stores') && method === 'GET');
    if (!isPOSRelated) {
      return res.status(403).json({ error: 'Forbidden: Cashiers only have access to POS and POs' });
    }
    return next();
  }

  if (role === 'manager') {
    try {
      const dbUser = await db('users').where({ id: user.id }).first();
      const permissions = dbUser?.permissions ? JSON.parse(dbUser.permissions) : {};

      let isRestricted = false;
      
      if (path.startsWith('/api/users') && !permissions['employee_management']) {
        isRestricted = true;
      }
      if (path.startsWith('/api/stores') && method !== 'GET' && !permissions['branch_management']) {
        isRestricted = true;
      }
      if (path.startsWith('/api/store-info') && method !== 'GET' && !permissions['settings']) {
        isRestricted = true;
      }
      
      if (isRestricted) {
        return res.status(403).json({ error: 'Forbidden: Branch Managers lack required permissions for this action' });
      }
      return next();
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(403).json({ error: 'Forbidden: Unknown role' });
};

