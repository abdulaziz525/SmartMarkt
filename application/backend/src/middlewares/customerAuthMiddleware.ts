import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';

declare global {
  namespace Express {
    interface Request {
      customer?: { id: string };
    }
  }
}

export const customerAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.customer_token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Please login to continue' });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'customer' || !decoded.id) {
      return res.status(403).json({ error: 'Forbidden: Invalid session' });
    }
    req.customer = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};
