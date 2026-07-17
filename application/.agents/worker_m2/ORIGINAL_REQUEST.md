## 2026-07-17T02:39:48Z
You are the E2E API Test Suite Worker (Role: teamwork_preview_worker).
Your working directory is: /Users/abdulaziz/Library/Mobile Documents/com~apple~CloudDocs/00_Projects/WMP/SmartMarkt/application/.agents/worker_m2

Your task is to implement the E2E API Test Suite for the SmartMarkt multi-tenant SaaS refactoring (Milestone 2).
Specifically:
1. In the `e2e` directory at the project root, create helper files under `e2e/helpers/`:
   - `db.ts`: Contains a `beforeEach` hook or helper function that makes a POST request to `/api/test/reset` to reset the database before each test.
   - `fixtures.ts` (or auth helper): Contains utility functions to register and authenticate users, returning their cookies and headers (such as `x-store-id`).
2. Write E2E API tests under `e2e/api/` using Playwright's `APIRequestContext` (`request` fixture):
   - `auth.spec.ts`: Tests setup complete status, the new multi-step signup endpoint `POST /api/auth/signup` (with correct payload fields: fullName, email, password, organizationName, storeName, vatNumber, phone, address), duplicate email validation, password mismatch, login `POST /api/auth/login`, and logout `POST /api/auth/logout`.
   - `stores.spec.ts`: Tests `GET /api/stores` returning stores associated with the user's organization.
   - `products.spec.ts`: Tests CRUD operations on `/api/products` (GET, POST, DELETE) and bulk CSV imports (`POST /api/products/import-csv`).
   - `invoices.spec.ts`: Tests POS checkouts (`POST /api/invoices`), stock decrementing, audit log generation (SALES_CHECKOUT, STOCK_ALERT), and ZATCA QR code generation.
   - `suppliers.spec.ts`: Tests supplier CRUD, settling supplier balance (`POST /api/suppliers/:id/pay`), purchase orders (`POST /api/purchase-orders`), and receiving POs (`POST /api/purchase-orders/:id/receive`).
   - `isolation.spec.ts`: Verifies strict multi-tenant data isolation:
     - Sign up Owner A (Organization A, Store A).
     - Sign up Owner B (Organization B, Store B).
     - Attempt to access Store B's products/invoices/suppliers/purchase orders/audit logs with Owner A's session token and `x-store-id` set to Store B.
     - Verify that the backend rejects these cross-tenant requests with `403 Forbidden`.
3. Verify that all test files compile cleanly without TypeScript errors (you can run `npx tsc -p tsconfig.json` or check E2E folder compilation).
4. Note: Since the backend is currently undergoing refactoring by another track, the tests you write are expected to fail on the current backend (which is still single-tenant). This is normal. Write the tests according to the required multi-tenant interface contract in PROJECT.md.
5. Write your handoff report to `handoff.md` in your working directory.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
