## 2026-07-17T02:35:29Z
You are the E2E Test Suite Setup Worker (Role: teamwork_preview_worker).
Your working directory is: /Users/abdulaziz/Library/Mobile Documents/com~apple~CloudDocs/00_Projects/WMP/SmartMarkt/application/.agents/worker_m1

Your task is to set up the E2E testing infrastructure for the SmartMarkt application (Milestone 1).
Specifically:
1. Initialize `TEST_INFRA.md` at the project root. Make sure it contains:
   - Test Philosophy: Opaque-box, requirement-driven.
   - Feature Inventory: Define 6 core features:
     1. Multi-Step Signup (Owner, Organization, First Store)
     2. User Authentication & Session (Login, permission-checking, JWT tokens)
     3. Store Context & Switcher (Listing, switching, and scoped data isolation)
     4. Product CRUD & CSV Import (Validation, listing, and csv importing)
     5. Sales Checkout (POS) (Cart operations, stock decrementing, ZATCA tax invoice & QR code)
     6. Suppliers & Purchase Orders (Supplier balance, PO creation and receipt)
   - Test cases mapping for the 4 Tiers:
     - Tier 1: Feature Coverage (5 per feature = 30 test cases)
     - Tier 2: Boundary & Corner Cases (5 per feature = 30 test cases)
     - Tier 3: Cross-Feature Combinations (6 combination test cases)
     - Tier 4: Real-World Scenarios (5 workload test cases)
     (Detail each test case in a table or list with description).
2. Modify the root `package.json` to include `@playwright/test` and `cross-env` in `devDependencies`, and add the scripts:
   - `"start:test:backend": "cross-env NODE_ENV=test DB_TYPE=sqlite DB_NAME=database.test.sqlite npm run dev --workspace=backend"`
   - `"start:test:frontend": "cross-env VITE_API_URL=http://localhost:3001/api npm run dev --workspace=frontend"`
   - `"test:e2e": "playwright test"`
   - `"test:e2e:ui": "playwright test --ui"`
   - `"test:e2e:debug": "playwright test --debug"`
3. Implement the database reset strategy in the backend:
   - Edit `backend/src/models/migrations.ts` to add the `resetDatabase` function that drops all tables in reverse dependency order, and re-migrates and seeds them.
   - Edit `backend/src/app.ts` to register the `POST /api/test/reset` endpoint when `process.env.NODE_ENV === 'test'`.
4. Create `playwright.config.ts` at the project root (using the config proposed in `/Users/abdulaziz/Library/Mobile Documents/com~apple~CloudDocs/00_Projects/WMP/SmartMarkt/application/.agents/explorer_m1_3/proposed_playwright.config.ts`).
5. Run `npm install` at the project root to install Playwright and other new packages.
6. Verify that both the backend and frontend packages can build successfully (`npm run build`).
7. Write your handoff report to `handoff.md` in your working directory.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
