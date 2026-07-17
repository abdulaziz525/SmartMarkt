# Scope: Backend Database & API Refactor

## Architecture
- **Multi-Tenant Model**: Shared database model using SQLite. Data is partitioned using a `store_id` foreign key.
- **Tenant Context**: An Organization contains multiple Stores. Users belong to an Organization (`organization_id`).
- **Access Scoping**:
  - `owner`: Access to all stores in the organization. Can switch active store context.
  - `manager` / `cashier`: Scoped to a specific store context (or assigned store).
- **Backend API**: Enforces data isolation. Reads active `store_id` (via `x-store-id` request header or context) and scopes all queries to that `store_id`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Plan Verification | Spawn Explorer to verify refactoring plan and check codebase constraints | None | DONE (Conv: 4e8fe669-273f-4b73-8c32-cc344c857782) |
| 2 | Migration Refactoring | Wipe DB and refactor migrations for tables organizations, stores, users, products, suppliers, purchase_orders, purchase_order_items, invoices, invoice_items, audit_logs | M1 | DONE (Conv: 3e7f5da5-3229-44e7-9802-d0b2ad01b268) |
| 3 | Store Context Middleware | Introduce storeContextMiddleware and inject it into app.ts | M2 | DONE (Conv: 3e7f5da5-3229-44e7-9802-d0b2ad01b268) |
| 4 | Controller Scoping | Scope queries in products, invoices, suppliers, purchase orders, audit logs, and users controllers | M3 | DONE (Conv: 3e7f5da5-3229-44e7-9802-d0b2ad01b268) |
| 5 | Signup Transaction API | Implement POST /api/auth/signup atomic transaction returning token | M3 | DONE (Conv: 3e7f5da5-3229-44e7-9802-d0b2ad01b268) |
| 6 | Fetch Stores API | Implement GET /api/stores endpoint | M3 | DONE (Conv: 3e7f5da5-3229-44e7-9802-d0b2ad01b268) |
| 7 | Verification & Auditing | Run compilation, data isolation tests, and Forensic Auditing | M4, M5, M6 | BLOCKED: defects found (deadlocks, BOLA, password leak, logout bypass). Fixing under Conv: 726afbb2-de20-4ca7-a2c0-54f479188b9e |

## Interface Contracts
### GET /api/stores
- Response: `[{ id, nameAr, nameEn, vatNumber, phone, address, organization_id }]`
### POST /api/auth/signup
- Payload: `{ fullName, email, password, organizationName, storeName, vatNumber, phone, address }`
- Response: `{ id, username, role, nameAr, organization_id }` plus HTTP cookie `token`
