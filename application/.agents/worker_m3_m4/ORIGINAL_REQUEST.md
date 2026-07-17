## 2026-07-17T02:42:57Z

You are the E2E Frontend UI Test Suite Worker (Role: teamwork_preview_worker).
Your working directory is: /Users/abdulaziz/Library/Mobile Documents/com~apple~CloudDocs/00_Projects/WMP/SmartMarkt/application/.agents/worker_m3_m4

Your task is to implement the E2E Frontend UI Test Suite and POMs for the SmartMarkt application (Milestone 3 & 4).
Specifically:
1. In the `e2e/page-objects` directory, create:
   - `LoginPage.ts`: Page Object Model containing methods to log in and select selectors.
   - `SignupPage.ts`: Page Object Model for the new 3-step signup wizard (Step 1: Account, Step 2: Organization, Step 3: First Store) with methods to fill details, advance, backtrack, and check validation states.
   - `StoreSwitcher.ts`: Page Object Model representing the header store switcher, with selectors to open the switcher, list options, and select a store.
   - `DashboardPage.ts`: Page Object Model representing the main authenticated UI, with selectors to switch tabs (Dashboard, POS, Inventory, Suppliers, Reports, Settings) and check active store details/metrics.
2. In the `e2e/specs` directory, create the following test specification files:
   - `signup-onboarding.spec.ts`: Verifies onboarding flows including:
     - TC-F1-01: Full successful signup.
     - TC-F1-02: Input state persistence when navigating back.
     - TC-F1-03: Validation errors on step transitions.
     - TC-F1-04: Password mismatch validation.
   - `store-switching.spec.ts`: Verifies switcher functionality including:
     - TC-F3-01: Correct dropdown list items.
     - TC-F3-02: Header branding update upon store selection.
     - TC-F3-03: Dynamic data fetching upon branch/store toggle.
     - TC-F3-04: Page refresh context persistence.
     - TC-F3-09: Cart clearing on store switch.
   - `tenant-isolation.spec.ts`: Verifies UI data isolation:
     - Log in as Owner A, add a product via Inventory tab.
     - Log in as Owner B, open Inventory tab, and assert that Owner A's product is not visible.
3. Make sure all written TypeScript files compile cleanly without any errors. Run `npx tsc -p tsconfig.json` to verify.
4. Write your handoff report to `handoff.md` in your working directory.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
