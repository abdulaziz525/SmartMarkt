# 🇸🇦 SmartMarkt: Supermarket Accounting & POS App (iPad Optimized)

SmartMarkt is a professional, high-performance Point of Sale (POS) and accounting application designed specifically for small-to-medium supermarkets in Saudi Arabia. Optimized for touch interactions on iPads and tablets, it supports a dual-language interface (Arabic RTL and English LTR) and conforms to ZATCA e-invoicing (Fatoora Phase 1) regulations.

---

## 🏗️ Architecture

SmartMarkt uses a clean **client-server architecture** with a fully separated database layer:

```
┌─────────────────────┐         ┌─────────────────────────────┐
│   Vite + React      │  HTTP   │   Express.js Backend        │
│   (Frontend)        │────────▶│   (server/)                 │
│                     │  /api/* │                             │
│   • UI only         │◀────────│   • REST API routes         │
│   • No DB imports   │  JSON   │   • Knex query builder      │
│   • Calls /api/*    │         │   • MySQL / PostgreSQL      │
└─────────────────────┘         │   • Auto-migrations + seed  │
                                └─────────────────────────────┘
```

- **Frontend** (`src/`): React + TypeScript + Tailwind. Purely handles UI and calls the backend via REST API. Zero database dependencies.
- **Backend** (`server/`): Express.js + Knex.js. Handles all database operations, business logic, and data access.
- **API Boundary**: All data flows through `/api/*` REST endpoints. The Vite dev server proxies these requests to the backend during development.

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

3. **Inventory & Warehouse Management**
   - Full CRUD operations on products.
   - Intelligent stock warnings: Low-stock notifications and alerts for items nearing expiration.
   - Bulk import and export capabilities via CSV format.

4. **Suppliers & Purchasing (PO)**
   - Manage multiple supplier credit lines.
   - Purchase orders (PO) tracking.
   - Receiving shipments automatically calculates cost averages, updates stock counts, and increments accounts payable.

5. **Reports & Ledger Accounts**
   - Tracks metrics: Gross Sales, COGS (Cost of Goods Sold), VAT Collected, and Net Profits.
   - Detailed transaction journal with breakdown per invoice.

6. **Audit & Safety Logs**
   - Immutable audit trail recording every critical action (POS sales, stock edits, pricing updates, supplier payments) alongside the timestamp and operator details.

7. **Multi-Role User Profiles**
   - Instantly switch between Cashier, Manager, and Owner roles to see permission restrictions in action.

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (responsive utility classes with full RTL/LTR flex alignment)
- **Icons**: Lucide React
- **QR Code Engine**: `qrcode` (standard browser client-side encoder)
- **Backend API**: Node.js + Express.js + TypeScript
- **Database**: MySQL 8+ or PostgreSQL 14+ (switchable via `DB_TYPE` env variable)
- **Query Builder**: Knex.js (cross-dialect SQL query builder with auto-migrations)

---

## 🚀 How to Run Locally

> **Important**: The backend server is **required**. The frontend communicates with it via REST API for all data operations.

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Configure the Database

```bash
cp server/.env.example server/.env
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

### 3. Create the Database

- **PostgreSQL**: `createdb smartmarkt`
- **MySQL**: `mysql -u root -e "CREATE DATABASE smartmarkt;"`

### 4. Start Both Servers

**Option A — Run both at once:**

```bash
npm run dev
```

**Option B — Run separately (recommended for development):**

```bash
# Terminal 1: Start the backend API server
npm run dev:server
# or: cd server && npm run dev

# Terminal 2: Start the frontend dev server
npm run dev
```

The backend auto-creates all tables and seeds demo data on first run.  
The Vite dev server automatically proxies `/api/*` requests to `http://localhost:3001`.

### 5. Build for Production

```bash
npm run build
```

The built frontend assets go to `dist/`. In production, configure your web server or reverse proxy to forward `/api/*` requests to the backend, or set the `VITE_API_URL` environment variable at build time.

---

## 🔧 Environment Variables

### Frontend (`/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `/api` (uses Vite proxy in dev) |

### Backend (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_TYPE` | Database engine: `postgres` or `mysql` | `postgres` |
| `DB_HOST` | Database host | `127.0.0.1` |
| `DB_PORT` | Database port | `5432` (PG) / `3306` (MySQL) |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | _(empty)_ |
| `DB_NAME` | Database name | `smartmarkt` |
| `PORT` | Backend server port | `3001` |

---

## 🔒 User Roles Demo Credentials
You can switch profiles directly in the top header menu:
* **Cashier**: خالد المحمد (restricted to POS screen and sales)
* **Manager**: أحمد العتيبي (has inventory editing, PO creations, and reports access)
* **Owner**: المالك - أبو أحمد (has full administrative override power and settings customization)
