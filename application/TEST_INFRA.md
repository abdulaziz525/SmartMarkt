# SmartMarkt E2E Testing Infrastructure

This document outlines the testing philosophy, feature inventory, and detailed test case mapping for the SmartMarkt application's End-to-End (E2E) testing suite (Milestone 1).

---

## 1. Test Philosophy

SmartMarkt uses an **opaque-box, requirement-driven** E2E testing philosophy. 

- **Opaque-Box**: The tests interact with the application solely through the user interface (the DOM) and exposed API endpoints. They mimic real user interactions without inspecting or mocking the internal component state or code.
- **Requirement-Driven**: Tests are designed to match and verify the functional business requirements of the system, guaranteeing that user workflows (e.g., POS checkout, store switching, CSV import) work correctly end-to-end under real-world conditions.
- **Hermetic & Deterministic**: Database state is reset to a known clean seed state using a dedicated `/api/test/reset` endpoint before each test suite execution, avoiding state leakage between test runs.

---

## 2. Feature Inventory

The test suite covers 6 core features:

1. **Multi-Step Signup**: Onboarding flow covering Owner registration, Organization configuration, and the First Store setup.
2. **User Authentication & Session**: Secure login/logout, JWT token storage, session maintenance, and role-based access control (RBAC).
3. **Store Context & Switcher**: Multi-branch listing, active branch switching, and scoped data/transaction isolation.
4. **Product CRUD & CSV Import**: Product listing, manual creation, validation checks, editing, deletion, and bulk CSV uploads.
5. **Sales Checkout (POS)**: Cashier cart operations, dynamic tax & total calculations, stock decrements, ZATCA tax invoice display, and QR code generation.
6. **Suppliers & Purchase Orders**: Supplier registry, balance tracking, drafting/canceling POs, and receiving shipments to increment stock.

---

## 3. Test Cases Mapping (4 Tiers)

Below is the detailed list of the **71 test cases** mapped across the 4 tiers.

### Tier 1: Feature Coverage (5 per feature = 30 test cases)

#### Feature 1: Multi-Step Signup
| Test ID | Title | Description |
|---|---|---|
| TC-F1-01 | Complete Signup Flow | Fills Step 1 (Owner), Step 2 (Org), and Step 3 (Store) details and submits, verifying redirection to login page. |
| TC-F1-02 | Input State Persistence | Fills Step 1 details, navigates to Step 2, returns to Step 1, and verifies that entered details are retained. |
| TC-F1-03 | Form Validation Errors | Attempts to advance from Step 1 to Step 2 with missing required fields, verifying error validation messages. |
| TC-F1-04 | Password Match Check | Inputs mismatching password and confirmation password, verifying that the next step is blocked. |
| TC-F1-05 | Cancel & Exit | Navigates back to the welcome landing page from Step 1, ensuring no state is committed. |

#### Feature 2: User Authentication & Session
| Test ID | Title | Description |
|---|---|---|
| TC-F2-01 | Successful Login | Logs in with valid credentials, verifies redirection to Dashboard and JWT cookie storage. |
| TC-F2-02 | Invalid Credentials | Attempts to log in with an incorrect password, verifying a visible error message. |
| TC-F2-03 | Session Persistence | Logs in, refreshes the browser page, and verifies that the session remains active (dashboard still visible). |
| TC-F2-04 | Logout Flow | Clicks the logout button, verifies that the JWT cookie is cleared, and is redirected to the login screen. |
| TC-F2-05 | Unauthorized Router Block | Attempts to visit the Dashboard URL directly without a session, verifying redirect to login. |

#### Feature 3: Store Context & Switcher
| Test ID | Title | Description |
|---|---|---|
| TC-F3-01 | Branch List Display | Clicks the branch switcher dropdown and verifies that all assigned branches are listed. |
| TC-F3-02 | Branch Selection | Switches branch to "North Branch", verifying that the UI header updates with the selected branch name. |
| TC-F3-03 | Scoped Data Loading | Switches to Branch A to see Branch A's sales, then switches to Branch B to verify Branch B's sales are loaded. |
| TC-F3-04 | Switcher Persistence | Selects Branch B, refreshes the page, and verifies that the active branch remains Branch B. |
| TC-F3-05 | Default Branch Auto-Select | Logs in and verifies the user is immediately routed to their default assigned branch. |

#### Feature 4: Product CRUD & CSV Import
| Test ID | Title | Description |
|---|---|---|
| TC-F4-01 | Create Product Manual | Creates a product via the UI form (name, barcode, prices, stock), verifying it appears in the listing. |
| TC-F4-02 | Edit Product Details | Modifies the selling price of an existing product, verifying the change persists in the listing. |
| TC-F4-03 | Delete Product | Deletes a product, verifying it is removed from the product table and cannot be queried. |
| TC-F4-04 | Bulk CSV Import | Uploads a valid CSV file with multiple products, verifying they are successfully parsed and saved. |
| TC-F4-05 | CSV Failure Handling | Uploads a CSV containing invalid pricing, verifying error messages are displayed and invalid rows rejected. |

#### Feature 5: Sales Checkout (POS)
| Test ID | Title | Description |
|---|---|---|
| TC-F5-01 | Cart Add Item | Scans/adds a product to the POS cart, verifying it is added with the correct name and price. |
| TC-F5-02 | Cart Quantity Adjust | Adjusts product quantity in the cart, verifying subtotal, 15% VAT, and total recalculate correctly. |
| TC-F5-03 | Cash Checkout | Completes checkout via Cash, verifying stock decrement and receipt modal popup. |
| TC-F5-04 | Card Checkout | Completes checkout via Card, verifying transaction successfully processes and records as Card payment. |
| TC-F5-05 | ZATCA Receipt Details | Verifies that the post-checkout invoice modal displays the ZATCA VAT number and a readable QR code. |

#### Feature 6: Suppliers & Purchase Orders
| Test ID | Title | Description |
|---|---|---|
| TC-F6-01 | Create Supplier | Adds a new supplier (name, contact, VAT), verifying they appear in the supplier registry. |
| TC-F6-02 | Draft Purchase Order | Creates a new PO with products and quantities, verifying its status is set to 'pending'. |
| TC-F6-03 | Receive PO Stock Update | Marks a pending PO as received, verifying that the product inventory increases by the PO quantities. |
| TC-F6-04 | Supplier Balance Post-Receipt | Verifies that receiving a PO on credit increments the supplier's outstanding balance. |
| TC-F6-05 | Edit Supplier Info | Updates a supplier's phone and email, verifying that modifications persist in the UI. |

---

### Tier 2: Boundary & Corner Cases (5 per feature = 30 test cases)

#### Feature 1: Multi-Step Signup (Boundary & Corner Cases)
| Test ID | Title | Description |
|---|---|---|
| TC-F1-06 | Duplicate Owner Username | Attempts signup using a username that already exists in the system; verifies error handling. |
| TC-F1-07 | Invalid Saudi VAT Format | Inputs a non-15-digit VAT number or one not starting/ending with '3', verifying validation catches it. |
| TC-F1-08 | Empty Final Submission | Forces submission of Step 3 with empty store details, verifying errors highlight empty fields. |
| TC-F1-09 | Boundary Input Lengths | Fills input fields with maximum length strings (e.g., 255 chars) to verify truncation handling. |
| TC-F1-10 | Special Characters in Org | Creates organization using characters like `&`, `-`, and `@`, verifying it saves and renders correctly. |

#### Feature 2: User Authentication & Session (Boundary & Corner Cases)
| Test ID | Title | Description |
|---|---|---|
| TC-F2-06 | Inactive User Block | Attempts login as a user whose account status is `active = false`, verifying access is blocked. |
| TC-F2-07 | Cashier Forbidden Area Access | Logs in as Cashier and attempts to navigate to `/suppliers`, verifying they get a 403 or redirect. |
| TC-F2-08 | SQL Injection Prevention | Submits SQL query fragments in the login fields, verifying they are sanitized and login fails cleanly. |
| TC-F2-09 | Session Expiry Auto-Redirect | Simulates an expired token cookie, verifying the app redirects to `/login` on the next interaction. |
| TC-F2-10 | Multi-Session Robustness | Verifies logging in on another session doesn't corrupt active store settings or cookie configurations. |

#### Feature 3: Store Context & Switcher (Boundary & Corner Cases)
| Test ID | Title | Description |
|---|---|---|
| TC-F3-06 | Unauthorized Branch API Access | Attempts to fetch Branch B's data via API while logged in as a user restricted to Branch A; verifies 403. |
| TC-F3-07 | Single-Branch Switcher Hide | Logs in as a user assigned to only one branch, verifying the branch switcher dropdown is hidden/disabled. |
| TC-F3-08 | Inactive Branch Hiding | Deactivates a branch in the database and verifies it disappears from the user switcher options. |
| TC-F3-09 | Branch Switch Cart Clear | Adds item to POS cart, switches branch, and verifies cart is cleared to prevent cross-branch leaks. |
| TC-F3-10 | Rapid Branch Selection | Toggles branches rapidly to ensure no race conditions and that final state matches the last click. |

#### Feature 4: Product CRUD & CSV Import (Boundary & Corner Cases)
| Test ID | Title | Description |
|---|---|---|
| TC-F4-06 | Duplicate Product Barcode | Attempts manual creation of a product using an existing barcode, verifying database/API rejection. |
| TC-F4-07 | Zero and Negative Price Block | Enters 0 or -5.00 in product cost or selling price, verifying validation prevents form submission. |
| TC-F4-08 | Large CSV Upload | Imports a CSV containing 500 product rows, verifying execution finishes without server timeout. |
| TC-F4-09 | Low Stock Threshold Alert | Modifies inventory to drop below the product's lowStockThreshold, verifying warning badge displays. |
| TC-F4-10 | Expired Perishable Badge | Adds a product with an expiry date in the past, verifying a prominent "Expired" badge is displayed. |

#### Feature 5: Sales Checkout (POS) (Boundary & Corner Cases)
| Test ID | Title | Description |
|---|---|---|
| TC-F5-06 | Insufficient Stock Block | Attempts to add/checkout more items than available in inventory, verifying checkout is blocked. |
| TC-F5-07 | 100% Value Discount | Applies a 100% discount to the cart, verifying total cost becomes 0.00 and VAT updates to 0.00. |
| TC-F5-08 | Split Payment Validation | Pays a sale using split payment (cash/card), verifying details match perfectly on the final invoice. |
| TC-F5-09 | Refund & Stock Return | Initiates a refund for a previously completed cash invoice, verifying stock increments back. |
| TC-F5-10 | Rapid Barcode Scanning | Inputs multiple barcode scanner simulator signals rapidly, verifying all add to cart without skipping. |

#### Feature 6: Suppliers & Purchase Orders (Boundary & Corner Cases)
| Test ID | Title | Description |
|---|---|---|
| TC-F6-06 | Duplicate Supplier VAT | Attempts to save a new supplier with a VAT number that is already registered, verifying validation error. |
| TC-F6-07 | Partial PO Receipt | Receives only half of the ordered items on a PO, verifying stock updates and PO status updates accordingly. |
| TC-F6-08 | Pending PO Cancellation | Cancels a pending PO, verifying status changes to 'cancelled' and no stock adjustments occur. |
| TC-F6-09 | Negative Balance Overpayment | Registers a supplier payment exceeding their balance, verifying supplier balance is recorded as negative. |
| TC-F6-10 | Inactive Product in PO | Attempts to add a deactivated product to a new Purchase Order, verifying product selection is blocked. |

---

### Tier 3: Cross-Feature Combinations (6 test cases)

| Test ID | Title | Description |
|---|---|---|
| TC-C3-01 | Onboarding to Sale | Verifies complete onboarding (signup), logging in, adding a product manually, and performing a POS sale. |
| TC-C3-02 | Restock and Sell Loop | Creates a PO for a product, receives the PO (incrementing stock), then sells that product via POS (decrementing stock). |
| TC-C3-03 | Multi-Branch Product Scope | Creates a product in Branch A, switches to Branch B, and verifies the product is completely absent from B. |
| TC-C3-04 | Role Collaboration Workflow | Manager uploads a CSV with new products and drafts a PO. Cashier logs in, receives the PO, and checkouts POS sales. |
| TC-C3-05 | PO Credit to Revenue | Receives a PO on credit (increasing supplier balance), processes a sale, and verifies the transaction audit log. |
| TC-C3-06 | Multi-Branch Audit Trail | Manager on Branch B updates stock; Owner logs in, checks Audit Logs, and verifies user, branch, and time stamps. |

---

### Tier 4: Real-World Scenarios (5 workload test cases)

| Test ID | Title | Description |
|---|---|---|
| TC-R4-01 | POS High-Volume Rush Hour | Simulates a sequence of 20 concurrent/back-to-back POS sales with different quantities and checks inventory counts. |
| TC-R4-02 | Full Daily Operations Cycle | Standard day: login -> CSV import -> update suppliers -> receive PO -> process 5 sales -> end-of-day report -> logout. |
| TC-R4-03 | Inventory Restocking Flow | Identifies low-stock alert -> triggers PO to supplier -> receives shipment -> verifies alert clears -> sells product. |
| TC-R4-04 | Role Handoff Shift Change | Owner creates Cashier user -> Manager imports products -> Cashier conducts sales -> Cashier triggers supervisor override. |
| TC-R4-05 | Brand New Store Verification | Performs a complete database reset, runs onboarding, and verifies dashboard reports zero sales but ready state. |
