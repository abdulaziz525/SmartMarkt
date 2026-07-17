# Frontend UI Exploration Handoff Report

## 1. Observation
The SmartMarkt frontend codebase was investigated directly using `view_file` and `grep_search`. The following files were analyzed:
*   **`frontend/src/App.tsx`** (2529 lines): The main React entry point containing application layout, state (lines 37-90), data fetching (lines 116-143), active tabs, and main modals.
*   **`frontend/src/features/auth/SetupPage.tsx`** (230 lines): Currently handles a 2-step setup process (Step 1: Owner Account, Step 2: Store Details).
*   **`frontend/src/features/auth/LoginPage.tsx`** (123 lines): Handles user login.
*   **`frontend/src/components/BranchManagement.tsx`** (188 lines): Renders branch list, edit/delete actions, and a modal form.
*   **`frontend/src/hooks/usePermissions.ts`** (36 lines): Maps role-based access levels (`owner`, `manager`, `cashier`) for different parts of the UI.
*   **`frontend/src/types.ts`** (112 lines): Interfaces for `Product`, `CartItem`, `Invoice`, `Supplier`, `PurchaseOrder`, `User`, `AuditLog`, and `Branch`.

Below is the observed inventory of UI pages, panels, modals, and user forms, alongside the specifications for the new planned features (3-step signup and store switcher).

---

### A. Pages / Tabs (in `src/App.tsx`)

#### 1. Dashboard Tab (`activeTab === 'dashboard'`, line 823)
*   **Elements**:
    *   Numerical metric cards for: Today's Total Sales, Sales Invoice Count, Total VAT Collected (15%), and Estimated Net Profit (c.f. lines 840-893).
    *   7-Day Sales History SVG Chart with hover tooltips showing date, sales, and profits (c.f. lines 898-948).
    *   Best Selling Products list with progress bars representing units sold (c.f. lines 951-981).
*   **User Actions**:
    *   Hovering over SVG chart bars: Shows tooltip with specific date data.

#### 2. POS Sales Screen Tab (`activeTab === 'pos'`, line 989)
*   **Panels**:
    *   **Shopping Cart Panel (Left Column)**:
        *   Lists selected cart items (CartItem) with product name, barcode, unit base price, quantity, discount percentage, and custom price (override).
        *   Displays mathematical summary: Subtotal, Total Discount, VAT (15%), and Grand Total Due.
    *   **Barcode Scanner Simulator (Right Column)**:
        *   Form containing a text input field and action button.
        *   Shortcut buttons that trigger quick scans for the first four catalog products.
    *   **Catalog Search & Filters (Right Column)**:
        *   Search field.
        *   Horizontal scrolling category pill filters.
        *   Grid of catalog product cards.
*   **User Actions**:
    *   *Clicking catalog product card* or *submitting valid barcode*: Triggers `addToCart()` (line 240). Expected UI Response: Cart item is added/incremented, and Grand Total Due updates.
    *   *Adjusting quantity inputs (+/- buttons)*: Triggers `updateCartQuantity()` (line 261). Expected UI Response: Quantity count changes, item total updates, Grand Total Due updates. Quantity bounds are checked against stock.
    *   *Modifying discount input (0-100)*: Triggers `updateCartDiscount()` (line 278). Expected UI Response: Recalculates item total and Grand Total.
    *   *Modifying custom price (Owner/Manager only)*: Triggers `updateCartCustomPrice()` (line 285). Expected UI Response: Updates item selling price and Grand Total. Cashiers see alert/rejection.
    *   *Clicking Trash icon next to item*: Triggers `removeFromCart()` (line 295). Expected UI Response: Item is deleted from cart.
    *   *Clicking "Clear" button in header*: Triggers `setCart([])`. Expected UI Response: Cart is emptied.
    *   *Clicking "Pay and Post Invoice (ZATCA)"*: Triggers `setIsCheckoutOpen(true)`. Expected UI Response: Opens Checkout Modal.

#### 3. Inventory Tab (`activeTab === 'inventory'`, line 1276)
*   **Panels**:
    *   **Toolbar**: Search text input, category filter dropdown, alert filter dropdown (All, Low Stock, Expiring soon), export CSV button, and "New Product" action button.
    *   **Bulk CSV Import Panel**: Textarea for raw CSV text input and "Import" button.
    *   **Product Table**: Displays Barcode, Name (Arabic/English), Category, Cost, Selling, Stock count (with low-stock highlight badge), Expiry Date (if perishable), and actions.
*   **User Actions**:
    *   *Changing Search/Filters*: Expected UI Response: Instantly filters rows in the table.
    *   *Clicking "Export CSV"*: Triggers `handleCsvExport()` (line 395). Expected UI Response: Initiates browser download of `.csv` file with product records.
    *   *Entering CSV text & clicking "Import"*: Triggers `handleCsvImport()` (line 378). Expected UI Response: Validates input, updates db, alerts user with success/error counts, refetches data, and updates table.
    *   *Clicking "New Product"*: Opens Product Modal with a fresh template.
    *   *Clicking row Edit icon*: Opens Product Modal populated with editing product details.
    *   *Clicking row Delete icon*: Triggers `confirm()` browser dialog. On approval, deletes product via API, alerts user, and updates table.

#### 4. Suppliers & POs Tab (`activeTab === 'suppliers'`, line 1516)
*   **Panels**:
    *   **Registered Suppliers Grid**: Lists supplier names, phones, emails, VAT numbers, and accounts payable balances.
    *   **Purchase Orders Table**: Lists PO Numbers, dates, supplier names, items count, total costs, status badges (Pending Receipt vs Received), and receive actions.
*   **User Actions**:
    *   *Clicking "New Supplier"*: Opens Supplier Modal.
    *   *Clicking "Settle" button on a supplier (only when balance > 0)*: Opens browser `prompt` for payment amount. Entering amount and submitting triggers `handleSupplierPayoff()`, which deducts amount from balance and updates grid.
    *   *Clicking supplier Edit icon*: Opens Supplier Modal with supplier details.
    *   *Clicking supplier Delete icon*: Confirms deletion and deletes supplier.
    *   *Clicking "Create Purchase Order"*: Opens PO Modal.
    *   *Clicking "Receive PO" on pending PO row*: Triggers `handlePoReceive()` (line 490). Expected UI Response: Updates status badge to "Received" and updates inventory stock levels for those products.

#### 5. Reports Tab (`activeTab === 'reports'`, line 1660)
*   **Panels**:
    *   **Date Filter**: Range selector buttons (Today, 7 Days, 30 Days).
    *   **Metrics Grid**: Financial cards displaying Gross Sales, Total Discounts, VAT Collected, COGS, and Net Profit.
    *   **Sales Journal Ledger**: Table of historical invoices with View Receipt buttons.
*   **User Actions**:
    *   *Switching Range Tabs*: Expected UI Response: Re-filters metrics cards and transactions list immediately.
    *   *Clicking "Receipt" action button on invoice*: Triggers `setActiveInvoice(inv)`. Expected UI Response: Opens Detailed Receipt Modal.

#### 6. Audit Logs Tab (`activeTab === 'audit'`, line 1770)
*   **Panels**:
    *   Table displaying immutable system logs (Timestamp, Operator, Role, Action, Details). No write/edit actions available.

#### 7. Settings Tab (`activeTab === 'settings'`, line 1815)
*   **Panels**:
    *   **Supermarket Store Information Form**: Form fields mapping current store details.
    *   **Branch Management Panel** (nested component): Lists branches and action buttons.
*   **User Actions**:
    *   *Submitting Store Form (Owner only)*: Updates store details on the backend, updates local `storeInfo` state, and alerts success. Managers/Cashiers see error.
    *   *Clicking "Add Branch"*: Opens Branch Modal.
    *   *Clicking branch Edit/Delete buttons*: Launches modal or delete confirmation.

---

### B. Modals (in `src/App.tsx` and `src/components/BranchManagement.tsx`)

#### 1. Product Modal (`isProductModalOpen`, line 2013)
*   **Form Inputs**: Barcode, Category, Arabic Name, English Name, Cost Price, Selling Price, Current Qty, Unit UoM, Stock Alert Threshold, Perishable (checkbox). If checked, displays Expiry Date picker.
*   **Actions**:
    *   Submitting: Triggers `handleProductSave()`, calls database save API, closes modal, and refreshes inventory.
    *   Clicking "X" or backdrop: Closes modal without saving.

#### 2. Supplier Modal (`isSupplierModalOpen`, line 2169)
*   **Form Inputs**: Supplier Company Name, Phone Contact, Email, VAT Number.
*   **Actions**:
    *   Submitting: Triggers `handleSupplierSave()`, saves to backend, closes modal, and refreshes suppliers.
    *   Clicking "X": Closes modal.

#### 3. Purchase Order Modal (`isPoModalOpen`, line 2246)
*   **Form Inputs**: Supplier dropdown selector, Search input (to find products), Add buttons on catalog rows, Cost Price input (item-specific override), Quantity input (item-specific override).
*   **Actions**:
    *   *Clicking "+" on product in right list*: Adds product to left PO basket.
    *   *Clicking trash icon in PO basket*: Removes product from basket.
    *   *Clicking "Submit PO"*: Triggers `handlePoSubmit()`, posts PO to backend, closes modal, and refreshes PO table.

#### 4. Checkout Modal (`isCheckoutOpen`, line 1921)
*   **Form Inputs**: Payment Method Selector (Cash, Card, Split), Cash Received input (visible for Cash/Split payments).
*   **Actions**:
    *   *Entering Cash amount*: Calculates change return or remaining card balance in real-time.
    *   *Clicking "Generate Tax Invoice"*: Triggers `handleCheckoutSubmit()`, calls invoice create API, clears shopping cart, closes modal, and opens Receipt Modal with the completed transaction details.

#### 5. Detailed Print Tax Receipt Modal (`activeInvoice`, line 2382)
*   **Display**: Fully formatted ZATCA compliant simplified tax invoice details (including ZATCA base64 QR code rendered dynamically).
*   **Actions**:
    *   *Clicking "Print Receipt"*: Triggers `window.print()` browser print page handler.
    *   *Clicking "Close" / "X"*: Sets `activeInvoice` to `null` to close modal.

#### 6. Branch Modal (`isModalOpen` in `BranchManagement.tsx`, line 114)
*   **Form Inputs**: Arabic Name, English Name, Location/Address, Status dropdown (Active / Inactive).
*   **Actions**:
    *   Submitting: Calls `apiService.saveBranch()`, updates local state, and refreshes parent grid.
    *   Clicking Cancel/X: Closes modal.

---

### C. Authentication & Setup Flow UI

#### 1. Login Page (in `src/features/auth/LoginPage.tsx`)
*   **Form Inputs**: Email/Username input, Password input.
*   **Actions**:
    *   Submitting: Calls `apiService.login()`, saves cookies, calls `onLogin()` trigger to reload page and authenticate. Shows inline alert on failure.

#### 2. New 3-Step Signup Flow UI (Planned, R2)
*   **Form Setup**:
    *   **Step 1: Owner Account**: Fields: `fullName`, `email`, `password`. Button: "Continue" (transitions to step 2).
    *   **Step 2: Organization Creation**: Fields: `organizationName`. Button: "Continue" (transitions to step 3). Button: "Back" (returns to step 1).
    *   **Step 3: First Store Creation**: Fields: `storeNameAr`, `storeNameEn`, `vatNumber`, `phone`, `address`. Buttons: "Complete Setup" (submits entire wizard payload to `POST /api/auth/signup`), "Back" (returns to step 2).
*   **E2E Interactions to Test**:
    *   Validate step transitions: Verify "Continue" is disabled or triggers validation errors if fields are missing.
    *   Validate back-tracking: Verify "Back" buttons retain previously typed input values.
    *   Verify submit: Submitting Step 3 posts unified payload. Expected UI Response: Receives user credentials, sets authentication cookie/state, redirects directly to Dashboard.

---

### D. Global Store Switcher (Planned, R3)

#### 1. Selector Placement
*   Dropdown select field rendered globally in the main header (`App.tsx` sticky header, line 648 onwards).

#### 2. Switcher Mechanics
*   Fetches the list of all stores the authenticated user has access to (`apiService.getBranches()` or user store permissions).
*   Displays currently active store name.
*   **User Action**: Clicking switcher and selecting a different store.
*   **Expected UI Response**:
    1.  Updates the active store context globally.
    2.  Immediately invokes `refreshData()` (re-querying `/products`, `/invoices`, `/suppliers`, `/purchase-orders`, `/audit-logs`, `/store-info` scoped to the newly selected store ID).
    3.  Updates header store branding (name, VAT, address) dynamically.
    4.  Refreshes tables (POS catalog, Inventory table, Reports metrics, Audit logs list) to render the isolated data of the switched store.

---

## 2. Logic Chain
1.  **Codebase Inspection**: By viewing `App.tsx` and related components (`BranchManagement.tsx`, `LoginPage.tsx`, `SetupPage.tsx`), I mapped all active pages/tabs and mapped each modal trigger to its state variables (`isProductModalOpen`, `isSupplierModalOpen`, `isPoModalOpen`, `isCheckoutOpen`, `activeInvoice`, `isModalOpen` for branches).
2.  **User Flow Modeling**: For each form and interactive element, I traced the state handler functions (such as `handleCheckoutSubmit`, `handleProductSave`, etc.) to define what actions are performed and their subsequent UI updates.
3.  **Requirements Integration**:
    *   I mapped the *new 3-step signup flow* against the current 2-step setup file `SetupPage.tsx`. To test E2E, we must mock/assert step transitions (1 -> 2 -> 3) and verify values are preserved during back-navigation.
    *   I analyzed how store switching must function in the header. The header currently references `storeInfo?.nameAr` and `storeInfo?.nameEn`. The new global store switcher must be inserted here. When selected, it must trigger `refreshData()` to reload state, meaning the E2E test must inspect table data changes.

---

## 3. Caveats
*   **Implementation Status**: The 3-step signup flow and the header store switcher are currently documented as PLANNED requirements for Milestone 4 and are not fully implemented in the current code files. The E2E test plan for these elements is based on user requirements (`ORIGINAL_REQUEST.md`) and design guidelines.
*   **Native Prompts**: Settle supplier balance relies on a native browser `prompt` dialog, which requires specific E2E framework handling (e.g. Playwright's dialog listener).

---

## 4. Conclusion
The SmartMarkt frontend contains 7 pages/tabs, 6 modals (Product, Supplier, PO, Checkout, Receipt, Branch), and 3 primary authentication/setup pages. E2E tests must be configured to cover:
1.  **Tab Navigation & Access Control**: Verifying role restrictions using the `usePermissions` hook.
2.  **Transactional Flows**: Product checkout and ZATCA receipt generation.
3.  **Inventory/PO Management**: Stock adjustments, CSV import/export, and purchase order receiving.
4.  **Multi-Tenant Setup**: The new 3-step signup wizard.
5.  **Data Isolation Switching**: The global store switcher immediately updating table contents upon selection.

---

## 5. Verification Method
To verify the UI structure and flows during test case execution:
1.  **Manual Code Inspection**:
    *   Inspect `frontend/src/App.tsx` lines 645-700 (header) and lines 1921-2510 (modals) to verify elements.
    *   Inspect `frontend/src/features/auth/SetupPage.tsx` to verify steps.
2.  **Playwright Test Scenarios**:
    *   Run tests targeting `/` when db is wiped to verify the 3-step Signup wizard.
    *   Run tests after login to verify header dropdown selector and assertions checking that table contents (e.g. products count) change when a different store is selected.
