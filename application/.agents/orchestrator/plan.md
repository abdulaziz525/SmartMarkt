# SmartMarkt SaaS Refactoring Plan

This plan details the milestones and steps required to refactor SmartMarkt into a multi-tenant SaaS application with multi-branch/store support.

## Milestones

### Milestone 1: E2E Test Suite Development (Parallel Track)
- **Objective**: Establish the E2E test suite that validates the multi-tenant SaaS features from an opaque-box perspective.
- **Verification**: `TEST_READY.md` published, tests covering 4 tiers (Feature, Boundary, Combination, Workload).

### Milestone 2: Codebase Analysis & Detailed Schema Design
- **Objective**: Explore the backend/frontend codebase and map out the exact schema changes, API routes, and frontend context requirements.
- **Verification**: Handoff report from Explorer outlining target tables, SQL queries, and code edits.

### Milestone 3: Database & Backend Core Refactoring
- **Objective**: Recreate the SQLite database, run migrations, support `organizations` and `stores` tables, add `organization_id` to `users`, and `store_id` to data tables. Implement `POST /api/auth/signup` atomic transaction and active store context scoping (via token / request headers).
- **Verification**: Backend builds and unit tests pass. APIs verified for data isolation (e.g. Owner A cannot query Owner B's store).

### Milestone 4: Frontend UI Store Switcher & Multi-Step Signup
- **Objective**: Implement the 3-step Signup React flow replacing the setup page, add global Store Switcher in main header, and hook up store context.
- **Verification**: Frontend builds and starts. Store switching successfully updates data display.

### Milestone 5: Integration, E2E Testing, and Adversarial Hardening
- **Objective**: Run E2E tests against the integrated app. Resolve any failures. Perform white-box analysis and generate adversarial tests (Tier 5) to harden the system.
- **Verification**: 100% test pass on all tiers, Forensic Auditor attestation.
