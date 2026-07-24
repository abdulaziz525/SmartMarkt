import { db, dbType } from '../config/db.js';

export async function wipeDatabase() {
  console.log('Wiping database...');
  const tables = [
    'invoice_items',
    'invoices',
    'purchase_order_items',
    'purchase_orders',
    'products',
    'suppliers',
    'audit_logs',
    'users',
    'stores',
    'organizations',
    'store_info', // legacy
    'branches'    // legacy
  ];

  if (dbType === 'sqlite') {
    await db.raw('PRAGMA foreign_keys = OFF');
  } else if (dbType === 'mysql') {
    await db.raw('SET FOREIGN_KEY_CHECKS = 0');
  }

  for (const table of tables) {
    if (dbType === 'postgres') {
      await db.raw(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    } else {
      await db.schema.dropTableIfExists(table);
    }
  }

  if (dbType === 'sqlite') {
    await db.raw('PRAGMA foreign_keys = ON');
  } else if (dbType === 'mysql') {
    await db.raw('SET FOREIGN_KEY_CHECKS = 1');
  }
  console.log('Database wiped.');
}

export async function runMigrations() {
  console.log('Checking database tables and running auto-migrations for multi-tenancy...');

  // 1. Organizations table
  const hasOrganizations = await db.schema.hasTable('organizations');
  if (!hasOrganizations) {
    console.log('Creating organizations table...');
    await db.schema.createTable('organizations', (table) => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.timestamp('createdAt').defaultTo(db.fn.now());
    });
  }

  // 2. Stores table (inherits attributes from legacy store_info and branches)
  const hasStores = await db.schema.hasTable('stores');
  if (!hasStores) {
    console.log('Creating stores table...');
    await db.schema.createTable('stores', (table) => {
      table.string('id').primary();
      table.string('nameAr').notNullable();
      table.string('nameEn').notNullable();
      table.string('vatNumber').notNullable();
      table.string('phone').notNullable();
      table.string('address').notNullable();
      table.string('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
      table.string('status').notNullable().defaultTo('active');
    });
  }

  // 3. Users table (adding organization_id, store_id)
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
      table.string('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
      table.string('store_id').nullable().references('id').inTable('stores').onDelete('SET NULL');
      table.text('store_ids').nullable(); // JSON array of store IDs for multi-branch managers
      table.text('permissions').nullable(); // JSON object of permissions
    });
  }

  // 3b. Ensure users table has required multi-tenancy columns (handles legacy/stale schemas)
  const hasOrgIdCol = await db.schema.hasColumn('users', 'organization_id');
  if (!hasOrgIdCol) {
    console.log('Adding organization_id column to existing users table...');
    await db.schema.alterTable('users', (table) => {
      table.string('organization_id').nullable();
    });
  }
  const hasStoreIdCol = await db.schema.hasColumn('users', 'store_id');
  if (!hasStoreIdCol) {
    console.log('Adding store_id column to existing users table...');
    await db.schema.alterTable('users', (table) => {
      table.string('store_id').nullable();
    });
  }
  const hasStoreIdsCol = await db.schema.hasColumn('users', 'store_ids');
  if (!hasStoreIdsCol) {
    console.log('Adding store_ids column to existing users table (for multi-branch managers)...');
    await db.schema.alterTable('users', (table) => {
      table.text('store_ids').nullable(); // JSON array of store IDs
    });
  }
  const hasPermissionsCol = await db.schema.hasColumn('users', 'permissions');
  if (!hasPermissionsCol) {
    console.log('Adding permissions column to existing users table...');
    await db.schema.alterTable('users', (table) => {
      table.text('permissions').nullable(); // JSON object of permissions
    });
  }

  // 4. Products table (adding store_id, composite unique constraint on ['barcode', 'store_id'])
  const hasProducts = await db.schema.hasTable('products');
  if (!hasProducts) {
    console.log('Creating products table...');
    await db.schema.createTable('products', (table) => {
      table.string('id').primary();
      table.string('barcode').notNullable();
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
      table.string('store_id').notNullable().references('id').inTable('stores').onDelete('CASCADE');
      table.unique(['barcode', 'store_id']);
      table.string('supplierId').nullable();
    });
  } else {
    const hasSupplierId = await db.schema.hasColumn('products', 'supplierId');
    if (!hasSupplierId) {
      await db.schema.alterTable('products', table => {
        table.string('supplierId').nullable();
      });
    }
  }

  // 5. Suppliers table (adding store_id)
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
      table.string('store_id').notNullable().references('id').inTable('stores').onDelete('CASCADE');
    });
  }

  // 6. Purchase Orders table (adding store_id, composite unique constraint on ['poNumber', 'store_id'])
  const hasPO = await db.schema.hasTable('purchase_orders');
  if (!hasPO) {
    console.log('Creating purchase_orders table...');
    await db.schema.createTable('purchase_orders', (table) => {
      table.string('id').primary();
      table.string('poNumber').notNullable();
      table.string('date').notNullable();
      table.string('supplierId').notNullable();
      table.string('supplierName').notNullable();
      table.decimal('total', 12, 2).notNullable();
      table.string('status').notNullable();
      table.string('receivedDate').nullable();
      table.string('store_id').notNullable().references('id').inTable('stores').onDelete('CASCADE');
      table.unique(['poNumber', 'store_id']);
      table.string('receivedBy').nullable();
    });
  } else {
    const hasReceivedBy = await db.schema.hasColumn('purchase_orders', 'receivedBy');
    if (!hasReceivedBy) {
      await db.schema.alterTable('purchase_orders', table => {
        table.string('receivedBy').nullable();
      });
    }
  }

  // 7. Purchase Order Items table (adding store_id)
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
      table.string('store_id').notNullable().references('id').inTable('stores').onDelete('CASCADE');
    });
  }

  // 8. Invoices table (adding store_id, composite unique constraint on ['invoiceNumber', 'store_id'])
  const hasInvoices = await db.schema.hasTable('invoices');
  if (!hasInvoices) {
    console.log('Creating invoices table...');
    await db.schema.createTable('invoices', (table) => {
      table.string('id').primary();
      table.string('invoiceNumber').notNullable();
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
      table.string('store_id').notNullable().references('id').inTable('stores').onDelete('CASCADE');
      table.unique(['invoiceNumber', 'store_id']);
    });
  }

  // 9. Invoice Items table (adding store_id)
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
      table.string('store_id').notNullable().references('id').inTable('stores').onDelete('CASCADE');
    });
  }

  // 10. Audit Logs table (adding store_id)
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
      table.string('store_id').nullable().references('id').inTable('stores').onDelete('CASCADE');
    });
  }

  // 11. Customers table
  const hasCustomers = await db.schema.hasTable('customers');
  if (!hasCustomers) {
    console.log('Creating customers table...');
    await db.schema.createTable('customers', (table) => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.string('phone').notNullable();
      table.string('email').notNullable().unique();
      table.string('password').notNullable();
      table.string('nationalAddress').nullable();
      table.string('status').notNullable().defaultTo('active');
      table.timestamp('createdAt').defaultTo(db.fn.now());
    });
  } else {
    const hasNationalAddress = await db.schema.hasColumn('customers', 'nationalAddress');
    if (!hasNationalAddress) {
      await db.schema.alterTable('customers', table => {
        table.string('nationalAddress').nullable();
      });
    }
  }

  // 12. Installment Plans table
  const hasInstallmentPlans = await db.schema.hasTable('installment_plans');
  if (!hasInstallmentPlans) {
    console.log('Creating installment_plans table...');
    await db.schema.createTable('installment_plans', (table) => {
      table.string('id').primary();
      table.string('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE');
      table.string('invoice_id').notNullable().references('id').inTable('invoices').onDelete('CASCADE');
      table.string('store_id').notNullable().references('id').inTable('stores').onDelete('CASCADE');
      table.decimal('total_amount', 12, 2).notNullable();
      table.string('status').notNullable(); // 'ACTIVE', 'COMPLETED', 'DEFAULTED'
      table.timestamp('createdAt').defaultTo(db.fn.now());
    });
  }

  // 13. Installments table
  const hasInstallments = await db.schema.hasTable('installments');
  if (!hasInstallments) {
    console.log('Creating installments table...');
    await db.schema.createTable('installments', (table) => {
      table.string('id').primary();
      table.string('plan_id').notNullable().references('id').inTable('installment_plans').onDelete('CASCADE');
      table.integer('installment_number').notNullable();
      table.decimal('amount', 12, 2).notNullable();
      table.string('due_date').notNullable();
      table.string('status').notNullable(); // 'PENDING', 'PAID', 'OVERDUE'
    });
  }

  // Check if invoices has new columns
  const hasCustomerIdCol = await db.schema.hasColumn('invoices', 'customer_id');
  if (!hasCustomerIdCol) {
    console.log('Adding BNPL columns to invoices table...');
    await db.schema.alterTable('invoices', (table) => {
      table.string('customer_id').nullable().references('id').inTable('customers').onDelete('SET NULL');
      table.string('fulfillment_mode').notNullable().defaultTo('in_store'); // 'in_store', 'pickup', 'delivery'
    });
  }

  const hasIsWebsiteEnabled = await db.schema.hasColumn('stores', 'is_website_enabled');
  if (!hasIsWebsiteEnabled) {
    console.log('Adding is_website_enabled to stores table...');
    await db.schema.alterTable('stores', (table) => {
      table.boolean('is_website_enabled').notNullable().defaultTo(true);
    });
  }

  console.log('Database auto-migrations completed successfully!');
}

export async function resetDatabase() {
  console.log('Resetting database...');
  await wipeDatabase();
  console.log('Database wiped. Re-running migrations...');
  await runMigrations();
  console.log('Database reset complete!');
}

