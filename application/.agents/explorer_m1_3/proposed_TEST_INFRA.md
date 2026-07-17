# SmartMarkt End-to-End (E2E) Testing Infrastructure

This document outlines the architecture, setup, and guidelines for the SmartMarkt End-to-End (E2E) testing infrastructure.

## 1. Overview & Architecture
The E2E testing infrastructure is designed as an **opaque-box (black-box)** testing suite using **Playwright**.
- **Frontend App**: Tested by driving a headless browser (Chromium/Firefox/WebKit) to interact with the UI.
- **Backend API**: Tested by sending HTTP requests to API endpoints via Playwright's `APIRequestContext` and verifying response codes and payloads.
- **Isolation**: Each test runs in its own context, starting from a fresh database state using an automated database reset trigger.

---

## 2. Test Directory & File Layout
All E2E tests and infrastructure helpers are located in the `e2e` directory at the project root:

```text
e2e/
├── config/                  # Configuration helpers and global setups
│   └── global-setup.ts      # Tasks to run once before all tests (e.g., verifying server availability)
├── helpers/                 # Utility files and test abstractions
│   ├── auth.ts              # Authentication helpers (login, signup, session state)
│   ├── db.ts                # Database reset trigger client
│   └── fixtures.ts          # Playwright custom fixtures (extends test to automate setup/auth)
├── page-objects/            # Page Object Models (POM) representing UI pages
│   ├── LoginPage.ts         # Login Page selectors and operations
│   ├── SignupPage.ts        # Signup Page (3-step onboarding flow) selectors and operations
│   ├── DashboardPage.ts     # Main dashboard and store selector view selectors
│   └── StoreSwitcher.ts     # Store switching component selectors
├── api/                     # Direct HTTP API endpoint E2E tests
│   ├── auth.spec.ts         # API-only authentication and signup validation
│   ├── stores.spec.ts       # API-only store management and isolation
│   └── isolation.spec.ts    # Multi-tenant API isolation tests (store-id scoping validation)
└── specs/                   # Frontend UI and full end-to-end user flow tests
    ├── signup-onboarding.spec.ts # E2E flow for new user signup and store setup
    ├── store-switching.spec.ts  # E2E switcher validation and UI context update
    └── tenant-isolation.spec.ts # Verification that Tenant A cannot access Tenant B's data
```

---

## 3. Database Reset Strategy
To guarantee test isolation, the database must be wiped and reset to a clean state before every test case.

### 3.1 The Reset Endpoint (`/api/test/reset`)
When running in `test` mode (`NODE_ENV=test`), the backend exposes a specialized endpoint: `POST /api/test/reset`.
This endpoint:
1. Temporarily disables foreign key checks.
2. Drops or truncates all database tables in the SQLite/MySQL/PostgreSQL database.
3. Re-runs the application's auto-migrations and seeds to restore the baseline state.
4. Re-enables foreign key checks.

*Note: This route is strictly disabled in production environments (`NODE_ENV === 'production'`) to prevent accidental data loss.*

### 3.2 Backend Implementation Draft
In `backend/src/app.ts` (or routes):
```typescript
import { resetDatabase } from './models/migrations.js';

if (process.env.NODE_ENV === 'test') {
  app.post('/api/test/reset', async (req, res) => {
    try {
      await resetDatabase();
      res.status(200).json({ message: 'Database reset successful' });
    } catch (err: any) {
      console.error('Failed to reset database during E2E test:', err);
      res.status(500).json({ error: 'Database reset failed', details: err.message });
    }
  });
}
```

In `backend/src/models/migrations.ts`:
```typescript
export async function resetDatabase() {
  console.log('Resetting database for test run...');
  const dbType = (process.env.DB_TYPE || 'postgres').toLowerCase();

  // 1. Disable Foreign Keys
  if (dbType === 'sqlite') {
    await db.raw('PRAGMA foreign_keys = OFF;');
  } else if (dbType === 'mysql') {
    await db.raw('SET FOREIGN_KEY_CHECKS = 0;');
  } else {
    // PostgreSQL
    await db.raw('SET CONSTRAINTS ALL DEFERRED;');
  }

  // 2. Drop Tables (in reverse dependency order if constraints are active)
  const tables = [
    'invoice_items',
    'invoices',
    'purchase_order_items',
    'purchase_orders',
    'branches',
    'audit_logs',
    'suppliers',
    'products',
    'users',
    'store_info'
  ];

  for (const table of tables) {
    await db.schema.dropTableIfExists(table);
  }

  // 3. Re-enable Foreign Keys
  if (dbType === 'sqlite') {
    await db.raw('PRAGMA foreign_keys = ON;');
  } else if (dbType === 'mysql') {
    await db.raw('SET FOREIGN_KEY_CHECKS = 1;');
  }

  // 4. Re-run Migrations and default seeds
  await runMigrations();
  console.log('Database reset complete.');
}
```

### 3.3 Triggering Reset in Playwright Hooks
In `e2e/helpers/db.ts` or directly in a global setup or beforeEach hook:
```typescript
import { expect, test } from '@playwright/test';

// Reset the database before every test
test.beforeEach(async ({ request }) => {
  const response = await request.post('/api/test/reset');
  expect(response.ok()).toBeTruthy();
});
```

---

## 4. Playwright Configuration (`playwright.config.ts`)
The configuration is optimized for local and CI environments.
- **Workers**: Set to `1` (sequentially) to prevent race conditions on the database reset.
- **WebServers**: Automatically manages the backend (running on port 3001 in test mode) and frontend (running on port 5173).

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export default defineConfig({
  testDir: './e2e',
  /* Run tests in files sequentially to avoid database race conditions */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on the database */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run local dev servers before starting the tests */
  webServer: [
    {
      command: 'npm run start:test:backend',
      url: 'http://localhost:3001/api/auth/status',
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      timeout: 30000,
    },
    {
      command: 'npm run start:test:frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      timeout: 30000,
    },
  ],
});
```

---

## 5. Root Package Configuration (`package.json`)
The following commands are added to the root `package.json` to facilitate E2E runs:

```json
"scripts": {
  "start:test:backend": "cross-env NODE_ENV=test DB_TYPE=sqlite DB_NAME=database.test.sqlite npm run dev --workspace=backend",
  "start:test:frontend": "cross-env VITE_API_URL=http://localhost:3001/api npm run dev --workspace=frontend",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug"
}
```

### Dev Dependencies
Install the following devDependencies at the root of the project:
```bash
npm install -D @playwright/test cross-env
```

---

## 6. Guidelines for Writing E2E Tests
1. **Always Use Page Object Models (POM)**: Keep CSS selectors and page-specific interactions inside classes within `e2e/page-objects/` to avoid fragile tests when UI elements change.
2. **Avoid Direct DB Writes**: Interact with the system strictly through HTTP APIs or the UI (opaque-box).
3. **Verify Tenant Isolation**: Always write tests that create objects (e.g., products) as Tenant A, then log in as Tenant B and verify that those objects are not visible or accessible.
4. **Use Custom Fixtures**: Utilize Playwright custom fixtures (`e2e/helpers/fixtures.ts`) to handle authentication state storage so you don't have to log in via the UI before every single test.
