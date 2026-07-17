# BRIEFING — 2026-07-17T05:33:53+03:00

## Mission
Execute the database and backend refactoring for multi-tenancy in the SmartMarkt application.

## 🔒 My Identity
- Archetype: sub-orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: /Users/abdulaziz/Library/Mobile Documents/com~apple~CloudDocs/00_Projects/WMP/SmartMarkt/application/.agents/sub_orch_backend_refactor
- Original parent: Project Orchestrator
- Original parent conversation ID: 4fa2e5d5-0445-4def-b793-0767d981bef9

## 🔒 My Workflow
- **Pattern**: Project Pattern (Iterative Explorer -> Worker -> Reviewer -> Challenger -> Forensic Auditor)
- **Scope document**: /Users/abdulaziz/Library/Mobile Documents/com~apple~CloudDocs/00_Projects/WMP/SmartMarkt/application/.agents/sub_orch_backend_refactor/SCOPE.md
1. **Decompose**: Decompose backend and database refactoring into steps: Migration Refactoring, Controller Updates, Middleware Integration, Atomic Signup Transaction, and Store Fetching API.
2. **Dispatch & Execute** (pick ONE):
   - **Direct (iteration loop)**: Iterate using Explorer (plan verification), Worker (coding/testing), Reviewer (correctness/compilation check), Challenger (data isolation check), and Forensic Auditor.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: Self-succeed at 16 spawns, write handoff.md, spawn successor.
- **Work items**:
  1. Verify plan with Explorer [pending]
  2. Implement code with Worker [pending]
  3. Verify code with Reviewer [pending]
  4. Stress-test data isolation with Challenger [pending]
  5. Audit code with Forensic Auditor [pending]
- **Current phase**: 1
- **Current focus**: Decompose and plan verification with Explorer

## 🔒 Key Constraints
- Wipe DB and refactor migrations (organizations, stores, users, products, suppliers, purchase_orders, purchase_order_items, invoices, invoice_items, audit_logs).
- Update backend controllers (scoping queries by store_id or organization_id based on req.storeId / req.user).
- Introduce storeContextMiddleware and inject it into backend/src/app.ts.
- Implement POST /api/auth/signup atomic transaction endpoint, returning token.
- Create GET /api/stores to allow fetching stores under the user's organization.
- Spawn Explorer to verify plan, Worker to code, Reviewer and Challenger to check compilation and data isolation.
- MANDATORY INTEGRITY WARNING must be forwarded to all workers.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.

## Current Parent
- Conversation ID: 4fa2e5d5-0445-4def-b793-0767d981bef9
- Updated: not yet

## Key Decisions Made
- [TBD]

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_backend_refactor | teamwork_preview_explorer | Plan Verification | completed | 4e8fe669-273f-4b73-8c32-cc344c857782 |
| worker_backend_refactor | teamwork_preview_worker | Migration Refactoring | completed | 3e7f5da5-3229-44e7-9802-d0b2ad01b268 |
| reviewer_backend_refactor | teamwork_preview_reviewer | Code Review | completed | 05a4c764-70dd-4922-9434-d9ea272bf270 |
| challenger_backend_refactor | teamwork_preview_challenger | Data Isolation Challenge | completed | 2fff780e-3d26-4503-bfea-b7e0a29aaa0a |
| worker_backend_refactor_fixes | teamwork_preview_worker | Backend Refactoring Fixes | pending | 726afbb2-de20-4ca7-a2c0-54f479188b9e |

## Succession Status
- Succession required: no
- Spawn count: 5 / 16
- Pending subagents: [726afbb2-de20-4ca7-a2c0-54f479188b9e]
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: 58166da8-8ff1-4bbf-9951-46d8d055b4f3/task-15
- Safety timer: none
- On succession: kill all timers before spawning successor
- On context truncation: run `manage_task(Action="list")` — re-create if missing

## Artifact Index
- /Users/abdulaziz/Library/Mobile Documents/com~apple~CloudDocs/00_Projects/WMP/SmartMarkt/application/.agents/sub_orch_backend_refactor/SCOPE.md — Specific milestones and dependencies for this sub-orchestrator.
