import type { Product, Invoice, Supplier, PurchaseOrder, User, AuditLog, PaymentMethod } from '../types';

// Store info interface — shared between frontend and backend
export interface StoreInfo {
  nameAr: string;
  nameEn: string;
  vatNumber: string;
  phone: string;
  address: string;
}

// API base URL — reads from Vite env or defaults to the dev proxy
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ── Helpers ──────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

function del<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined });
}

// ── API Service ──────────────────────────────────────────────────────

export const apiService = {
  // ── Status ───────────────────────────────────────────────────────
  checkStatus(): Promise<{ status: string; dbType: string }> {
    return get('/status');
  },

  // ── Store Info ───────────────────────────────────────────────────
  getStoreInfo(): Promise<StoreInfo | null> {
    return get<StoreInfo | null>('/store-info');
  },

  async updateStoreInfo(info: StoreInfo): Promise<void> {
    await put('/store-info', { ...info});
  },

  // ── Users ────────────────────────────────────────────────────────
  getUsers(): Promise<User[]> {
    return get<User[]>('/users');
  },

  // ── Authentication ─────────────────────────────────────────────────
  login(username: string, password: string): Promise<User> {
    return post<User>('/auth/login', { username, password });
  },

  logout(): Promise<{ message: string }> {
    return post<{ message: string }>('/auth/logout', {});
  },

  verifyAuth(): Promise<User> {
    return get<User>('/auth/verify');
  },

  // ── Products ─────────────────────────────────────────────────────
  getProducts(): Promise<Product[]> {
    return get<Product[]>('/products');
  },

  saveProduct(product: Product): Promise<Product> {
    return post<Product>('/products', { product});
  },

  deleteProduct(id: string): Promise<{ success: boolean }> {
    return del<{ success: boolean }>(`/products/${id}`, {});
  },

  importProductsFromCSV(productsList: Product[]): Promise<{ successCount: number }> {
    return post<{ successCount: number }>('/products/import-csv', { productsList});
  },

  // ── Invoices ─────────────────────────────────────────────────────
  getInvoices(): Promise<Invoice[]> {
    return get<Invoice[]>('/invoices');
  },

  createInvoice(
    items: { product: Product; quantity: number; discount: number; customPrice?: number }[],
    paymentMethod: PaymentMethod,
    paymentDetails: { cashAmount?: number; cardAmount?: number }
  ): Promise<Invoice> {
    return post<Invoice>('/invoices', {
      items,
      paymentMethod,
      paymentDetails,
    });
  },

  // ── Suppliers ────────────────────────────────────────────────────
  getSuppliers(): Promise<Supplier[]> {
    return get<Supplier[]>('/suppliers');
  },

  saveSupplier(supplier: Supplier): Promise<Supplier> {
    return post<Supplier>('/suppliers', { supplier});
  },

  deleteSupplier(id: string): Promise<{ success: boolean }> {
    return del<{ success: boolean }>(`/suppliers/${id}`, {});
  },

  paySupplier(id: string, amount: number): Promise<{ success: boolean }> {
    return post<{ success: boolean }>(`/suppliers/${id}/pay`, { amount});
  },

  // ── Purchase Orders ──────────────────────────────────────────────
  getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return get<PurchaseOrder[]>('/purchase-orders');
  },

  savePurchaseOrder(po: PurchaseOrder): Promise<PurchaseOrder> {
    return post<PurchaseOrder>('/purchase-orders', { po});
  },

  receivePurchaseOrder(id: string): Promise<{ success: boolean }> {
    return post<{ success: boolean }>(`/purchase-orders/${id}/receive`, {});
  },

  // ── Audit Logs ───────────────────────────────────────────────────
  getAuditLogs(): Promise<AuditLog[]> {
    return get<AuditLog[]>('/audit-logs');
  },

  logAudit(action: string, details: string): Promise<{ success: boolean }> {
    return post<{ success: boolean }>('/audit-logs', { action, details});
  },

  // ── CSV Parsing (client-side utility) ────────────────────────────
  parseCSV(csvText: string): { products: Product[]; errors: string[] } {
    const lines = csvText.split('\n');
    const products: Product[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
      if (cols.length < 8) {
        errors.push(`Line ${i + 1}: Insufficient columns. Minimum required: 8`);
        continue;
      }

      const [barcode, nameAr, nameEn, category, costPriceStr, sellingPriceStr, quantityStr, unit, thresholdStr] = cols;
      const costPrice = parseFloat(costPriceStr);
      const sellingPrice = parseFloat(sellingPriceStr);
      const quantity = parseInt(quantityStr, 10);
      const lowStockThreshold = thresholdStr ? parseInt(thresholdStr, 10) : 5;

      if (isNaN(costPrice) || isNaN(sellingPrice) || isNaN(quantity)) {
        errors.push(`Line ${i + 1}: Invalid numbers for cost, selling price, or quantity`);
        continue;
      }

      if (!barcode || !nameAr || !nameEn) {
        errors.push(`Line ${i + 1}: Barcode, Arabic Name, and English Name are required`);
        continue;
      }

      products.push({
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
      });
    }

    return { products, errors };
  },

  // ── CSV Export (client-side utility) ─────────────────────────────
  exportProductsToCSV(products: Product[]): string {
    const headers = 'barcode,nameAr,nameEn,category,costPrice,sellingPrice,quantity,unit,lowStockThreshold,isPerishable,expiryDate';
    const rows = products.map(p =>
      `"${p.barcode}","${p.nameAr}","${p.nameEn}","${p.category}",${p.costPrice},${p.sellingPrice},${p.quantity},"${p.unit}",${p.lowStockThreshold},${p.isPerishable},"${p.expiryDate || ''}"`
    );
    return [headers, ...rows].join('\n');
  },
};
