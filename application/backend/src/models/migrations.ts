import { db } from '../config/db.js';
import bcrypt from 'bcryptjs';

// Helper to get dates relative to today
const getDateAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const getFutureDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export async function runMigrations() {
  console.log('Checking database tables and running auto-migrations...');

  // 1. Store Info table
  const hasStoreInfo = await db.schema.hasTable('store_info');
  if (!hasStoreInfo) {
    console.log('Creating store_info table...');
    await db.schema.createTable('store_info', (table) => {
      table.string('vatNumber').primary();
      table.string('nameAr').notNullable();
      table.string('nameEn').notNullable();
      table.string('phone').notNullable();
      table.string('address').notNullable();
    });

    // Seed default store info is removed to allow first-time setup UI
  }

  // 2. Users table
  const hasUsers = await db.schema.hasTable('users');
  if (!hasUsers) {
    console.log('Creating users table...');
    await db.schema.createTable('users', (table) => {
      table.string('id').primary();
      table.string('username').unique().notNullable();
      table.string('password').notNullable();
      table.string('nameAr').notNullable();
      table.string('nameEn').notNullable();
      table.string('role').notNullable();
      table.boolean('active').notNullable().defaultTo(true);
    });

    // Seed default users is removed to allow first-time setup UI
  }

  // 3. Products table
  const hasProducts = await db.schema.hasTable('products');
  if (!hasProducts) {
    console.log('Creating products table...');
    await db.schema.createTable('products', (table) => {
      table.string('id').primary();
      table.string('barcode').unique().notNullable();
      table.string('nameAr').notNullable();
      table.string('nameEn').notNullable();
      table.string('category').notNullable();
      table.decimal('costPrice', 12, 2).notNullable();
      table.decimal('sellingPrice', 12, 2).notNullable();
      table.integer('quantity').notNullable().defaultTo(0);
      table.string('unit').notNullable();
      table.integer('lowStockThreshold').notNullable().defaultTo(10);
      table.string('expiryDate').nullable();
      table.boolean('isPerishable').notNullable().defaultTo(false);
    });

    // Seed default products
    await db('products').insert([
      { id: 'p1', barcode: '6281007011234', nameAr: 'حليب المراعي طازج 1 لتر', nameEn: 'Almarai Fresh Milk 1L', category: 'أغذية طازجة (Fresh)', costPrice: 4.00, sellingPrice: 6.00, quantity: 45, unit: 'pcs', lowStockThreshold: 15, expiryDate: getFutureDate(4), isPerishable: true },
      { id: 'p2', barcode: '6281007021111', nameAr: 'جبنة المراعي مثلثات 8 قطع', nameEn: 'Almarai Cheese Triangles 8p', category: 'أغذية طازجة (Fresh)', costPrice: 3.50, sellingPrice: 5.00, quantity: 12, unit: 'pack', lowStockThreshold: 15, expiryDate: getFutureDate(25), isPerishable: true },
      { id: 'p3', barcode: '0120000001332', nameAr: 'بيبسي علبة 330 مل', nameEn: 'Pepsi Can 330ml', category: 'مشروبات (Beverages)', costPrice: 1.80, sellingPrice: 2.50, quantity: 180, unit: 'pcs', lowStockThreshold: 30, isPerishable: false },
      { id: 'p4', barcode: '6281013012224', nameAr: 'مياه نوفا 500 مل', nameEn: 'Nova Water 500ml', category: 'مشروبات (Beverages)', costPrice: 0.60, sellingPrice: 1.00, quantity: 350, unit: 'pcs', lowStockThreshold: 50, isPerishable: false },
      { id: 'p5', barcode: '7622300744111', nameAr: 'بسكويت أوريو الأصلي', nameEn: 'Oreo Original Biscuits', category: 'حلويات (Snacks)', costPrice: 1.25, sellingPrice: 2.00, quantity: 95, unit: 'pcs', lowStockThreshold: 20, isPerishable: false },
      { id: 'p6', barcode: '6281101530099', nameAr: 'زيت ذرة عافية 1.5 لتر', nameEn: 'Afia Corn Oil 1.5L', category: 'تموينات (Pantry)', costPrice: 14.50, sellingPrice: 19.50, quantity: 8, unit: 'pcs', lowStockThreshold: 10, isPerishable: false },
      { id: 'p7', barcode: '6281102800115', nameAr: 'أرز بسمتي أبو كاس 5 كجم', nameEn: 'Abu Kass Basmati Rice 5kg', category: 'تموينات (Pantry)', costPrice: 34.00, sellingPrice: 46.00, quantity: 22, unit: 'bag', lowStockThreshold: 5, isPerishable: false },
      { id: 'p8', barcode: '6281009001223', nameAr: 'مناديل فاين عبوة جامبو', nameEn: 'Fine Tissues Jumbo Pack', category: 'منظفات ومستلزمات (Household)', costPrice: 11.50, sellingPrice: 16.00, quantity: 4, unit: 'pack', lowStockThreshold: 8, isPerishable: false },
      { id: 'p9', barcode: '6281101540111', nameAr: 'شاي ليبتون أحمر 100 كيس', nameEn: 'Lipton Red Tea 100 Bags', category: 'تموينات (Pantry)', costPrice: 9.80, sellingPrice: 14.00, quantity: 55, unit: 'box', lowStockThreshold: 15, isPerishable: false },
      { id: 'p10', barcode: '6281007011999', nameAr: 'زبادي المراعي طازج 2 كجم', nameEn: 'Almarai Fresh Yoghurt 2kg', category: 'أغذية طازجة (Fresh)', costPrice: 6.50, sellingPrice: 8.50, quantity: 6, unit: 'pcs', lowStockThreshold: 10, expiryDate: getFutureDate(1), isPerishable: true },
    ]);
  }

  // 4. Suppliers table
  const hasSuppliers = await db.schema.hasTable('suppliers');
  if (!hasSuppliers) {
    console.log('Creating suppliers table...');
    await db.schema.createTable('suppliers', (table) => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.string('phone').notNullable();
      table.string('email').notNullable();
      table.string('vatNumber').nullable();
      table.decimal('balance', 12, 2).notNullable().defaultTo(0);
    });

    // Seed default suppliers
    await db('suppliers').insert([
      { id: 's1', name: 'شركة المراعي (Almarai)', phone: '920000001', email: 'sales@almarai.com', vatNumber: '310123456700003', balance: 4500.00 },
      { id: 's2', name: 'بيبسي كولا السعودية (PepsiCo)', phone: '920000002', email: 'orders@pepsico.com.sa', vatNumber: '310234567800003', balance: 1200.00 },
      { id: 's3', name: 'مجموعة بن زقر (Binzagar)', phone: '920000003', email: 'info@binzagar.com.sa', vatNumber: '310345678900003', balance: 0 },
      { id: 's4', name: 'فاين القابضة (Fine Hygienic)', phone: '920000004', email: 'sales@finehh.com', vatNumber: '310456789000003', balance: -350.00 },
    ]);
  }

  // 5. Purchase Orders table
  const hasPO = await db.schema.hasTable('purchase_orders');
  if (!hasPO) {
    console.log('Creating purchase_orders table...');
    await db.schema.createTable('purchase_orders', (table) => {
      table.string('id').primary();
      table.string('poNumber').unique().notNullable();
      table.string('date').notNullable();
      table.string('supplierId').notNullable();
      table.string('supplierName').notNullable();
      table.decimal('total', 12, 2).notNullable();
      table.string('status').notNullable();
      table.string('receivedDate').nullable();
    });

    // Seed default POs
    await db('purchase_orders').insert([
      {
        id: 'po1',
        poNumber: 'PO-2026-0001',
        date: getDateAgo(12),
        supplierId: 's1',
        supplierName: 'شركة المراعي (Almarai)',
        total: 270.00,
        status: 'received',
        receivedDate: getDateAgo(11)
      },
      {
        id: 'po2',
        poNumber: 'PO-2026-0002',
        date: getDateAgo(2),
        supplierId: 's2',
        supplierName: 'بيبسي كولا السعودية (PepsiCo)',
        total: 180.00,
        status: 'pending'
      }
    ]);
  }

  // 6. Purchase Order Items table
  const hasPOItems = await db.schema.hasTable('purchase_order_items');
  if (!hasPOItems) {
    console.log('Creating purchase_order_items table...');
    await db.schema.createTable('purchase_order_items', (table) => {
      table.increments('id').primary();
      table.string('poId').notNullable().references('id').inTable('purchase_orders').onDelete('CASCADE');
      table.string('productId').notNullable();
      table.string('productNameAr').notNullable();
      table.string('productNameEn').notNullable();
      table.decimal('costPrice', 12, 2).notNullable();
      table.integer('quantity').notNullable();
      table.decimal('total', 12, 2).notNullable();
    });

    // Seed default PO Items
    await db('purchase_order_items').insert([
      { poId: 'po1', productId: 'p1', productNameAr: 'حليب المراعي طازج 1 لتر', productNameEn: 'Almarai Fresh Milk 1L', costPrice: 4.00, quantity: 50, total: 200 },
      { poId: 'po1', productId: 'p2', productNameAr: 'جبنة المراعي مثلثات 8 قطع', productNameEn: 'Almarai Cheese Triangles 8p', costPrice: 3.50, quantity: 20, total: 70 },
      { poId: 'po2', productId: 'p3', productNameAr: 'بيبسي علبة 330 مل', productNameEn: 'Pepsi Can 330ml', costPrice: 1.80, quantity: 100, total: 180 }
    ]);
  }

  // 7. Invoices table
  const hasInvoices = await db.schema.hasTable('invoices');
  if (!hasInvoices) {
    console.log('Creating invoices table...');
    await db.schema.createTable('invoices', (table) => {
      table.string('id').primary();
      table.string('invoiceNumber').unique().notNullable();
      table.string('date').notNullable();
      table.decimal('subtotal', 12, 2).notNullable();
      table.decimal('discountAmount', 12, 2).notNullable().defaultTo(0);
      table.decimal('vatAmount', 12, 2).notNullable();
      table.decimal('total', 12, 2).notNullable();
      table.string('paymentMethod').notNullable();
      table.decimal('cashAmount', 12, 2).nullable();
      table.decimal('cardAmount', 12, 2).nullable();
      table.text('zatcaQrCode').notNullable();
      table.string('cashierId').notNullable();
      table.string('cashierName').notNullable();
    });
  }

  // 8. Invoice Items table
  const hasInvoiceItems = await db.schema.hasTable('invoice_items');
  if (!hasInvoiceItems) {
    console.log('Creating invoice_items table...');
    await db.schema.createTable('invoice_items', (table) => {
      table.increments('id').primary();
      table.string('invoiceId').notNullable().references('id').inTable('invoices').onDelete('CASCADE');
      table.string('productId').notNullable();
      table.string('nameAr').notNullable();
      table.string('nameEn').notNullable();
      table.integer('quantity').notNullable();
      table.decimal('sellingPrice', 12, 2).notNullable();
      table.decimal('costPrice', 12, 2).notNullable();
      table.decimal('discount', 12, 2).notNullable().defaultTo(0);
      table.decimal('taxRate', 5, 2).notNullable().defaultTo(0.15);
      table.decimal('subtotal', 12, 2).notNullable();
      table.decimal('vatAmount', 12, 2).notNullable();
      table.decimal('total', 12, 2).notNullable();
    });
  }

  // 9. Audit Logs table
  const hasAuditLogs = await db.schema.hasTable('audit_logs');
  if (!hasAuditLogs) {
    console.log('Creating audit_logs table...');
    await db.schema.createTable('audit_logs', (table) => {
      table.string('id').primary();
      table.string('timestamp').notNullable();
      table.string('userId').notNullable();
      table.string('userName').notNullable();
      table.string('role').notNullable();
      table.string('action').notNullable();
      table.text('details').notNullable();
    });

    // Seed default logs
    await db('audit_logs').insert([
      { id: 'l1', timestamp: getDateAgo(10), userId: '1', userName: 'المالك (أبو أحمد)', role: 'owner', action: 'STORE_INFO_UPDATE', details: 'Initialized application and set up store configuration.' },
      { id: 'l2', timestamp: getDateAgo(5), userId: '2', userName: 'أحمد العتيبي', role: 'manager', action: 'STOCK_ADJUST', details: 'Added 50 units of Almarai Fresh Milk 1L due to new shipment.' },
    ]);
  }

  // 10. Branches table
  const hasBranches = await db.schema.hasTable('branches');
  if (!hasBranches) {
    console.log('Creating branches table...');
    await db.schema.createTable('branches', (table) => {
      table.string('id').primary();
      table.string('nameAr').notNullable();
      table.string('nameEn').notNullable();
      table.string('location').notNullable();
      table.string('status').notNullable().defaultTo('active');
    });

    // Seed default branches
    await db('branches').insert([
      { id: 'b1', nameAr: 'الفرع الرئيسي', nameEn: 'Main Branch', location: 'الرياض، العليا', status: 'active' },
      { id: 'b2', nameAr: 'فرع الشمال', nameEn: 'North Branch', location: 'الرياض، الملقا', status: 'active' }
    ]);
  }

  console.log('Database auto-migrations and seeding completed successfully!');
}
