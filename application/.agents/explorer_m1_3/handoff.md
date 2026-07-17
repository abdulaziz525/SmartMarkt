# Handoff Report: E2E Test Infrastructure Recommendation

This handoff report summarizes the research and recommendations for the End-to-End (E2E) testing infrastructure for the SmartMarkt project.

---

## 1. Observation
We observed the following in the repository:
1. **Repository Layout**:
   - The project is configured as an npm workspaces monorepo containing `frontend` and `backend` packages.
   - Root `package.json` (lines 4-7):
     ```json
     "workspaces": [
       "frontend",
       "backend"
     ]
     ```
2. **Backend Database Setup**:
   - Backend utilizes Knex (`backend/package.json` line 19).
   - In `backend/src/config/db.ts` (lines 11-35), it loads database configurations based on the `DB_TYPE` environment variable:
     - `sqlite` (with `sqlite3` driver) is used locally (defined in `backend/.env` lines 2-9).
     - `postgres` (with `pg` driver) and `mysql` (with `mysql2` driver) are also supported.
3. **App Migrations & Startup**:
   - Auto-migrations and baseline seeds are implemented in `backend/src/models/migrations.ts` inside `runMigrations()`.
   - On server startup (`backend/src/app.ts` lines 46-56), `runMigrations()` is called *once* before the Express server begins listening.
   - Currently, there are no existing test files in the project.
4. **Auth & Onboarding flows**:
   - `frontend/src/features/auth/SetupPage.tsx` handles initial store and owner account setup using the `/auth/setup` POST API endpoint.
   - `frontend/src/features/auth/LoginPage.tsx` handles standard authentication using `/auth/login`.

---

## 2. Logic Chain
Based on the observations:
1. **Opaque-Box E2E Testing**:
   - Since we need to test both API endpoints and the frontend UI, **Playwright** is the ideal framework. It can drive browsers for UI flows and contains a built-in `request` API (`APIRequestContext`) to test the API endpoints independently.
   - Installing Playwright at the root level of the monorepo is the cleanest approach, as it can orchestrate both packages and run tests that span the entire application.
2. **Database Reset & Isolation**:
   - Since E2E tests are out-of-process, they cannot directly modify the in-memory or in-process database state without violating the opaque-box principle.
   - If we delete the SQLite file directly while the Express backend is running, the Knex connection pool will break or fail to execute queries, since `runMigrations()` is only run once during start.
   - Thus, a database-agnostic HTTP endpoint (`POST /api/test/reset`) inside the backend is the best solution. It drops all tables using Knex's schema builder and re-migrates/seeds the database.
   - Guarding this route with `NODE_ENV === 'test'` ensures it is completely inaccessible in production.
   - Playwright can call this reset endpoint in its `beforeEach` hook to ensure complete test isolation without restarting the server.
3. **Execution Concurrency**:
   - SQLite has limitations with concurrent write transactions (causing database locked errors).
   - Therefore, Playwright should be configured to run E2E tests sequentially by setting `workers: 1` in the configuration.
4. **Vite Proxy Integration**:
   - Vite is configured to proxy `/api` requests to `http://localhost:3001` in `frontend/vite.config.js`. Running E2E tests against the Vite dev server (port 5173) will automatically route API requests to the backend.

---

## 3. Caveats
- **PostgreSQL / MySQL reset behavior**: The drop table script is database-agnostic but relies on dropping tables. For databases with active foreign key constraints during drops, we must temporarily disable constraint checks (which varies by database type, e.g. `PRAGMA foreign_keys = OFF` for SQLite, `SET FOREIGN_KEY_CHECKS = 0` for MySQL, and deferred constraints for PostgreSQL). This was fully handled in our proposed implementation of `resetDatabase()`.
- **Test parallelism**: Restricting tests to a single worker (`workers: 1`) avoids database locking and state pollution in local SQLite testing. If the team transitions to a fully containerized postgres database in CI and wants to run tests in parallel, they would need to partition database instances per worker (e.g. `database_test_1`, `database_test_2`), which is out of scope for this initial SQLite-centric setup.

---

## 4. Conclusion
We recommend:
1. Setting up **Playwright** at the root of the project to drive E2E testing for both frontend and backend.
2. Implementing an in-app database reset mechanism exposed via a test-only Express endpoint (`POST /api/test/reset`) that is active only when `NODE_ENV === 'test'`.
3. Isolating tests by calling this reset endpoint in Playwright's `beforeEach` hook.
4. Setting up custom npm scripts at the root level to run frontend/backend servers in test mode and trigger E2E suites.

We have created the following files in the agent's folder as proposed implementations:
- `proposed_TEST_INFRA.md` — Detailed documentation and implementation guide to be placed at the project root.
- `proposed_playwright.config.ts` — Playwright test configuration to be placed at the project root.
- `proposed_package.json.patch` — Diff patch to modify root `package.json` scripts and devDependencies.
- `proposed_backend_changes.txt` — Code modifications for `backend/src/app.ts` and `backend/src/models/migrations.ts` to add the `/api/test/reset` endpoint.

---

## 5. Verification Method
To verify this setup after implementation:
1. Run the test backend and frontend servers:
   ```bash
   npm run start:test:backend
   npm run start:test:frontend
   ```
2. Manually test the reset endpoint using curl:
   ```bash
   curl -X POST http://localhost:3001/api/test/reset
   ```
   Verify that it returns `{"message":"Database reset successful"}` and the database file is reset to seeds.
3. Install Playwright and run the E2E tests:
   ```bash
   npm install -D @playwright/test cross-env
   npx playwright install chromium
   npm run test:e2e
   ```
   Verify that tests execute sequentially, the browser launches, and tests complete successfully.
