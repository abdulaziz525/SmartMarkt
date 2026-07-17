export interface Product {
  id: string;
  barcode: string;
  nameAr: string;
  nameEn: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  unit: string; // e.g., 'kg', 'pcs', 'pack'
  lowStockThreshold: number;
  expiryDate?: string; // YYYY-MM-DD
  isPerishable: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // percentage (0-100) or flat amount? Let's use percentage.
  customPrice?: number; // override selling price if permitted
}

export type PaymentMethod = 'cash' | 'card' | 'split';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string
  items: {
    productId: string;
    nameAr: string;
    nameEn: string;
    quantity: number;
    sellingPrice: number;
    costPrice: number;
    discount: number;
    taxRate: number; // 0.15 for ZATCA (15%)
    subtotal: number; // qty * price * (1 - discount/100)
    vatAmount: number; // subtotal * taxRate
    total: number; // subtotal + vatAmount
  }[];
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails: {
    cashAmount?: number;
    cardAmount?: number;
  };
  zatcaQrCode: string; // base64 TLV data
  cashierId: string;
  cashierName: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  vatNumber?: string;
  balance: number; // positive = we owe them, negative = prepayments
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: {
    productId: string;
    productNameAr: string;
    productNameEn: string;
    costPrice: number;
    quantity: number;
    total: number;
  }[];
  total: number;
  status: 'pending' | 'received';
  receivedDate?: string;
}

export type UserRole = 'owner' | 'manager' | 'cashier';

export interface User {
  id: string;
  username: string;
  nameAr: string;
  nameEn: string;
  role: UserRole;
  active: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string; // e.g., 'SALES_CHECKOUT', 'STOCK_ADJUST', 'PRICE_EDIT'
  details: string;
}

export interface Branch {
  id: string;
  nameAr: string;
  nameEn: string;
  location: string;
  status: 'active' | 'inactive';
}
