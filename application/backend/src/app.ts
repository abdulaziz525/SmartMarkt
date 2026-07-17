import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { runMigrations } from './models/migrations.js';
import { authMiddleware } from './middlewares/authMiddleware.js';
import { checkPermissionMiddleware } from './middlewares/checkPermissionMiddleware.js';
import authRoutes from './routes/auth.routes.js';
import statusController from './controllers/statusController.js';
import storeController from './controllers/storeController.js';
import userController from './controllers/userController.js';
import productController from './controllers/productController.js';
import supplierController from './controllers/supplierController.js';
import purchaseOrderController from './controllers/purchaseOrderController.js';
import invoiceController from './controllers/invoiceController.js';
import auditLogController from './controllers/auditLogController.js';
import branchController from './controllers/branchController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api', authRoutes);

// Protected API Routes
app.use('/api', authMiddleware, checkPermissionMiddleware);
app.use('/api', statusController);
app.use('/api', storeController);
app.use('/api', userController);
app.use('/api', productController);
app.use('/api', supplierController);
app.use('/api', purchaseOrderController);
app.use('/api', invoiceController);
app.use('/api', auditLogController);
app.use('/api', branchController);

async function startServer() {
  try {
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
