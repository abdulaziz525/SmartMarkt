import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { runMigrations, resetDatabase, wipeDatabase } from './models/migrations.js';
import { authMiddleware, tokenBlacklist } from './middlewares/authMiddleware.js';
import { storeContextMiddleware } from './middlewares/storeContextMiddleware.js';
import { checkPermissionMiddleware } from './middlewares/checkPermissionMiddleware.js';
import { requestIdMiddleware } from './middlewares/requestId.js';
import authRoutes from './routes/auth.routes.js';
import statusController from './controllers/statusController.js';
import storeController from './controllers/storeController.js';
import userController from './controllers/userController.js';
import productController from './controllers/productController.js';
import supplierController from './controllers/supplierController.js';
import purchaseOrderController from './controllers/purchaseOrderController.js';
import invoiceController from './controllers/invoiceController.js';
import auditLogController from './controllers/auditLogController.js';
import storefrontController from './controllers/storefrontController.js';
import customerController from './controllers/customerController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS_ORIGIN is a comma-separated whitelist (e.g. "https://smartmarkt.com,https://www.smartmarkt.com").
// Falls back to reflecting the request origin outside production so local dev keeps working.
const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : (process.env.NODE_ENV === 'production' ? false : true),
  credentials: true
}));
app.use(helmet());
app.use(requestIdMiddleware);
app.use(express.json());
app.use(cookieParser());

// Rate limit login attempts to slow down credential-stuffing/brute-force attacks.
// Disabled under NODE_ENV=test so e2e suites (many logins from one IP) aren't throttled.
if (process.env.NODE_ENV !== 'test') {
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' },
  });
  app.use('/api/auth/login', loginLimiter);
}

// API Routes
app.use('/api/storefront', storefrontController);
app.use('/api', authRoutes);


if (process.env.NODE_ENV === 'test') {
  app.post('/api/test/reset', async (req, res) => {
    try {
      tokenBlacklist.clear();
      await resetDatabase();
      res.status(200).json({ message: 'Database reset successfully' });
    } catch (err: any) {
      console.error('Failed to reset database:', err);
      res.status(500).json({ error: 'Database reset failed', details: err.message });
    }
  });
}

// Protected API Routes
app.use('/api', authMiddleware, storeContextMiddleware, checkPermissionMiddleware);
app.use('/api', statusController);
app.use('/api', storeController);
app.use('/api', userController);
app.use('/api', productController);
app.use('/api', supplierController);
app.use('/api', purchaseOrderController);
app.use('/api', invoiceController);
app.use('/api', auditLogController);
app.use('/api', customerController);

async function startServer() {
  try {
    if (process.env.DB_CLEAN_WIPE === 'true') {
      await wipeDatabase();
    }
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`SmartMarkt backend server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database or start server:', err);
    process.exit(1);
  }
}

startServer();
