# Handoff Report: SmartMarkt Backend API Inventory for E2E Testing

## 1. Observation

During read-only inspection of the SmartMarkt backend codebase, the following files and directories were examined:
*   `backend/src/app.ts` (Express server setup, route imports, and middleware declarations)
*   `backend/src/routes/auth.routes.ts` (Authentication endpoints)
*   `backend/src/controllers/` (status, store, user, product, supplier, purchaseOrder, invoice, auditLog, and branch controllers)
*   `backend/src/middlewares/authMiddleware.ts` (JWT extraction and verification)
*   `backend/src/middlewares/checkPermissionMiddleware.ts` (Role-based access control rules)
*   `backend/src/models/migrations.ts` (Knex schema migrations and seed configurations)
*   `backend/src/services/zatca.ts` (ZATCA compliant Base64 QR code generation)
*   `backend/src/services/audit.ts` (Audit logger service)
*   `frontend/src/services/api.ts` (Frontend API utility matching backend routes)
*   `frontend/src/types.ts` (TypeScript interfaces for data shapes)

Direct observations:
1.  **Server Route Registry (`backend/src/app.ts` lines 31-45):**
    ```typescript
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
    ```
2.  **Role Access Restrictions (`backend/src/middlewares/checkPermissionMiddleware.ts` lines 13-39):**
    *   `owner` bypasses checks:
        ```typescript
        if (role === 'owner') { return next(); }
        ```
    *   `cashier` is restricted to POST/GET on `/api/invoices` and GET on `/api/products`:
        ```typescript
        if (role === 'cashier') {
          const isPOSRelated = path.startsWith('/api/invoices') || 
                               (path.startsWith('/api/products') && method === 'GET');
          if (!isPOSRelated) {
            return res.status(403).json({ error: 'Forbidden: Cashiers only have access to POS' });
          }
          return next();
        }
        ```
    *   `manager` is restricted from accessing `/api/users`, `/api/branches`, and non-GET requests on `/api/store`:
        ```typescript
        if (role === 'manager') {
          const isRestricted = path.startsWith('/api/users') || 
                               path.startsWith('/api/branches') || 
                               (path.startsWith('/api/store') && method !== 'GET');
          if (isRestricted) {
            return res.status(403).json({ error: 'Forbidden: Branch Managers cannot access this resource' });
          }
          return next();
        }
        ```
3.  **Database Migration Table Definitions (`backend/src/models/migrations.ts` lines 20-254):**
    *   The migrations file creates 10 tables: `store_info`, `users`, `products`, `suppliers`, `purchase_orders`, `purchase_order_items`, `invoices`, `invoice_items`, `audit_logs`, and `branches`.
    *   Neither the `products`, `suppliers`, `purchase_orders`, `invoices`, nor `audit_logs` tables reference a `branchId` or `storeId` foreign key.
    *   All queries in `productController.ts`, `invoiceController.ts`, etc. fetch or update elements globally (e.g., `db('products').select('*')`). No request headers such as `x-store-id` are parsed or checked inside the backend codebase.

---

## 2. Logic Chain

1.  **Role-Based Testing Matrix:** Since `checkPermissionMiddleware.ts` enforces strict route-level rules for roles (`owner`, `manager`, `cashier`), E2E testing must verify permissions matrix coverage. Any attempt by a `cashier` to perform modifications on products, suppliers, purchase orders, or branches must result in a `403 Forbidden` status.
2.  **State Transactions:** Endpoints like `/api/invoices` (POST) and `/api/purchase-orders/:id/receive` (POST) mutate multiple tables (`products`, `suppliers`/`invoices`, `audit_logs`). E2E testing must verify that:
    *   Creating an invoice decrements product inventory stock levels correctly and records a `SALES_CHECKOUT` action in `audit_logs`.
    *   If final product stock drops below `lowStockThreshold`, a secondary `STOCK_ALERT` entry is written to `audit_logs`.
    *   Receiving a purchase order increments product quantity, updates product `costPrice` to the new cost price specified in the order, updates the supplier's balance (`balance = balance + poTotal`), and records `PO_RECEIVE` in `audit_logs`.
3.  **Store Switching/Isolation:** The request explicitly mentions testing store isolation via an `x-store-id` header. However, our direct observation of `migrations.ts` and the controller files indicates that no `x-store-id` or branch-level isolation is currently wired in queries. Consequently:
    *   We conclude the current application is a single-tenant design.
    *   E2E isolation testing is not natively supported by the current codebase schema.
    *   If multi-tenant isolation is added later, testing must verify that adding `x-store-id` headers returns only scoped datasets and rejects unauthorized access between different store IDs.

---

## 3. Caveats

*   **No Current Store/Branch Isolation:** As noted in the Logic Chain, the backend database tables lack `storeId` or `branchId` columns. The branches CRUD exists but behaves as a separate standalone entity. Store isolation testing via `x-store-id` headers cannot be verified against the current codebase since it does not process this header or filter tables by store/branch.
*   **Static ZATCA Logic:** The ZATCA Base64 QR code generation in `zatca.ts` uses Tag-Length-Value (TLV) encoding which is standard. E2E tests checking the output must base64-decode the output and check TLV structure manually.
*   **Authentication Cookie Dependency:** Authentication is verified using an HTTP-only cookie named `token`. E2E tests must maintain session states (cookie persistence) across requests.
*   **Absence of Test Suites:** There is no existing framework (like Jest, Supertest, or Playwright) configured in either `backend/package.json` or root `package.json`. Tests must be executed against a running server.

---

## 4. Conclusion

Below is the complete API feature inventory requiring E2E testing:

### Feature Inventory for E2E Testing

| Feature Group | Endpoint URL | Method | Payload Fields | Response Format | Role Permissions | Behavior to Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth Status** | `/api/auth/status` | `GET` | None | `{ isSetupComplete: boolean }` | Public | Returns `false` on empty DB; `true` if users exist. |
| **First-Time Setup** | `/api/auth/setup` | `POST` | `fullName`, `email`, `password`, `nameAr`, `nameEn`, `vatNumber`, `phone`, `address` | Sanitized user object, sets `token` cookie | Public (fails with 403 if users exist) | Enforces owner user creation and `store_info` seeding in transaction. |
| **Login** | `/api/auth/login` | `POST` | `username`, `password` | Sanitized user object, sets `token` cookie | Public | Validates credentials via bcrypt, cookie injection. |
| **Logout** | `/api/auth/logout` | `POST` | None | `{ message: string }` | Public | Clears `token` cookie. |
| **Auth Verification** | `/api/auth/verify` | `GET` | None (reads cookie) | Decoded JWT payload token | Public | Rejects requests with missing or tampered cookies. |
| **Register Cashier** | `/api/auth/register` | `POST` | `username`, `email`, `password`, `id` (optional) | Sanitized user object, sets `token` cookie | Public (Should be Protected) | Automatically assigns `role: 'cashier'` and prevents duplicate usernames. |
| **Store Info - Get** | `/api/store-info` | `GET` | None | `{ vatNumber, nameAr, nameEn, phone, address }` | Owner, Manager | Returns store configuration. Cashiers receive 403. |
| **Store Info - Update** | `/api/store-info` | `PUT` | `nameAr`, `nameEn`, `vatNumber`, `phone`, `address` | `{ success: true }` | Owner | Updates store settings. Managers/Cashiers receive 403. Audit log written. |
| **Branches - List** | `/api/branches` | `GET` | None | Array of Branch objects | Owner | Returns all branches. Managers/Cashiers receive 403. |
| **Branches - Save** | `/api/branches` | `POST` | `{ branch: { id, nameAr, nameEn, location, status } }` | Saved branch object | Owner | Creates or updates a branch. Generates `BRANCH_CREATE` or `BRANCH_UPDATE` logs. |
| **Branches - Delete** | `/api/branches/:id` | `DELETE` | None | `{ success: true }` | Owner | Deletes branch. Logs `BRANCH_DELETE`. |
| **Users - List** | `/api/users` | `GET` | None | Array of User objects | Owner | Returns database users (excluding passwords). Managers/Cashiers receive 403. |
| **Products - List** | `/api/products` | `GET` | None | Array of sanitized Product objects | Owner, Manager, Cashier | Returns all items (numeric conversions verified). |
| **Products - Save** | `/api/products` | `POST` | `{ product: { id, barcode, nameAr, ... } }` | Saved product object | Owner, Manager | Creates/updates products. Logs `PRODUCT_CREATE`/`PRODUCT_UPDATE`. Cashiers get 403. |
| **Products - Delete** | `/api/products/:id` | `DELETE` | None | `{ success: true }` | Owner, Manager | Deletes product. Logs `PRODUCT_DELETE`. Cashiers get 403. |
| **Products - CSV Import**| `/api/products/import-csv`| `POST` | `{ productsList: Product[] }` | `{ successCount: number }` | Owner, Manager | Bulk inserts/updates by barcode in database transaction. Logs `PRODUCT_IMPORT`. |
| **Invoices - List** | `/api/invoices` | `GET` | None | Array of detailed Invoice objects | Owner, Manager, Cashier | Returns all invoices sorted by date desc with nested items. |
| **Invoices - Checkout** | `/api/invoices` | `POST` | `{ items: CartItem[], paymentMethod, paymentDetails }` | Created Invoice object | Owner, Manager, Cashier | Decrements stock, generates ZATCA base64 QR, logs `SALES_CHECKOUT`, generates `STOCK_ALERT` if stock low. |
| **Suppliers - List** | `/api/suppliers` | `GET` | None | Array of Supplier objects | Owner, Manager | Returns all suppliers. Cashiers receive 403. |
| **Suppliers - Save** | `/api/suppliers` | `POST` | `{ supplier: { id, name, ... } }` | Saved supplier object | Owner, Manager | Creates/updates supplier. Logs `SUPPLIER_CREATE`/`SUPPLIER_UPDATE`. Cashiers get 403. |
| **Suppliers - Delete** | `/api/suppliers/:id` | `DELETE` | None | `{ success: true }` | Owner, Manager | Deletes supplier. Logs `SUPPLIER_DELETE`. Cashiers get 403. |
| **Suppliers - Pay** | `/api/suppliers/:id/pay` | `POST` | `{ amount: number }` | `{ success: true }` | Owner, Manager | Decrements supplier balance. Logs `SUPPLIER_PAYMENT`. Cashiers get 403. |
| **Purchase Orders - List**| `/api/purchase-orders` | `GET` | None | Array of detailed PO objects | Owner, Manager | Returns all POs with items. Cashiers receive 403. |
| **Purchase Orders - Save**| `/api/purchase-orders` | `POST` | `{ po: { id, poNumber, ... } }` | Saved PO object | Owner, Manager | Re-creates PO items inside a transaction. Logs `PO_CREATE`/`PO_UPDATE`. Cashiers get 403. |
| **Purchase Orders - Recv**| `/api/purchase-orders/:id/receive`| `POST` | None | `{ success: true }` | Owner, Manager | Transitions status to `received`, updates product stock & cost price, increments supplier balance. Logs `PO_RECEIVE`. Cashiers get 403. |
| **Audit Logs - List** | `/api/audit-logs` | `GET` | None | Array of AuditLog objects | Owner, Manager | Returns all audit logs. Cashiers receive 403. |
| **Audit Logs - Create** | `/api/audit-logs` | `POST` | `{ action, details }` | `{ success: true }` | Owner, Manager | Inserts audit log using user context. Cashiers receive 403. |

---

## 5. Verification Method

### 1. Verification of Role Permissions
Verify that the `checkPermissionMiddleware` acts as expected by invoking API endpoints using cookies of different roles:
*   **Owner Session:** Should access all endpoints without restrictions.
*   **Manager Session:**
    *   Attempting `GET /api/users` must return a `403 Forbidden` with body:
        ```json
        { "error": "Forbidden: Branch Managers cannot access this resource" }
        ```
    *   Attempting `PUT /api/store-info` must return the same `403 Forbidden` message.
*   **Cashier Session:**
    *   Attempting `GET /api/suppliers` or `POST /api/products` must return a `403 Forbidden` with body:
        ```json
        { "error": "Forbidden: Cashiers only have access to POS" }
        ```

### 2. Transaction Integrity & Business Logic Verification
Verify correctness of inventory mutations:
*   **Sales Checkout (POST `/api/invoices`):**
    1.  Inspect quantity of a product (e.g. quantity = 10, lowStockThreshold = 5).
    2.  Place checkout order for 6 units.
    3.  Verify that response returns 200 OK with correct subtotal, tax rate (0.15), vatAmount (subtotal * 0.15), and total.
    4.  Verify that product quantity in the database has decreased to 4.
    5.  Verify that `audit_logs` table has two new entries: `SALES_CHECKOUT` and `STOCK_ALERT` (since final quantity 4 <= lowStockThreshold 5).
*   **PO Receiving (POST `/api/purchase-orders/:id/receive`):**
    1.  Create a pending purchase order.
    2.  Verify supplier's current `balance` (e.g., 1000 SAR) and product's current `quantity` (e.g., 20).
    3.  Invoke the receive endpoint.
    4.  Verify that product's database quantity has increased by the order amount and the product's `costPrice` is set to the order's `costPrice`.
    5.  Verify that supplier's `balance` has increased by the purchase order's total.
    6.  Verify that repeating the POST request on the same PO ID fails with an error.

### 3. ZATCA base64 Validation
Decode the returned `zatcaQrCode` string using a ZATCA TLV parser (or manual buffer hex check) to confirm:
*   Tag 1 contains the store Arabic name (`nameAr` from `store_info`).
*   Tag 2 contains the `vatNumber`.
*   Tag 3 contains the checkout ISO date timestamp.
*   Tag 4 contains the checkout invoice total.
*   Tag 5 contains the checkout VAT amount.
