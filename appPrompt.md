# Prompt: Supermarket Accounting App (iPad)

---

I want to build a professional accounting and point-of-sale (POS) app for a supermarket, optimized primarily for iPad (but should also work well as a responsive design on mobile and web).

## Overview
The app is for the owner/staff of a small-to-medium supermarket in Saudi Arabia. It must support Arabic (RTL) as the primary language, with the ability to switch to English.

## Suggested Tech Stack
- Frontend: React + TypeScript with Tailwind CSS, built as a touch-friendly PWA that runs smoothly on iPad (large buttons, support for external barcode scanners as keyboard-input devices).
- Backend: Node.js (Express or Fastify), or Supabase/Firebase if faster to build with.
- Database: PostgreSQL (or SQLite locally for an offline-first mode).
- The app should be offline-first with data syncing when internet is available, since in-store connectivity may drop.

## Core Modules and Features

### 1. Point of Sale (POS)
- Fast sales screen: search products by name or scan barcode.
- Shopping cart with per-item quantity, price, and discount editing.
- Support multiple payment methods: cash, card (mada), split payments.
- Print/send invoice (PDF or via Bluetooth thermal printer).
- Automatic VAT (15%) calculation.

### 2. E-Invoicing (ZATCA Compliance)
- Generate simplified tax invoices compliant with Saudi Arabia's ZATCA (Fatoora) e-invoicing requirements, including a QR code on the invoice containing (seller name, VAT number, invoice timestamp, invoice total, VAT total) TLV-encoded and Base64-encoded.
- Store an invoice archive suitable for later auditing.

### 3. Inventory Management
- Add/edit/delete products (name, barcode, category, cost price, selling price, quantity, unit of measure).
- Low-stock alerts when inventory drops below a set threshold.
- Expiry date tracking for perishable/food items, with alerts before expiration.
- Import/export products via Excel/CSV.

### 4. Accounting and Reports
- Daily/weekly/monthly sales reports.
- Profit & loss report (comparing cost price vs. selling price).
- Tax report (to simplify tax filing).
- Best-selling and slow-moving products report.
- Export reports as PDF or Excel.

### 5. Supplier and Purchasing Management
- Supplier records with contact details.
- Purchase orders that automatically update inventory upon receipt.
- Accounts payable tracking for suppliers.

### 6. User Management and Permissions
- Multiple roles: owner, branch manager, cashier.
- Cashiers only see the sales screen; managers see reports and inventory.
- Audit log for every sale or sensitive edit.

### 7. Main Dashboard
- Quick summary: today's sales, invoice count, best-selling products, stock status.
- Simple charts for sales performance.

## iPad-Specific Design Requirements
- Layout that works well in both Portrait and Landscape orientations.
- Touch targets sized appropriately (minimum 44px).
- Support for external keyboard input and shortcuts (for experienced cashiers).
- Consider Split View support if it fits the workflow.

## Suggested Starting Point
Start with the following structure:
1. Project setup (React + TypeScript + Tailwind + local SQLite database for initial development).
2. Build the core POS screen first (add product to cart, calculate total, VAT, checkout).
3. Build the inventory module (CRUD for products).
4. Integrate e-invoicing and the QR code.
5. Build reports and the dashboard.
6. Add the user roles and permissions system.
