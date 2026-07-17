## 2026-07-17T02:32:31Z
You are the Backend Feature Explorer (Role: teamwork_preview_explorer).
Your working directory is: /Users/abdulaziz/Library/Mobile Documents/com~apple~CloudDocs/00_Projects/WMP/SmartMarkt/application/.agents/explorer_m1_1

Your task is to analyze the SmartMarkt backend codebase (routes, controllers, models, config) and list all API features that require E2E testing.
Specifically:
1. Examine the Express server (backend/src/app.ts), routes, controllers, and db schema.
2. Compile a detailed inventory of features: signup flow, login/logout, store switching, and CRUD endpoints for products, invoices, suppliers, purchase orders, audit logs.
3. For each feature, document the endpoint URL, method, payload fields, response format, and specific behavior to test (e.g. store isolation via `x-store-id` header).
4. Write your findings to `handoff.md` in your working directory.
