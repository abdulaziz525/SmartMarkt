# Scope: E2E Test Suite Development

## Architecture
- **E2E Testing Track**: Requirements-driven, opaque-box test suite.
- **Tiers**:
  - Tier 1: Feature Coverage (≥5 per feature)
  - Tier 2: Boundary & Corner Cases (≥5 per feature)
  - Tier 3: Cross-Feature Combinations (pairwise coverage)
  - Tier 4: Real-World Application Scenarios
- **Test Runner**: Node.js native test runner (`node:test`) or Jest/Vitest/Playwright.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test Architecture & Feature Inventory | Identify features, design test runner, setup test infra, and define test strategy in TEST_INFRA.md | None | DONE |
| 2 | E2E API Test Suite | Implement HTTP-based E2E API tests for Tiers 1-4. Validate data isolation. | M1 | DONE |
| 3 | E2E Frontend/UI Test Suite | Implement UI/Frontend E2E tests using Playwright (Tiers 1-4) | M2 | IN_PROGRESS |
| 4 | Test Case Hardening & Coverage Expansion | Ensure minimum thresholds are met across all tiers (Feature, Boundary, Combo, Workload). | M3 | IN_PROGRESS |
| 5 | Suite Verification & Test Readiness | Run the complete E2E test suite, write TEST_READY.md, and perform final handoff | M4 | PLANNED |

## Interface Contracts
### E2E Test Runner ↔ SmartMarkt Services
- The test suite must run independently of the internal state.
- Express Backend must be started dynamically or target a running instance.
- Frontend must be served or target a running instance.
