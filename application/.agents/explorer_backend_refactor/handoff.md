# Verification Report: Database and Backend Multi-Tenancy Refactoring

## 1. Observation
The following file structures and contents were observed in the current codebase:

### A. Routing & Middlewares Setup (`backend/src/app.ts`)
The routes are registered in `backend/src/app.ts` as:
```typescript
32: app.use('/api', authRoutes);
33: 
34: // Protected API Routes
35: app.use('/api', authMiddleware, checkPermissionMiddleware);
36: app.use('/api', statusController);
37: app.use('/api', storeController);
38: app.use('/api', userController);
39: app.use('/api', productController);
...
44: app.use('/api', branchController);
```

### B. Legacy Store Settings and Branches Tables (`backend/src/models/migrations.ts`)
The single global store structure (`store_info`) and branch structure (`branches`) are currently defined as:
```typescript
20:   // 1. Store Info table
21:   const hasStoreInfo = await db.schema.hasTable('store_info');
22:   if (!hasStoreInfo) {
23:     console.log('Creating store_info table...');
24:     await db.schema.createTable('store_info', (table) => {
25:       table.string('vatNumber').primary();
26:       table.string('nameAr').notNullable();
...
233:   // 10. Branches table
234:   const hasBranches = await db.schema.hasTable('branches');
235:   if (!hasBranches) {
236:     console.log('Creating branches table...');
237:     await db.schema.createTable('branches', (table) => {
238:       table.string('id').primary();
239:       table.string('nameAr').notNullable();
...
```

### C. Authentication Middleware Context (`backend/src/middlewares/authMiddleware.ts`)
The existing token decoder extracts properties to `req.user`:
```typescript
15: export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
16:   const token = req.cookies?.token;
...
23:     const decoded = jwt.verify(token, JWT_SECRET);
24:     req.user = decoded;
25:     next();
```

### D. Single-Store Query Configurations in Controllers
The operational data tables (`products`, `suppliers`, `purchase_orders`, `invoices`, `audit_logs`) currently perform query transactions globally:
- `backend/src/controllers/productController.ts` (lines 7-18):
  ```typescript
  router.get('/products', async (req, res) => {
    try {
      const products = await db('products').select('*');
  ```
- `backend/src/controllers/invoiceController.ts` (lines 8-11):
  ```typescript
  router.get('/invoices', async (req, res) => {
    try {
      const invoices = await db('invoices').select('*').orderBy('date', 'desc');
      const allItems = await db('invoice_items').select('*');
  ```
- `backend/src/controllers/supplierController.ts` (lines 7-9):
  ```typescript
  router.get('/suppliers', async (req, res) => {
    try {
      const suppliers = await db('suppliers').select('*');
  ```
- `backend/src/controllers/purchaseOrderController.ts` (lines 7-10):
  ```typescript
  router.get('/purchase-orders', async (req, res) => {
    try {
      const pos = await db('purchase_orders').select('*').orderBy('date', 'desc');
      const allItems = await db('purchase_order_items').select('*');
  ```
- `backend/src/controllers/auditLogController.ts` (lines 7-9):
  ```typescript
  router.get('/audit-logs', async (req, res) => {
    try {
      const logs = await db('audit_logs').select('*').orderBy('timestamp', 'desc');
  ```

---

## 2. Logic Chain
Based on these observations, here is the chain of reasoning for the refactored architecture:

1. **Multi-Store Migration Strategy**:
   - The legacy `store_info` represents a single store globally, and `branches` represents basic entities. To enable SaaS tenancy, we must decommission both tables (Observation B) and replace them with `organizations` and `stores` tables, where an organization has multiple stores.
   - For proper tenant partitioning, the operational transaction tables (`users`, `products`, `suppliers`, `purchase_orders`, `purchase_order_items`, `invoices`, `invoice_items`, `audit_logs`) must be updated with `store_id` (or `organization_id`) foreign keys referencing their respective parent entities.
   - Unique constraints like barcodes and invoice/PO numbers must be composite constraints (`['barcode', 'store_id']`, `['invoiceNumber', 'store_id']`, `['poNumber', 'store_id']`) to allow duplicate barcodes or document sequences across different stores while maintaining uniqueness within a single store context.

2. **Middleware Interception for Access Control**:
   - Authentication (Observation C) decodes tokens into `req.user`. We must include tenant scopes (`organization_id` and `store_id`) in this JWT payload.
   - A new middleware `storeContextMiddleware` is needed to run immediately after `authMiddleware`.
   - For `owner` users, the middleware must inspect the `x-store-id` request header. It will verify in the database that this store belongs to the owner's organization (`req.user.organization_id`), throwing a `403 Forbidden` if unauthorized.
   - For `manager` or `cashier` users, who are restricted to a single store context, the middleware must ignore the header and enforce the hard-scoped `req.user.store_id` property from the token payload.
   - Since `GET /api/stores` is used to load available stores initially (and the owner does not have an active store selected yet), it must be exempted from the header requirement in the middleware logic.

3. **Controller Scope Isolation**:
   - Query scoping in all controllers (Observation D) must include `store_id: req.storeId` for `products`, `invoices`, `suppliers`, `purchase_orders`, and `audit_logs` to ensure complete data isolation.
   - For `users`, query scoping must be restricted by `organization_id: req.user.organization_id` to allow user management across all stores in the organization.

4. **Signup Transaction Integrity**:
   - Creating a tenant requires registering the organization, the first store, and the owner user. To avoid partial states, this setup must execute within an atomic database transaction.
   - To make the system testable and visually rich upon onboarding, sample data (products, suppliers) can be created within the signup transaction, linked to the newly created store.

---

## 3. Caveats
- **Incremental Migrations Limitation**: SQLite does not support direct column alteration or dropping constraints without copying tables. Therefore, a clean schema refactoring requires a full database wipe using the `DB_CLEAN_WIPE=true` flag.
- **Global Usernames**: We assume usernames/emails remain globally unique in the `users` table to maintain simple login flows without requiring an organization identifier at login time.
- **Legacy Entity Decommissioning**: The `branches` endpoints (`/api/branches`) and the `store_info` table must be completely deleted/decommissioned in the code and tests.

---

## 4. Conclusion
Below is the verified implementation plan for backend and database refactoring.

### A. Clean Wipe & Migration Setup (`backend/src/models/migrations.ts`)
Rewrite `runMigrations` and introduce `wipeDatabase` to drop tables in reverse dependency order:
```typescript
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
  } else if (dbType === 'postgres') {
    await db.raw('SET CONSTRAINTS ALL DEFERRED');
  }

  for (const table of tables) {
    await db.schema.dropTableIfExists(table);
  }

  if (dbType === 'sqlite') {
    await db.raw('PRAGMA foreign_keys = ON');
  } else if (dbType === 'mysql') {
    await db.raw('SET FOREIGN_KEY_CHECKS = 1');
  }
  console.log('Database wiped.');
}
```

Define the tables as follows in `runMigrations`:
1. **`organizations`**:
   - `id` (string, primary)
   - `name` (string, not null)
   - `createdAt` (timestamp, default to now)
2. **`stores`**:
   - `id` (string, primary)
   - `nameAr` (string, not null)
   - `nameEn` (string, not null)
   - `vatNumber` (string, not null)
   - `phone` (string, not null)
   - `address` (string, not null)
   - `organization_id` (string, references `organizations(id)` on delete cascade)
   - `status` (string, default 'active')
3. **`users`**:
   - `id` (string, primary)
   - `username` (string, unique, not null)
   - `password` (string, not null)
   - `nameAr` (string, not null)
   - `nameEn` (string, not null)
   - `role` (string, not null)
   - `active` (boolean, default true)
   - `organization_id` (string, references `organizations(id)` on delete cascade)
   - `store_id` (string, nullable, references `stores(id)` on delete set null)
4. **`products`**:
   - Add `store_id` (string, references `stores(id)` on delete cascade)
   - Drop global unique constraint on barcode. Add composite unique constraint `['barcode', 'store_id']`
5. **`suppliers`**:
   - Add `store_id` (string, references `stores(id)` on delete cascade)
6. **`purchase_orders`**:
   - Add `store_id` (string, references `stores(id)` on delete cascade)
   - Drop global unique constraint on `poNumber`. Add composite unique constraint `['poNumber', 'store_id']`
7. **`purchase_order_items`**:
   - Add `store_id` (string, references `stores(id)` on delete cascade)
8. **`invoices`**:
   - Add `store_id` (string, references `stores(id)` on delete cascade)
   - Drop global unique constraint on `invoiceNumber`. Add composite unique constraint `['invoiceNumber', 'store_id']`
9. **`invoice_items`**:
   - Add `store_id` (string, references `stores(id)` on delete cascade)
10. **`audit_logs`**:
    - Add `store_id` (string, nullable, references `stores(id)` on delete cascade)

Integrate this clean wipe command in `backend/src/app.ts`:
```typescript
async function startServer() {
  try {
    if (process.env.DB_CLEAN_WIPE === 'true') {
      await wipeDatabase();
    }
    await runMigrations();
```

### B. `storeContextMiddleware` (`backend/src/middlewares/storeContextMiddleware.ts`)
Create the store context middleware to extract, validate, and inject `req.storeId` into the request:
```typescript
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
  // Exempt routes that do not require store context
  const exemptRoutes = ['/stores', '/stores/'];
  if (exemptRoutes.includes(req.path)) {
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
```

Mount it in `backend/src/app.ts`:
```typescript
app.use('/api', authMiddleware, storeContextMiddleware, checkPermissionMiddleware);
```

### C. POST `/api/auth/signup` (`backend/src/routes/auth.routes.ts`)
Create the registration endpoint to dynamically boot organizations and seed initial demo products:
```typescript
router.post('/auth/signup', async (req, res) => {
  try {
    const { fullName, email, password, organizationName, storeName, vatNumber, phone, address } = req.body;

    if (!fullName || !email || !password || !organizationName || !storeName || !vatNumber || !phone || !address) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await db('users').where({ username: email }).first();
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const orgId = `org-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const storeId = `store-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const userId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newOrg = { id: orgId, name: organizationName };
    const newStore = {
      id: storeId,
      nameAr: storeName,
      nameEn: storeName,
      vatNumber,
      phone,
      address,
      organization_id: orgId,
      status: 'active'
    };
    const newOwner = {
      id: userId,
      username: email,
      password: hashedPassword,
      nameAr: fullName,
      nameEn: fullName,
      role: 'owner',
      active: true,
      organization_id: orgId,
      store_id: storeId
    };

    await db.transaction(async (trx) => {
      await trx('organizations').insert(newOrg);
      await trx('stores').insert(newStore);
      await trx('users').insert(newOwner);

      // Seed default sample data dynamically for the new store context
      const getFutureDate = (days: number): string => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
      };

      const products = [
        { id: `p-${Date.now()}-1`, barcode: '6281007011234', nameAr: 'حليب المراعي طازج 1 لتر', nameEn: 'Almarai Fresh Milk 1L', category: 'أغذية طازجة (Fresh)', costPrice: 4.00, sellingPrice: 6.00, quantity: 45, unit: 'pcs', lowStockThreshold: 15, expiryDate: getFutureDate(4), isPerishable: true, store_id: storeId },
        { id: `p-${Date.now()}-2`, barcode: '6281007021111', nameAr: 'جبنة المراعي مثلثات 8 قطع', nameEn: 'Almarai Cheese Triangles 8p', category: 'أغذية طازجة (Fresh)', costPrice: 3.50, sellingPrice: 5.00, quantity: 12, unit: 'pack', lowStockThreshold: 15, expiryDate: getFutureDate(25), isPerishable: true, store_id: storeId },
        { id: `p-${Date.now()}-3`, barcode: '0120000001332', nameAr: 'بيبسي علبة 330 مل', nameEn: 'Pepsi Can 330ml', category: 'مشروبات (Beverages)', costPrice: 1.80, sellingPrice: 2.50, quantity: 180, unit: 'pcs', lowStockThreshold: 30, isPerishable: false, store_id: storeId }
      ];

      const suppliers = [
        { id: `s-${Date.now()}-1`, name: 'شركة المراعي (Almarai)', phone: '920000001', email: 'sales@almarai.com', vatNumber: '310123456700003', balance: 4500.00, store_id: storeId },
        { id: `s-${Date.now()}-2`, name: 'بيبسي كولا السعودية (PepsiCo)', phone: '920000002', email: 'orders@pepsico.com.sa', vatNumber: '310234567800003', balance: 1200.00, store_id: storeId }
      ];

      await trx('products').insert(products);
      await trx('suppliers').insert(suppliers);

      // Audit Log initialization
      await trx('audit_logs').insert({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        userId: userId,
        userName: fullName,
        role: 'owner',
        action: 'STORE_INFO_UPDATE',
        details: `Initial setup complete. Organization ${organizationName} and store ${storeName} created.`,
        store_id: storeId
      });
    });

    const token = jwt.sign(
      {
        id: userId,
        role: 'owner',
        nameAr: fullName,
        organization_id: orgId,
        store_id: storeId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      id: userId,
      username: email,
      role: 'owner',
      nameAr: fullName,
      organization_id: orgId,
      store_id: storeId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

### D. GET `/api/stores` (`backend/src/controllers/storeController.ts`)
Add the route handler to fetch stores under the user's organization context:
```typescript
router.get('/stores', async (req, res) => {
  try {
    const stores = await db('stores')
      .where({ organization_id: req.user.organization_id })
      .select('*');
    res.json(stores);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
```

Also refactor `/store-info` to handle store context dynamically:
```typescript
router.get('/store-info', async (req, res) => {
  try {
    const store = await db('stores').where({ id: req.storeId }).first();
    res.json(store || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/store-info', async (req, res) => {
  try {
    const { nameAr, nameEn, vatNumber, phone, address } = req.body;
    await db('stores')
      .where({ id: req.storeId })
      .update({ nameAr, nameEn, vatNumber, phone, address });

    if (req.user) {
      await logAudit(
        req.user.id,
        req.user.nameAr,
        req.user.role,
        'STORE_INFO_UPDATE',
        `Updated store name: ${nameAr}, VAT: ${vatNumber}`,
        req.storeId
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
```

### E. Controller Isolation Scoping
All operational data logic must be restricted to the active store identifier:
- **`productController.ts`**:
  - `GET /products` -> `where({ store_id: req.storeId })`
  - `POST /products` -> `where({ id: product.id, store_id: req.storeId })`
  - `DELETE /products/:id` -> `where({ id, store_id: req.storeId })`
  - `POST /products/import-csv` -> `where({ barcode: p.barcode, store_id: req.storeId })`
- **`invoiceController.ts`**:
  - `GET /invoices` -> `where({ store_id: req.storeId })`
  - `POST /invoices` -> Load products using `whereIn('id', ids).andWhere({ store_id: req.storeId })`, update product stock scoping by `store_id: req.storeId`, generate invoice sequence based on invoices count in store (`where({ store_id: req.storeId })`), insert invoice and items linking `store_id: req.storeId`.
- **`supplierController.ts`**:
  - `GET /suppliers` -> `where({ store_id: req.storeId })`
  - `POST /suppliers` -> `where({ id: supplier.id, store_id: req.storeId })`
  - `DELETE /suppliers/:id` -> `where({ id, store_id: req.storeId })`
  - `POST /suppliers/:id/pay` -> `where({ id, store_id: req.storeId })`
- **`purchaseOrderController.ts`**:
  - `GET /purchase-orders` -> `where({ store_id: req.storeId })`
  - `POST /purchase-orders` -> `where({ id: po.id, store_id: req.storeId })`
  - `POST /purchase-orders/:id/receive` -> `where({ id, store_id: req.storeId })`, updating products and suppliers scoping by `store_id: req.storeId`.
- **`userController.ts`**:
  - `GET /users` -> `where({ organization_id: req.user.organization_id })`
- **`auditLogController.ts`**:
  - `GET /audit-logs` -> `where({ store_id: req.storeId })`
  - `POST /audit-logs` -> Log audit passing `req.storeId`.

---

## 5. Verification Method
Verify the refactoring implementation via the following:
1. **TypeScript Build**:
   Navigate to the workspace root and compile the backend to verify that no compilation or type errors exist:
   ```bash
   cd backend && npm run build
   ```
2. **Schema Verification**:
   Ensure migrations construct the tables with appropriate constraints by inspecting the SQLite schema (or equivalent DB schema):
   ```bash
   sqlite3 backend/database.sqlite ".schema"
   ```
   Verify that `organizations` and `stores` exist, and that `store_id` or `organization_id` foreign keys exist across all operational tables.
3. **Execution Verification**:
   Set `DB_CLEAN_WIPE=true` and start the server:
   ```bash
   DB_CLEAN_WIPE=true JWT_SECRET=testsecret PORT=3001 npm run dev
   ```
   Submit the onboarding payload to `/api/auth/signup` and confirm that:
   - The transaction completes atomically.
   - The owner account, organization, and store are successfully registered.
   - Sample products and suppliers are populated in the database.
   - The HTTP response sets a secure `token` cookie containing the tenant context (`organization_id` and `store_id`).
