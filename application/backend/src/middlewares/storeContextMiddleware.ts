import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db.js';

declare global {
  namespace Express {
    interface Request {
      storeId?: string;
    }
  }
}

export const storeContextMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // These routes are scoped by organization_id on the backend (not store_id),
  // so they must bypass the x-store-id requirement.
  const orgScopedPaths = ['/stores', '/branches', '/users', '/status'];
  const normalizedPath = req.path.replace(/\/$/, ''); // strip trailing slash
  if (orgScopedPaths.some(p => normalizedPath === p || normalizedPath.startsWith(p + '/'))) {
    return next();
  }

  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User session required' });
  }

  const { role, organization_id, store_id } = user;

  if (role === 'owner') {
    const xStoreId = req.headers['x-store-id'] as string;
    if (!xStoreId) {
      return res.status(400).json({ error: 'Store context required: x-store-id header is missing' });
    }

    try {
      const store = await db('stores').where({ id: xStoreId, organization_id }).first();
      if (!store) {
        return res.status(403).json({ error: 'Forbidden: Selected store does not belong to your organization' });
      }
      req.storeId = xStoreId;
      next();
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  } else if (role === 'manager' || role === 'cashier') {
    if (!store_id) {
      return res.status(403).json({ error: 'Forbidden: User is not assigned to any store' });
    }
    req.storeId = store_id;
    next();
  } else {
    return res.status(403).json({ error: 'Forbidden: Unknown user role' });
  }
};
