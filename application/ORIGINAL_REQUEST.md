# Original User Request

## Initial Request — 2026-07-17T05:27:51+03:00

Refactor the SmartMarkt application from a single-store model to a full multi-tenant SaaS architecture with multi-branch support using a shared database model. Organizations manage multiple stores, and data is strictly isolated per store.

Working directory: /Users/abdulaziz/Library/Mobile Documents/com~apple~CloudDocs/00_Projects/WMP/SmartMarkt/application
Integrity mode: development

## Requirements

### R1. Backend & Database Schema Refactor
Create `organizations` and `stores` tables. Add `organization_id` to `users`, and `store_id` to all data-specific tables (products, invoices, suppliers, purchase orders, audit logs). Introduce role scoping per store. Update all backend queries to enforce `store_id` isolation based on the user's current context.

### R2. New Multi-Step Signup Flow
Replace the existing setup page with a 3-step React flow:
1. Owner Account Creation (fullName, email, password)
2. Organization Creation (name)
3. First Store Creation (name, VAT, phone, address)
Create a new `POST /api/auth/signup` endpoint that executes these creations within a single transaction and returns an auth token.

### R3. Frontend UI Store Switcher
Implement a global store switcher in the main header (`App.tsx`). Selecting a store updates the active store context globally and refetches all relevant data for that specific store.

### R4. Database Migration Strategy
The application should wipe the existing database entirely and start fresh with the new multi-tenant schema. Do not attempt to preserve existing data.

## Acceptance Criteria

### Data Isolation Verification
- [ ] Agents must programmatically or manually verify that data is strictly isolated. Create Organization A and Organization B. Authenticate as Owner A and attempt to fetch, create, or modify products/invoices for Organization B's `store_id`. The backend must reject the request.

### Schema Implementation
- [ ] The SQLite database is successfully wiped and recreated with `organizations`, `stores`, and updated foreign keys (`store_id`, `organization_id`).

### Signup Flow
- [ ] A new user can successfully complete the 3-step signup flow, which correctly creates their Organization, Store, and Owner User account in a single atomic database transaction.

### Store Switching
- [ ] The frontend global store switcher allows an owner of multiple stores to select a store, and the UI immediately updates to show only the data relevant to that newly selected `store_id`.
