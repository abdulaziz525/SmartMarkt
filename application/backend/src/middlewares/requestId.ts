import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

// Lets the frontend/nginx-supplied X-Request-Id (or a freshly generated one)
// be echoed back and logged, so a single request can be traced across
// frontend, nginx, and backend logs.
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incoming = req.headers['x-request-id'];
  const requestId = (typeof incoming === 'string' && incoming) || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};
