import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runMigrations } from './models/migrations.js';
import statusController from './controllers/statusController.js';
import storeController from './controllers/storeController.js';
import userController from './controllers/userController.js';
import productController from './controllers/productController.js';
import supplierController from './controllers/supplierController.js';
import purchaseOrderController from './controllers/purchaseOrderController.js';
import invoiceController from './controllers/invoiceController.js';
import auditLogController from './controllers/auditLogController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', statusController);
app.use('/api', storeController);
app.use('/api', userController);
app.use('/api', productController);
app.use('/api', supplierController);
app.use('/api', purchaseOrderController);
app.use('/api', invoiceController);
app.use('/api', auditLogController);

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
