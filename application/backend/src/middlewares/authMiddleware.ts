import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { JWT_SECRET, ACCESS_TOKEN_TTL_SECONDS } from '../config/jwt.js';

// Backed by Redis when REDIS_URL is set so logout/blacklisting works across
// multiple backend instances in production; falls back to an in-memory Set
// (single-instance/dev/test) otherwise.
const redisClient = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
const memoryBlacklist = new Set<string>();

export const tokenBlacklist = {
  async add(token: string): Promise<void> {
    if (redisClient) {
      await redisClient.set(`blacklist:${token}`, '1', 'EX', ACCESS_TOKEN_TTL_SECONDS);
    } else {
      memoryBlacklist.add(token);
    }
  },
  async has(token: string): Promise<boolean> {
    if (redisClient) {
      return (await redisClient.exists(`blacklist:${token}`)) === 1;
    }
    return memoryBlacklist.has(token);
  },
  clear(): void {
    memoryBlacklist.clear();
  },
};

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  if (await tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: Token has been logged out' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};
