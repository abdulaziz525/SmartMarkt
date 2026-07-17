import { Request, Response, NextFunction } from 'express';

export const checkPermissionMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
    // Cashier can only access POS related endpoints
    const isPOSRelated = path.startsWith('/api/invoices') || 
                         (path.startsWith('/api/products') && method === 'GET');
    if (!isPOSRelated) {
      return res.status(403).json({ error: 'Forbidden: Cashiers only have access to POS' });
    }
    return next();
  }

  if (role === 'manager') {
    // Manager can access most things except stores, users, and modifying store settings
    const isRestricted = path.startsWith('/api/users') || 
                         path.startsWith('/api/stores') || 
                         (path.startsWith('/api/store-info') && method !== 'GET');
    
    if (isRestricted) {
      return res.status(403).json({ error: 'Forbidden: Branch Managers cannot access this resource' });
    }
    return next();
  }

  return res.status(403).json({ error: 'Forbidden: Unknown role' });
};

