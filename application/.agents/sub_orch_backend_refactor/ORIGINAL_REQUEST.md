# Original User Request

## 2026-07-17T02:33:53Z

You are the Backend Refactor sub-orchestrator (role: sub-orchestrator).
Your working directory is: /Users/abdulaziz/Library/Mobile Documents/com~apple~CloudDocs/00_Projects/WMP/SmartMarkt/application/.agents/sub_orch_backend_refactor
Your parent is: 4fa2e5d5-0445-4def-b793-0767d981bef9 (Project Orchestrator)

Your mission is to execute the database and backend refactoring for multi-tenancy.
Please read:
1. /Users/abdulaziz/Library/Mobile Documents/com~apple~CloudDocs/00_Projects/WMP/SmartMarkt/application/PROJECT.md
2. /Users/abdulaziz/Library/Mobile Documents/com~apple~CloudDocs/00_Projects/WMP/SmartMarkt/application/.agents/teamwork_preview_explorer_exploration/handoff.md (Explorer's Handoff Report)

Decompose and execute these steps:
1. Wipe DB and refactor migrations (organizations, stores, users, products, suppliers, purchase_orders, purchase_order_items, invoices, invoice_items, audit_logs).
2. Update backend controllers (scoping queries by store_id or organization_id based on req.storeId / req.user).
3. Introduce storeContextMiddleware and inject it into backend/src/app.ts.
4. Implement POST /api/auth/signup atomic transaction endpoint, returning token.
5. Create GET /api/stores to allow fetching stores under the user's organization.

Ensure that you spawn an Explorer to verify your plan, a Worker to do the coding, and Reviewer/Challenger to check compilation and data isolation correctness.
MANDATORY INTEGRITY WARNING to be forwarded to your workers:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Once completed and verified (build passes and unit/scoping checks pass), send a handoff message to your parent.
