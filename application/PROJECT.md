# Project: SmartMarkt SaaS Refactoring

## Architecture
- **Multi-Tenant Model**: Shared database model using SQLite. Data is partitioned using a `store_id` foreign key.
- **Tenant Context**: An Organization contains multiple Stores. Users belong to an Organization (`organization_id`).
- **Access Scoping**:
  - `owner`: Access to all stores in the organization. Can switch active store context.
  - `manager` / `cashier`: Scoped to a specific store context (or assigned store).
- **Backend API**: Enforces data isolation. Reads active `store_id` (via `x-store-id` request header or context) and scopes all queries to that `store_id`.
- **Frontend App**: Stores active store in global context. Displays store switcher in header. Updates UI when store changes.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Test Suite Development | Create requirement-driven E2E tests for multi-tenant and signup flows | None | IN_PROGRESS (Conv: db060dca-6800-4af2-8ca9-a31b9bbb66fa) |
| 2 | Codebase Exploration | Analyze code structure and detail database schema/migration changes | None | DONE (Conv: 9ee4568b-d553-4123-a364-168b78ca7ce4) |
| 3 | Backend Database & API Refactor | Wipe DB, create new schema, refactor backend queries for store scoping, atomic signup API | M2 | IN_PROGRESS (Conv: 58166da8-8ff1-4bbf-9951-46d8d055b4f3) |
| 4 | Frontend SaaS UI Refactor | Implement 3-step Signup UI and global Store Switcher component | M3 | PLANNED |
| 5 | E2E Test Verification & Hardening | Run E2E tests, resolve failures, and perform adversarial coverage hardening | M1, M4 | PLANNED |

## Interface Contracts
### Frontend ↔ Backend API
- **Header**: `x-store-id` must be sent on all authenticated requests (except signup/login/verify).
- **POST `/api/auth/signup`**:
  - Payload: `{ fullName, email, password, organizationName, storeName, vatNumber, phone, address }`
  - Response: `{ id, username, role, nameAr, organization_id }` plus HTTP cookie `token`
- **GET `/api/stores`**:
  - Returns list of stores in the user's organization.
  - Response: `[{ id, nameAr, nameEn, vatNumber, phone, address, organization_id }]`
