# Codebase Exploration Handoff Report: SmartMarkt SaaS Multi-Tenant Refactoring

## 1. Observation
Below are the exact database tables, Express controllers, middleware, and frontend files observed in the current codebase that are relevant to the multi-tenant SaaS refactoring.

### Database Tables and Schema (backend/src/models/migrations.ts)
The database tables are currently created sequentially using Knex. The current tables and constraints are defined in lines 20–251 of `backend/src/models/migrations.ts`:
- **`store_info`** (Lines 20–33):
  ```typescript
  table.string('vatNumber').primary();
  table.string('nameAr').notNullable();
  table.string('nameEn').notNullable();
  table.string('phone').notNullable();
  table.string('address').notNullable();
  ```
- **`users`** (Lines 35–50):
  ```typescript
  table.string('id').primary();
  table.string('username').unique().notNullable();
  table.string('password').notNullable();
  table.string('nameAr').notNullable();
  table.string('nameEn').notNullable();
  table.string('role').notNullable();
  table.boolean('active').notNullable().defaultTo(true);
  ```
- **`products`** (Lines 52–84):
  ```typescript
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
  ```
- **`suppliers`** (Lines 86–106):
  ```typescript
  table.string('id').primary();
  table.string('name').notNullable();
  table.string('phone').notNullable();
  table.string('email').notNullable();
  table.string('vatNumber').nullable();
  table.decimal('balance', 12, 2).notNullable().defaultTo(0);
  ```
- **`purchase_orders`** (Lines 108–145):
  ```typescript
  table.string('id').primary();
  table.string('poNumber').unique().notNullable();
  table.string('date').notNullable();
  table.string('supplierId').notNullable();
  table.string('supplierName').notNullable();
  table.decimal('total', 12, 2).notNullable();
  table.string('status').notNullable();
  table.string('receivedDate').nullable();
  ```
- **`purchase_order_items`** (Lines 147–168):
  ```typescript
  table.increments('id').primary();
  table.string('poId').notNullable().references('id').inTable('purchase_orders').onDelete('CASCADE');
  table.string('productId').notNullable();
  table.string('productNameAr').notNullable();
  table.string('productNameEn').notNullable();
  table.decimal('costPrice', 12, 2).notNullable();
  table.integer('quantity').notNullable();
  table.decimal('total', 12, 2).notNullable();
  ```
- **`invoices`** (Lines 170–189):
  ```typescript
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
  ```
- **`invoice_items`** (Lines 191–210):
  ```typescript
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
  ```
- **`audit_logs`** (Lines 212–231):
  ```typescript
  table.string('id').primary();
  table.string('timestamp').notNullable();
  table.string('userId').notNullable();
  table.string('userName').notNullable();
  table.string('role').notNullable();
  table.string('action').notNullable();
  table.text('details').notNullable();
  ```
- **`branches`** (Lines 233–251):
  ```typescript
  table.string('id').primary();
  table.string('nameAr').notNullable();
  table.string('nameEn').notNullable();
  table.string('location').notNullable();
  table.string('status').notNullable().defaultTo('active');
  ```

### Express Middleware and Routing Context (backend/src/app.ts)
Express routing setup is defined in `backend/src/app.ts`:
- Public routes are registered under `/api` in line 32: `app.use('/api', authRoutes);`.
- Protected routes are registered after injecting authentication and permission check middlewares in lines 35–44:
  ```typescript
  app.use('/api', authMiddleware, checkPermissionMiddleware);
  app.use('/api', statusController);
  app.use('/api', storeController);
  ...
  ```
- The current `authMiddleware.ts` parses the cookie-based token and assigns the payload to `req.user` in line 24 of `backend/src/middlewares/authMiddleware.ts`: `req.user = decoded;`.

### Frontend Setup & State Configuration (frontend/src/)
- **`frontend/src/services/api.ts`** (Lines 17–29): The `request` helper currently issues requests using a JSON header but does not include any store headers:
  ```typescript
  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...options,
    });
    ...
  ```
- **`frontend/src/features/auth/SetupPage.tsx`** (Lines 10–53): SetupPage is currently implemented as a 2-step wizard. Step 1 gathers user data (`fullName`, `email`, `password`), and Step 2 gathers store data (`nameAr`, `nameEn`, `vatNumber`, `phone`, `address`) before executing `apiService.setupStore(...)`.
- **`frontend/src/App.tsx`** (Lines 648–661): The top header currently binds to `storeInfo` statically:
  ```typescript
  <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
    {lang === 'ar' ? storeInfo?.nameAr : storeInfo?.nameEn}
  </h1>
  <p className="text-xs text-slate-400 font-mono">
    VAT: {storeInfo?.vatNumber}
  </p>
  ```

---

## 2. Logic Chain
Based on these observations, here is the reasoning leading to the recommended refactoring architecture:

1. **Multi-Store Mapping & Isolation**:
   - Currently, `store_info` represents a single global store, and `branches` represents basic entities. To transition to SaaS, an organization must support multiple stores.
   - We must deprecate `store_info` and `branches`, and create `organizations` and `stores` tables, where `stores` belongs to `organizations` via `organization_id`.
   - To partition data per store, tables storing operational transaction records (`products`, `suppliers`, `purchase_orders`, `invoices`, `audit_logs`) must possess a `store_id` foreign key referencing `stores(id)`.
   - Global constraints like product barcodes (`products.barcode`) must be unique *only within the scope of a single store*, requiring the replacement of the global unique barcode constraint with a composite index constraint `['barcode', 'store_id']`.

2. **Backend Authentication & Request Context Integration**:
   - `authMiddleware` must be updated to decode and attach the tenant context (`organization_id`, `store_id` if manager/cashier) onto `req.user`.
   - A new `storeContextMiddleware` is required for protected endpoints. It must extract the `x-store-id` header.
   - For an `owner` user, it must check if the requested `x-store-id` belongs to the owner's `organization_id` (database verification) and set `req.storeId = xStoreId`.
   - For `manager` / `cashier` users, who are restricted to a single store context, the middleware must ignore the header and enforce `req.storeId = req.user.store_id` (hard-scoped).
   - The `/api/stores` endpoints must be exempt from needing the `x-store-id` header to allow owners to bootstrap stores and switch contexts initially.

3. **Frontend Integration & Global Context**:
   - The frontend needs to pass the context down. The `api.ts` `request` helper should look up `localStorage.getItem('activeStoreId')` and conditionally add the `x-store-id` header on all non-auth requests.
   - In `App.tsx`, we must manage `activeStoreId`. When authentication succeeds:
     - For `owner`: Load `activeStoreId` from local storage. If not found or invalid, default to the first store returned by `apiService.getStores()` and store it.
     - For `manager` or `cashier`: Hard-set `activeStoreId` to `currentUser.store_id`.
     - Trigger `refreshData()` to reload all state whenever `activeStoreId` switches.
   - In the header, render a dropdown store switcher if `currentUser.role === 'owner'`.
   - Update `SetupPage.tsx` to handle a 3-step signup wizard (User details -> Organization Name -> First Store Details) to call `/api/auth/signup` and register the first tenant context.

---

## 3. Caveats
- **Branch Management Decommissioning**: This report assumes that the legacy `branches` model and its endpoint (`/api/branches`) will be fully replaced by the `/api/stores` multi-store architecture.
- **SQLite Performance**: While SQLite supports composite unique constraints, it doesn't support direct modification of columns or drop-constraints (without copying the table). When writing migrations in Knex, dropping table structures and rebuilding them or writing schema updates using `PRAGMA foreign_keys = OFF` is required.
- **Global User Registry**: We assume usernames/emails remain globally unique in the database to keep login simple and direct, avoiding the need for an organization identifier at login time.

---

## 4. Conclusion

### A. Migration Changes (`backend/src/models/migrations.ts`)
To align the database schema with the multi-tenant architecture, update `runMigrations` to perform the following:
1. **Create `organizations`**:
   ```typescript
   await db.schema.createTable('organizations', (table) => {
     table.string('id').primary();
     table.string('name').notNullable();
     table.timestamp('createdAt').defaultTo(db.fn.now());
   });
   ```
2. **Create `stores`** (replacing `store_info` and `branches`):
   ```typescript
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
   ```
3. **Update `users`**:
   ```typescript
   table.string('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
   table.string('store_id').nullable().references('id').inTable('stores').onDelete('SET NULL');
   ```
4. **Update `products`**:
   - Add `store_id`: `table.string('store_id').notNullable().references('id').inTable('stores').onDelete('CASCADE');`
   - Replace `table.string('barcode').unique()` with `table.string('barcode').notNullable()` and add: `table.unique(['barcode', 'store_id']);`
5. **Update `suppliers`, `purchase_orders`, `invoices`**:
   - Add `store_id`: `table.string('store_id').notNullable().references('id').inTable('stores').onDelete('CASCADE');`
6. **Update `audit_logs`**:
   - Add `store_id` (nullable): `table.string('store_id').nullable().references('id').inTable('stores').onDelete('CASCADE');`

### B. Backend Controller Scoping
- **Middleware Integration**:
  Create `storeContextMiddleware` to resolve and validate `req.storeId` from headers or token role. Inject it in `app.ts` before the controllers:
  ```typescript
  app.use('/api', authMiddleware, storeContextMiddleware, checkPermissionMiddleware);
  ```
- **Query Scoping**:
  - `productController.ts`: Add `.where({ store_id: req.storeId })` on GET `/products`, GET `/products/:id`, and during the loop in POST `/products/import-csv`.
  - `invoiceController.ts`: Look up active store using `await db('stores').where({ id: req.storeId }).first()` to generate ZATCA invoices. Scope all queries (invoices, invoice_items, count operations) using `store_id: req.storeId`.
  - `supplierController.ts` & `purchaseOrderController.ts`: Scope all listings, inserts, updates, and balance modifications with `.where({ store_id: req.storeId })`.
  - `userController.ts`: Scope all listings by `.where({ organization_id: req.user.organization_id })`.
  - `auth.routes.ts`: Add `POST /auth/signup` that registers organization, store, and user in a transaction. Ensure `token` payload packs `organization_id` and `store_id`.

### C. Frontend SaaS Integration
- **`api.ts`**:
  ```typescript
  const activeStoreId = localStorage.getItem('activeStoreId');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeStoreId && !path.includes('/auth/')) {
    headers['x-store-id'] = activeStoreId;
  }
  ```
- **`SetupPage.tsx`**: Add a 3-step layout.
  - Step 1: Owner Details (`fullName`, `email`, `password`)
  - Step 2: Organization Name (`organizationName`)
  - Step 3: First Store details (`storeName`, `vatNumber`, `phone`, `address`)
  Post data to `/api/auth/signup`.
- **`App.tsx`**: Expose a Store Switcher dropdown in the top header if `currentUser.role === 'owner'`. Maintain an `activeStoreId` in the root state. In `useEffect` hook listening to `activeStoreId`, trigger `refreshData()` to reload store-specific items on switch.

### D. Clean DB Wipe & Recreate Recommendation
To cleanly wipe and recreate the database on server start:
1. Add an env variable `DB_CLEAN_WIPE=true` in `backend/src/.env`.
2. Add a helper function `wipeDatabase()` in `backend/src/models/migrations.ts` that executes dropping of tables in reverse dependency order:
   ```typescript
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
3. Call `wipeDatabase()` in `app.ts` right before running migrations:
   ```typescript
   if (process.env.DB_CLEAN_WIPE === 'true') {
     await wipeDatabase();
   }
   await runMigrations();
   ```

---

## 5. Verification Method
Verify the refactoring implementation via the following:
1. **Compilation**: Run `npm run build` from the workspace root to verify that no TypeScript compilation errors exist.
2. **Schema Audit**: Verify SQLite schema using:
   ```bash
   sqlite3 backend/database.sqlite ".schema"
   ```
   Inspect that `organizations` and `stores` tables are created, and `products`, `invoices`, `suppliers`, `purchase_orders`, `users`, `audit_logs` all contain a `store_id` / `organization_id` foreign key.
3. **Integration Test Flow**:
   - Set `DB_CLEAN_WIPE=true` in `backend/.env`.
   - Start backend server: `npm run dev:backend`. Ensure log outputs "Wiping database..." followed by table generation logs.
   - Open browser, navigate to the system. Confirm redirect to setup page.
   - Walk through the 3-step signup wizard, complete it, and verify that the backend registers the organization, store, and user in the database, and stores the cookie.
   - Create some products and invoices.
   - Add a second store in "Store Management" / Settings.
   - Switch to the new store using the header store switcher. Confirm that products and invoice lists clear, and adding a product or checkout in the new store creates isolated records linked to the new `store_id`.
