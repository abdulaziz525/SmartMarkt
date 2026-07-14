import type { Product, Invoice, Supplier, PurchaseOrder, User, AuditLog, PaymentMethod } from '../types';
import { generateZatcaBase64 } from '../utils/zatca';

// Helper keys for localStorage
const KEYS = {
  PRODUCTS: 'sm_products',
  INVOICES: 'sm_invoices',
  SUPPLIERS: 'sm_suppliers',
  PURCHASE_ORDERS: 'sm_purchase_orders',
  USERS: 'sm_users',
  AUDIT_LOGS: 'sm_audit_logs',
  CURRENT_USER: 'sm_current_user',
  STORE_INFO: 'sm_store_info',
};

// Default Store Settings
export interface StoreInfo {
  nameAr: string;
  nameEn: string;
  vatNumber: string;
  phone: string;
  address: string;
}

const DEFAULT_STORE_INFO: StoreInfo = {
  nameAr: 'أسواق النجمة السعيدة',
  nameEn: 'Happy Star Supermarket',
  vatNumber: '300078965400003', // 15-digit Saudi VAT number
  phone: '+966 50 123 4567',
  address: 'الرياض، المملكة العربية السعودية',
};

// Seed Users
const DEFAULT_USERS: User[] = [
  { id: '1', username: 'owner', nameAr: 'المالك (أبو أحمد)', nameEn: 'Owner (Abu Ahmed)', role: 'owner', active: true },
  { id: '2', username: 'manager', nameAr: 'أحمد العتيبي', nameEn: 'Ahmed Al-Otaibi', role: 'manager', active: true },
  { id: '3', username: 'cashier', nameAr: 'خالد المحمد', nameEn: 'Khalid Al-Muhammed', role: 'cashier', active: true },
];

const API_URL = 'http://localhost:3001/api';

async function isBackendOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/status`, { signal: AbortSignal.timeout(600) });
    return res.ok;
  } catch {
    return false;
  }
}

export const dbService = {
  // Load data from localStorage or seed defaults
  init() {
    if (!localStorage.getItem(KEYS.STORE_INFO)) {
      localStorage.setItem(KEYS.STORE_INFO, JSON.stringify(DEFAULT_STORE_INFO));
    }
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(KEYS.CURRENT_USER)) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USERS[2])); // Cashier by default for demo
    }
  },

  async syncWithBackend() {
    if (await isBackendOnline()) {
      console.log('Backend online. Syncing local cache with database...');
      try {
        const storeInfo = await fetch(`${API_URL}/store-info`).then(r => r.json());
        if (storeInfo) localStorage.setItem(KEYS.STORE_INFO, JSON.stringify(storeInfo));

        const users = await fetch(`${API_URL}/users`).then(r => r.json());
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));

        const products = await fetch(`${API_URL}/products`).then(r => r.json());
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

        const suppliers = await fetch(`${API_URL}/suppliers`).then(r => r.json());
        localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(suppliers));

        const pos = await fetch(`${API_URL}/purchase-orders`).then(r => r.json());
        localStorage.setItem(KEYS.PURCHASE_ORDERS, JSON.stringify(pos));

        const invoices = await fetch(`${API_URL}/invoices`).then(r => r.json());
        localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));

        const logs = await fetch(`${API_URL}/audit-logs`).then(r => r.json());
        localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs));
        console.log('Synchronization completed.');
      } catch (err) {
        console.error('Database synchronization failed:', err);
      }
    } else {
      console.log('Backend offline. Running on LocalStorage cached data.');
    }
  },

  // Generic helpers
  get<T>(key: string): T {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : [] as unknown as T;
  },

  set<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  },

  async logAudit(action: string, details: string) {
    const currentUser = this.getCurrentUser();
    
    if (await isBackendOnline()) {
      try {
        await fetch(`${API_URL}/audit-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, details, currentUser }),
        });
      } catch (err) {
        console.error('Failed to log audit to backend:', err);
      }
    }

    const logs = this.get<AuditLog[]>(KEYS.AUDIT_LOGS);
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.nameAr,
      role: currentUser.role,
      action,
      details,
    };
    logs.unshift(newLog);
    this.set(KEYS.AUDIT_LOGS, logs);
  },

  // Store Settings
  getStoreInfo(): StoreInfo {
    return JSON.parse(localStorage.getItem(KEYS.STORE_INFO) || JSON.stringify(DEFAULT_STORE_INFO));
  },

  async updateStoreInfo(info: StoreInfo) {
    if (await isBackendOnline()) {
      try {
        await fetch(`${API_URL}/store-info`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...info, currentUser: this.getCurrentUser() }),
        });
      } catch (err) {
        console.error('Failed to update store info on backend:', err);
      }
    }

    localStorage.setItem(KEYS.STORE_INFO, JSON.stringify(info));
    this.logAudit('STORE_INFO_UPDATE', `Updated store name: ${info.nameAr}, VAT: ${info.vatNumber}`);
  },

  // Current User
  getCurrentUser(): User {
    return JSON.parse(localStorage.getItem(KEYS.CURRENT_USER) || JSON.stringify(DEFAULT_USERS[2]));
  },

  setCurrentUser(user: User) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    this.logAudit('USER_LOGIN', `Switched active profile to ${user.nameEn} (${user.role})`);
  },

  getUsers(): User[] {
    return this.get<User[]>(KEYS.USERS);
  },

  // Products CRUD
  getProducts(): Product[] {
    return this.get<Product[]>(KEYS.PRODUCTS);
  },

  async saveProduct(product: Product): Promise<Product> {
    if (await isBackendOnline()) {
      try {
        const saved = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product, currentUser: this.getCurrentUser() }),
        }).then(r => r.json());
        
        // Update local cache
        const products = this.getProducts();
        const idx = products.findIndex(p => p.id === saved.id);
        if (idx !== -1) {
          products[idx] = saved;
        } else {
          products.push(saved);
        }
        this.set(KEYS.PRODUCTS, products);
        return saved;
      } catch (err) {
        console.error('Failed to save product to backend:', err);
      }
    }

    // Local-only save fallback
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === product.id);
    if (idx !== -1) {
      const old = products[idx];
      products[idx] = product;
      this.logAudit('PRODUCT_UPDATE', `Updated product: ${product.nameEn} (${product.barcode}). Stock changed: ${old.quantity} -> ${product.quantity}`);
    } else {
      products.push(product);
      this.logAudit('PRODUCT_CREATE', `Added new product: ${product.nameEn} (${product.barcode}), Initial Qty: ${product.quantity}`);
    }
    this.set(KEYS.PRODUCTS, products);
    return product;
  },

  async deleteProduct(id: string) {
    if (await isBackendOnline()) {
      try {
        await fetch(`${API_URL}/products/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentUser: this.getCurrentUser() }),
        });
      } catch (err) {
        console.error('Failed to delete product from backend:', err);
      }
    }

    const products = this.getProducts();
    const product = products.find(p => p.id === id);
    if (product) {
      const remaining = products.filter(p => p.id !== id);
      this.set(KEYS.PRODUCTS, remaining);
      this.logAudit('PRODUCT_DELETE', `Deleted product: ${product.nameEn} (${product.barcode})`);
    }
  },

  // Invoices & Checkout
  getInvoices(): Invoice[] {
    return this.get<Invoice[]>(KEYS.INVOICES);
  },

  async createInvoice(
    items: { product: Product; quantity: number; discount: number; customPrice?: number }[],
    paymentMethod: PaymentMethod,
    paymentDetails: { cashAmount?: number; cardAmount?: number }
  ): Promise<Invoice> {
    if (await isBackendOnline()) {
      try {
        const newInvoice = await fetch(`${API_URL}/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            paymentMethod,
            paymentDetails,
            currentUser: this.getCurrentUser(),
          }),
        }).then(r => {
          if (!r.ok) throw new Error('Backend failed checkout');
          return r.json();
        });

        // Cache invoice in LocalStorage
        const invoices = this.getInvoices();
        invoices.unshift(newInvoice);
        this.set(KEYS.INVOICES, invoices);

        // Fetch updated products to make sure local stock counts match the database
        const dbProducts = await fetch(`${API_URL}/products`).then(r => r.json());
        this.set(KEYS.PRODUCTS, dbProducts);

        // Fetch updated audit logs
        const dbLogs = await fetch(`${API_URL}/audit-logs`).then(r => r.json());
        this.set(KEYS.AUDIT_LOGS, dbLogs);

        return newInvoice;
      } catch (err) {
        console.error('Failed to complete checkout on backend, falling back to local DB:', err);
      }
    }

    // Local-only checkout fallback
    const store = this.getStoreInfo();
    const products = this.getProducts();
    const currentUser = this.getCurrentUser();

    // Map items
    const invoiceItems = items.map(item => {
      const p = item.product;
      const basePrice = item.customPrice !== undefined ? item.customPrice : p.sellingPrice;
      const subtotal = item.quantity * basePrice * (1 - item.discount / 100);
      const vatAmount = subtotal * 0.15;
      const total = subtotal + vatAmount;

      const prodInDb = products.find(prod => prod.id === p.id);
      if (prodInDb) {
        prodInDb.quantity = Math.max(0, prodInDb.quantity - item.quantity);
      }

      return {
        productId: p.id,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        quantity: item.quantity,
        sellingPrice: basePrice,
        costPrice: p.costPrice,
        discount: item.discount,
        taxRate: 0.15,
        subtotal,
        vatAmount,
        total,
      };
    });

    this.set(KEYS.PRODUCTS, products);

    const subtotal = invoiceItems.reduce((acc, item) => acc + item.subtotal, 0);
    const vatAmount = invoiceItems.reduce((acc, item) => acc + item.vatAmount, 0);
    const total = subtotal + vatAmount;

    const invoices = this.getInvoices();
    const invSeq = invoices.length + 1001;
    const invoiceNumber = `INV-2026-${invSeq}`;
    const timestamp = new Date().toISOString();

    const zatcaQrCode = generateZatcaBase64(
      store.nameAr,
      store.vatNumber,
      timestamp,
      total,
      vatAmount
    );

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      date: timestamp,
      items: invoiceItems,
      subtotal,
      discountAmount: items.reduce((acc, item) => {
        const base = item.customPrice !== undefined ? item.customPrice : item.product.sellingPrice;
        return acc + (item.quantity * base * (item.discount / 100));
      }, 0),
      vatAmount,
      total,
      paymentMethod,
      paymentDetails,
      zatcaQrCode,
      cashierId: currentUser.id,
      cashierName: currentUser.nameAr,
    };

    invoices.unshift(newInvoice);
    this.set(KEYS.INVOICES, invoices);

    this.logAudit('SALES_CHECKOUT', `Completed sale ${invoiceNumber}, Total: ${total.toFixed(2)} SAR, items count: ${invoiceItems.length}`);

    invoiceItems.forEach(item => {
      const prodInDb = products.find(prod => prod.id === item.productId);
      if (prodInDb && prodInDb.quantity <= prodInDb.lowStockThreshold) {
        this.logAudit('STOCK_ALERT', `Low stock warning: ${prodInDb.nameEn} quantity is now ${prodInDb.quantity} (threshold: ${prodInDb.lowStockThreshold})`);
      }
    });

    return newInvoice;
  },

  // Suppliers CRUD
  getSuppliers(): Supplier[] {
    return this.get<Supplier[]>(KEYS.SUPPLIERS);
  },

  async saveSupplier(supplier: Supplier): Promise<Supplier> {
    if (await isBackendOnline()) {
      try {
        const saved = await fetch(`${API_URL}/suppliers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplier, currentUser: this.getCurrentUser() }),
        }).then(r => r.json());

        // Update local cache
        const suppliers = this.getSuppliers();
        const idx = suppliers.findIndex(s => s.id === saved.id);
        if (idx !== -1) {
          suppliers[idx] = saved;
        } else {
          suppliers.push(saved);
        }
        this.set(KEYS.SUPPLIERS, suppliers);
        return saved;
      } catch (err) {
        console.error('Failed to save supplier to backend:', err);
      }
    }

    const suppliers = this.getSuppliers();
    const idx = suppliers.findIndex(s => s.id === supplier.id);
    if (idx !== -1) {
      suppliers[idx] = supplier;
      this.logAudit('SUPPLIER_UPDATE', `Updated supplier: ${supplier.name}`);
    } else {
      suppliers.push(supplier);
      this.logAudit('SUPPLIER_CREATE', `Created supplier: ${supplier.name}`);
    }
    this.set(KEYS.SUPPLIERS, suppliers);
    return supplier;
  },

  async deleteSupplier(id: string) {
    if (await isBackendOnline()) {
      try {
        await fetch(`${API_URL}/suppliers/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentUser: this.getCurrentUser() }),
        });
      } catch (err) {
        console.error('Failed to delete supplier from backend:', err);
      }
    }

    const suppliers = this.getSuppliers();
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      const remaining = suppliers.filter(s => s.id !== id);
      this.set(KEYS.SUPPLIERS, remaining);
      this.logAudit('SUPPLIER_DELETE', `Deleted supplier: ${supplier.name}`);
    }
  },

  async paySupplier(id: string, amount: number) {
    if (await isBackendOnline()) {
      try {
        await fetch(`${API_URL}/suppliers/${id}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currentUser: this.getCurrentUser() }),
        });

        // Sync suppliers from database to cache
        const dbSuppliers = await fetch(`${API_URL}/suppliers`).then(r => r.json());
        this.set(KEYS.SUPPLIERS, dbSuppliers);

        // Sync logs
        const dbLogs = await fetch(`${API_URL}/audit-logs`).then(r => r.json());
        this.set(KEYS.AUDIT_LOGS, dbLogs);
        return;
      } catch (err) {
        console.error('Failed to pay supplier on backend:', err);
      }
    }

    const sList = this.getSuppliers();
    const sup = sList.find(s => s.id === id);
    if (sup) {
      sup.balance -= amount;
      this.saveSupplier(sup);
      this.logAudit('SUPPLIER_PAYMENT', `Paid ${amount.toFixed(2)} SAR to supplier ${sup.name}`);
    }
  },

  // Purchase Orders
  getPurchaseOrders(): PurchaseOrder[] {
    return this.get<PurchaseOrder[]>(KEYS.PURCHASE_ORDERS);
  },

  async savePurchaseOrder(po: PurchaseOrder): Promise<PurchaseOrder> {
    if (await isBackendOnline()) {
      try {
        const saved = await fetch(`${API_URL}/purchase-orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ po, currentUser: this.getCurrentUser() }),
        }).then(r => r.json());

        // Update local cache
        const pos = this.getPurchaseOrders();
        const idx = pos.findIndex(p => p.id === saved.id);
        if (idx !== -1) {
          pos[idx] = saved;
        } else {
          pos.push(saved);
        }
        this.set(KEYS.PURCHASE_ORDERS, pos);
        return saved;
      } catch (err) {
        console.error('Failed to save purchase order to backend:', err);
      }
    }

    const pos = this.getPurchaseOrders();
    const idx = pos.findIndex(p => p.id === po.id);
    if (idx !== -1) {
      pos[idx] = po;
      this.logAudit('PO_UPDATE', `Updated Purchase Order: ${po.poNumber}, Status: ${po.status}`);
    } else {
      pos.push(po);
      this.logAudit('PO_CREATE', `Created Purchase Order: ${po.poNumber} for supplier ${po.supplierName}`);
    }
    this.set(KEYS.PURCHASE_ORDERS, pos);
    return po;
  },

  async receivePurchaseOrder(id: string) {
    if (await isBackendOnline()) {
      try {
        await fetch(`${API_URL}/purchase-orders/${id}/receive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentUser: this.getCurrentUser() }),
        });

        // Sync POs, products, and suppliers
        const dbPos = await fetch(`${API_URL}/purchase-orders`).then(r => r.json());
        this.set(KEYS.PURCHASE_ORDERS, dbPos);

        const dbProducts = await fetch(`${API_URL}/products`).then(r => r.json());
        this.set(KEYS.PRODUCTS, dbProducts);

        const dbSuppliers = await fetch(`${API_URL}/suppliers`).then(r => r.json());
        this.set(KEYS.SUPPLIERS, dbSuppliers);

        const dbLogs = await fetch(`${API_URL}/audit-logs`).then(r => r.json());
        this.set(KEYS.AUDIT_LOGS, dbLogs);
        return;
      } catch (err) {
        console.error('Failed to receive purchase order on backend:', err);
      }
    }

    const pos = this.getPurchaseOrders();
    const poIdx = pos.findIndex(p => p.id === id);
    if (poIdx !== -1 && pos[poIdx].status === 'pending') {
      const po = pos[poIdx];
      po.status = 'received';
      po.receivedDate = new Date().toISOString();
      
      const products = this.getProducts();
      po.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          prod.quantity += item.quantity;
          prod.costPrice = item.costPrice;
        }
      });
      this.set(KEYS.PRODUCTS, products);

      const suppliers = this.getSuppliers();
      const supplierIdx = suppliers.findIndex(s => s.id === po.supplierId);
      if (supplierIdx !== -1) {
        suppliers[supplierIdx].balance += po.total;
        this.set(KEYS.SUPPLIERS, suppliers);
      }

      pos[poIdx] = po;
      this.set(KEYS.PURCHASE_ORDERS, pos);
      this.logAudit('PO_RECEIVE', `Received Purchase Order: ${po.poNumber}, inventory stock updated for ${po.items.length} items`);
    }
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(KEYS.AUDIT_LOGS);
  },

  // Bulk CSV Import
  async importProductsFromCSV(csvText: string): Promise<{ successCount: number; errors: string[] }> {
    const lines = csvText.split('\n');
    const products = this.getProducts();
    let successCount = 0;
    const errors: string[] = [];
    const parsedProducts: Product[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
      if (cols.length < 8) {
        errors.push(`Line ${i+1}: Insufficient columns. Minimum required: 8`);
        continue;
      }

      const [barcode, nameAr, nameEn, category, costPriceStr, sellingPriceStr, quantityStr, unit, thresholdStr] = cols;
      const costPrice = parseFloat(costPriceStr);
      const sellingPrice = parseFloat(sellingPriceStr);
      const quantity = parseInt(quantityStr, 10);
      const lowStockThreshold = thresholdStr ? parseInt(thresholdStr, 10) : 5;

      if (isNaN(costPrice) || isNaN(sellingPrice) || isNaN(quantity)) {
        errors.push(`Line ${i+1}: Invalid numbers for cost, selling price, or quantity`);
        continue;
      }

      if (!barcode || !nameAr || !nameEn) {
        errors.push(`Line ${i+1}: Barcode, Arabic Name, and English Name are required`);
        continue;
      }

      const existingIdx = products.findIndex(p => p.barcode === barcode);
      const productData: Product = {
        id: existingIdx !== -1 ? products[existingIdx].id : `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        barcode,
        nameAr,
        nameEn,
        category,
        costPrice,
        sellingPrice,
        quantity,
        unit: unit || 'pcs',
        lowStockThreshold,
        isPerishable: false,
      };

      parsedProducts.push(productData);
      successCount++;
    }

    if (successCount > 0) {
      if (await isBackendOnline()) {
        try {
          await fetch(`${API_URL}/products/import-csv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productsList: parsedProducts, currentUser: this.getCurrentUser() }),
          });
        } catch (err) {
          console.error('Failed to import products to backend:', err);
        }
      }

      // Update local storage
      const allProducts = this.getProducts();
      parsedProducts.forEach(p => {
        const idx = allProducts.findIndex(ap => ap.barcode === p.barcode);
        if (idx !== -1) {
          allProducts[idx] = p;
        } else {
          allProducts.push(p);
        }
      });
      this.set(KEYS.PRODUCTS, allProducts);
      this.logAudit('PRODUCT_IMPORT', `Successfully imported ${successCount} products via CSV`);
    }

    return { successCount, errors };
  },

  // Export CSV
  exportProductsToCSV(): string {
    const products = this.getProducts();
    const headers = 'barcode,nameAr,nameEn,category,costPrice,sellingPrice,quantity,unit,lowStockThreshold,isPerishable,expiryDate';
    const rows = products.map(p => 
      `"${p.barcode}","${p.nameAr}","${p.nameEn}","${p.category}",${p.costPrice},${p.sellingPrice},${p.quantity},"${p.unit}",${p.lowStockThreshold},${p.isPerishable},"${p.expiryDate || ''}"`
    );
    return [headers, ...rows].join('\n');
  }
};
