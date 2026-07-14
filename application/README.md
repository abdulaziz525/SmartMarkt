# 🇸🇦 SmartMarkt: Supermarket Accounting & POS App (iPad Optimized)

SmartMarkt is a professional, high-performance Point of Sale (POS) and accounting application designed specifically for small-to-medium supermarkets in Saudi Arabia. Optimized for touch interactions on iPads and tablets, it supports a dual-language interface (Arabic RTL and English LTR) and conforms to ZATCA e-invoicing (Fatoora Phase 1) regulations.

---

## 🌟 Key Features

1. **Point of Sale (POS)**
   - Fast sales checkout supporting touchscreen grid tap or external barcode scanners.
   - Shopping cart with inline quantity adjustments, custom pricing overrides, and percentage discounts.
   - Split-payment support (Cash + Card/mada).
   - Generates and displays a ZATCA-compliant receipt.

2. **ZATCA (Fatoora) Compliance**
   - Implements simplified tax invoice standards.
   - Generates a dynamic QR Code with TLV (Tag-Length-Value) encoding containing:
     - Seller Name
     - VAT Registration Number
     - Invoice Date & Time
     - Total Amount (with VAT)
     - VAT Total (15%)
   - Base64-encoded QR graphics instantly readable by ZATCA auditing tools.

3. **Hybrid Storage Engine (Online DB + Offline localStorage)**
   - When the backend API server is running, all data is persisted to **MySQL** or **PostgreSQL**.
   - If the API is unreachable, the frontend automatically falls back to `localStorage` for full offline operation.
   - On reconnection, data is synchronized from the database to the local cache.

4. **Inventory & Warehouse Management**
   - Full CRUD operations on products.
   - Intelligent stock warnings: Low-stock notifications and alerts for items nearing expiration.
   - Bulk import and export capabilities via CSV format.

5. **Suppliers & Purchasing (PO)**
   - Manage multiple supplier credit lines.
   - Purchase orders (PO) tracking.
   - Receiving shipments automatically calculates cost averages, updates stock counts, and increments accounts payable.

6. **Reports & Ledger Accounts**
   - Tracks metrics: Gross Sales, COGS (Cost of Goods Sold), VAT Collected, and Net Profits.
   - Detailed transaction journal with breakdown per invoice.

7. **Audit & Safety Logs**
   - Immutable audit trail recording every critical action (POS sales, stock edits, pricing updates, supplier payments) alongside the timestamp and operator details.

8. **Multi-Role User Profiles**
   - Instantly switch between Cashier, Manager, and Owner roles to see permission restrictions in action.

---

## 🛠️ Tech Stack & Architecture

- **Frontend Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (responsive utility classes with full RTL/LTR flex alignment)
- **Icons**: Lucide React
- **QR Code Engine**: `qrcode` (standard browser client-side encoder)
- **Backend API**: Node.js + Express.js + TypeScript
- **Database**: MySQL 8+ or PostgreSQL 14+ (switchable via `DB_TYPE` env variable)
- **Query Builder**: Knex.js (cross-dialect SQL query builder with auto-migrations)

---

## 🚀 How to Run locally

### Frontend Only (Offline / localStorage mode)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

### With Database Backend (MySQL or PostgreSQL)

1. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure Database Connection**
   ```bash
   cp .env.example .env
   ```
   Edit `server/.env` with your database credentials:
   ```env
   # Use 'postgres' or 'mysql'
   DB_TYPE=postgres

   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=password
   DB_NAME=smartmarkt
   PORT=3001
   ```

3. **Create the Database**
   - **PostgreSQL**: `createdb smartmarkt`
   - **MySQL**: `mysql -u root -e "CREATE DATABASE smartmarkt;"`

4. **Start the Backend API Server**
   ```bash
   cd server
   npm run dev
   ```
   The server will auto-create all tables and seed demo data on first run.

5. **Start the Frontend (in a separate terminal)**
   ```bash
   npm run dev
   ```
   The frontend detects the running backend and reads/writes data to the database.

---

## 🔒 User Roles Demo Credentials
You can switch profiles directly in the top header menu:
* **Cashier**: خالد المحمد (restricted to POS screen and sales)
* **Manager**: أحمد العتيبي (has inventory editing, PO creations, and reports access)
* **Owner**: المالك - أبو أحمد (has full administrative override power and settings customization)
