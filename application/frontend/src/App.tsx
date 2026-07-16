import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Truck,
  FileText,
  History,
  Settings,
  Globe,
  User,
  Plus,
  Trash2,
  Edit3,
  Search,
  Barcode,
  X,
  FileSpreadsheet,
  AlertTriangle,
  TrendingUp,
  Printer,
  CreditCard,
  Wallet,
  ArrowRightLeft,
  Download,
  Upload
} from 'lucide-react';
import QRCode from 'qrcode';
import { apiService } from './services/api';
import { LoginPage } from './features/auth/LoginPage';
import type { StoreInfo } from './services/api';
import type { Product, CartItem, Invoice, Supplier, PurchaseOrder, User as AppUser, UserRole, AuditLog, PaymentMethod } from './types';

export default function App() {
  // Localization & Theme state
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  
  // App navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'inventory' | 'suppliers' | 'reports' | 'audit' | 'settings'>('dashboard');
  
  // Core DB-backed state
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser>({} as AppUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [posSearch, setPosSearch] = useState<string>('');
  const [posCategory, setPosCategory] = useState<string>('all');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  
  // Inventory State
  const [invSearch, setInvSearch] = useState<string>('');
  const [invCategory, setInvCategory] = useState<string>('all');
  const [invAlertFilter, setInvAlertFilter] = useState<'all' | 'low' | 'expiry'>('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [csvFileContent, setCsvFileContent] = useState<string>('');

  // Suppliers & PO State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState<boolean>(false);
  const [selectedPoSupplier, setSelectedPoSupplier] = useState<string>('');
  const [poItems, setPoItems] = useState<{ product: Product; costPrice: number; quantity: number }[]>([]);
  const [poProductSearch, setPoProductSearch] = useState<string>('');

  // Reports State
  const [reportRange, setReportRange] = useState<'today' | '7days' | 'month'>('7days');

  // QR Code URL for active receipt
  const [receiptQrUrl, setReceiptQrUrl] = useState<string>('');

  // Barcode input focus ref
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Verify Auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await apiService.verifyAuth();
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch all data from the backend API
  const refreshData = async () => {
    try {
      const [productsData, invoicesData, suppliersData, posData, logsData, storeData, usersData] = await Promise.all([
        apiService.getProducts(),
        apiService.getInvoices(),
        apiService.getSuppliers(),
        apiService.getPurchaseOrders(),
        apiService.getAuditLogs(),
        apiService.getStoreInfo(),
        apiService.getUsers(),
      ]);
      setProducts(productsData);
      setInvoices(invoicesData);
      setSuppliers(suppliersData);
      setPurchaseOrders(posData);
      setLogs(logsData);
      if (storeData) setStoreInfo(storeData);
      setUsersList(usersData);
    } catch (err) {
      console.error('Failed to refresh data from API:', err);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      await refreshData();
      setIsLoading(false);
    };
    initApp();
  }, []);

  // Set document direction
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Generate QR Code URL when receipt invoice changes
  useEffect(() => {
    if (activeInvoice?.zatcaQrCode) {
      QRCode.toDataURL(activeInvoice.zatcaQrCode, { width: 140, margin: 1 })
        .then(url => setReceiptQrUrl(url))
        .catch(err => console.error('QR Gen Error:', err));
    } else {
      setReceiptQrUrl('');
    }
  }, [activeInvoice]);

  // Focus barcode input on POS load
  useEffect(() => {
    if (activeTab === 'pos' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [activeTab]);

  // Helper translations dictionary
  const t = {
    dashboard: { ar: 'الرئيسية', en: 'Dashboard' },
    pos: { ar: 'نقطة البيع', en: 'POS Sales' },
    inventory: { ar: 'المخزون', en: 'Inventory' },
    suppliers: { ar: 'الموردين والمشتريات', en: 'Suppliers & POs' },
    reports: { ar: 'التقارير والمحاسبة', en: 'Reports' },
    audit: { ar: 'سجل العمليات', en: 'Audit Logs' },
    settings: { ar: 'الإعدادات', en: 'Settings' },
    arabic: { ar: 'العربية', en: 'Arabic' },
    english: { ar: 'English', en: 'English' },
    currency: { ar: 'ريال', en: 'SAR' },
    vat: { ar: 'ضريبة القيمة المضافة (15%)', en: 'VAT (15%)' },
    total: { ar: 'المجموع الإجمالي', en: 'Total Amount' },
    subtotal: { ar: 'المجموع الفرعي', en: 'Subtotal' },
    discount: { ar: 'الخصم', en: 'Discount' },
    cashier: { ar: 'أمين الصندوق', en: 'Cashier' },
    manager: { ar: 'مدير الفرع', en: 'Manager' },
    owner: { ar: 'المالك', en: 'Owner' },
    lowStock: { ar: 'مخزون منخفض', en: 'Low Stock' },
    expiringSoon: { ar: 'قريب الانتهاء', en: 'Expiring Soon' },
    barcode: { ar: 'الباركود', en: 'Barcode' },
    productName: { ar: 'اسم المنتج', en: 'Product Name' },
    category: { ar: 'الفئة', en: 'Category' },
    sellingPrice: { ar: 'سعر البيع', en: 'Selling Price' },
    costPrice: { ar: 'سعر التكلفة', en: 'Cost Price' },
    quantity: { ar: 'الكمية', en: 'Quantity' },
    unit: { ar: 'الوحدة', en: 'Unit' },
    actions: { ar: 'الإجراءات', en: 'Actions' },
    add: { ar: 'إضافة', en: 'Add' },
    save: { ar: 'حفظ', en: 'Save' },
    cancel: { ar: 'إلغاء', en: 'Cancel' },
  };

  const getTrans = (key: keyof typeof t) => t[key][lang];

  

  // Check if role is authorized
  const hasAccess = (requiredRoles: UserRole[]): boolean => {
    return requiredRoles.includes(currentUser.role);
  };

  // Categories helper
  const uniqueCategories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // ----------------------------------------------------
  // POS Action Handlers
  // ----------------------------------------------------
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const prod = products.find(p => p.barcode === barcodeInput.trim());
    if (prod) {
      addToCart(prod);
      setBarcodeInput('');
    } else {
      alert(lang === 'ar' ? 'المنتج غير موجود!' : 'Product not found!');
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        alert(lang === 'ar' ? 'الكمية المطلوبة تتجاوز المخزون المتوفر!' : 'Requested quantity exceeds available stock!');
        return;
      }
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      if (product.quantity <= 0) {
        alert(lang === 'ar' ? 'هذا المنتج نفذ من المخزون!' : 'This product is out of stock!');
        return;
      }
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const item = cart.find(c => c.product.id === productId);
    if (item && quantity > item.product.quantity) {
      alert(lang === 'ar' ? 'الكمية المطلوبة تتجاوز المخزون المتوفر!' : 'Requested quantity exceeds available stock!');
      return;
    }

    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const updateCartDiscount = (productId: string, discount: number) => {
    const validatedDiscount = Math.min(100, Math.max(0, discount));
    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, discount: validatedDiscount } : item
    ));
  };

  const updateCartCustomPrice = (productId: string, customPrice: number) => {
    if (!hasAccess(['owner', 'manager'])) {
      alert(lang === 'ar' ? 'عذراً، تعديل السعر متاح فقط للمدراء والملاك!' : 'Price modification is restricted to managers and owners!');
      return;
    }
    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, customPrice } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateCartTotals = () => {
    let subtotal = 0;
    let discountTotal = 0;
    cart.forEach(item => {
      const price = item.customPrice !== undefined ? item.customPrice : item.product.sellingPrice;
      const itemSub = item.quantity * price;
      const itemDisc = itemSub * (item.discount / 100);
      subtotal += itemSub - itemDisc;
      discountTotal += itemDisc;
    });

    const vatAmount = subtotal * 0.15;
    const total = subtotal + vatAmount;

    return { subtotal, discountTotal, vatAmount, total };
  };

  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) return;
    
    const { total } = calculateCartTotals();
    const parsedCash = parseFloat(cashReceived) || 0;
    
    if (paymentMethod === 'cash' && parsedCash < total) {
      alert(lang === 'ar' ? 'المبلغ المستلم أقل من الإجمالي!' : 'Cash received is less than total!');
      return;
    }

    // Process checkout in local database
    const checkoutItems = cart.map(item => ({
      product: item.product,
      quantity: item.quantity,
      discount: item.discount,
      customPrice: item.customPrice,
    }));

    const details = {
      cashAmount: paymentMethod === 'cash' ? total : paymentMethod === 'split' ? parsedCash : 0,
      cardAmount: paymentMethod === 'card' ? total : paymentMethod === 'split' ? (total - parsedCash) : 0,
    };

    const newInvoice = await apiService.createInvoice(checkoutItems, paymentMethod, details);
    
    setActiveInvoice(newInvoice);
    setCart([]);
    setIsCheckoutOpen(false);
    setCashReceived('');
    await refreshData();
  };

  // ----------------------------------------------------
  // Inventory Action Handlers
  // ----------------------------------------------------
  const handleProductSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.barcode || !editingProduct.nameAr || !editingProduct.nameEn) {
      alert(lang === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    await apiService.saveProduct(editingProduct);
    setIsProductModalOpen(false);
    setEditingProduct(null);
    await refreshData();
  };

  const handleProductDelete = async (id: string) => {
    if (!hasAccess(['owner', 'manager'])) {
      alert(lang === 'ar' ? 'لا تملك الصلاحية للحدف!' : 'You do not have permission to delete products!');
      return;
    }
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?')) {
      await apiService.deleteProduct(id);
      await refreshData();
    }
  };

  const handleCsvImport = async () => {
    if (!csvFileContent.trim()) {
      alert(lang === 'ar' ? 'الرجاء إدخال بيانات CSV أولاً' : 'Please input CSV data first');
      return;
    }
    const { products: parsedProducts, errors } = apiService.parseCSV(csvFileContent);
    if (errors.length > 0) {
      alert((lang === 'ar' ? 'تم استيراد بعض المنتجات مع وجود أخطاء: \n' : 'Imported with errors: \n') + errors.slice(0, 5).join('\n'));
    }
    if (parsedProducts.length > 0) {
      const result = await apiService.importProductsFromCSV(parsedProducts);
      alert(lang === 'ar' ? `تم استيراد ${result.successCount} منتج بنجاح!` : `Successfully imported ${result.successCount} products!`);
    }
    setCsvFileContent('');
    await refreshData();
  };

  const handleCsvExport = () => {
    const csv = apiService.exportProductsToCSV(products);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `SmartMarkt_Products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----------------------------------------------------
  // Supplier & PO Handlers
  // ----------------------------------------------------
  const handleSupplierSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const supplier: Supplier = {
      id: editingSupplier?.id || `sup-${Date.now()}`,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      vatNumber: formData.get('vatNumber') as string || undefined,
      balance: editingSupplier?.balance || 0,
    };

    await apiService.saveSupplier(supplier);
    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
    await refreshData();
  };

  const handleSupplierDelete = async (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا المورد؟' : 'Are you sure you want to delete this supplier?')) {
      await apiService.deleteSupplier(id);
      await refreshData();
    }
  };

  const handleSupplierPayoff = async (id: string, amount: number) => {
    if (amount <= 0) return;
    await apiService.paySupplier(id, amount);
    await refreshData();
  };

  const addToPoCart = (product: Product) => {
    const existing = poItems.find(item => item.product.id === product.id);
    if (existing) {
      setPoItems(poItems.map(item => 
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setPoItems([...poItems, { product, costPrice: product.costPrice, quantity: 1 }]);
    }
  };

  const handlePoSubmit = async () => {
    if (!selectedPoSupplier) {
      alert(lang === 'ar' ? 'الرجاء اختيار مورد' : 'Please select a supplier');
      return;
    }
    if (poItems.length === 0) {
      alert(lang === 'ar' ? 'الرجاء إضافة منتجات لأمر الشراء' : 'Please add products to the PO');
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedPoSupplier);
    if (!supplier) return;

    const total = poItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);
    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${purchaseOrders.length + 1001}`,
      date: new Date().toISOString(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: poItems.map(item => ({
        productId: item.product.id,
        productNameAr: item.product.nameAr,
        productNameEn: item.product.nameEn,
        costPrice: item.costPrice,
        quantity: item.quantity,
        total: item.costPrice * item.quantity,
      })),
      total,
      status: 'pending',
    };

    await apiService.savePurchaseOrder(newPo);
    setPoItems([]);
    setSelectedPoSupplier('');
    setIsPoModalOpen(false);
    await refreshData();
  };

  const handlePoReceive = async (poId: string) => {
    await apiService.receivePurchaseOrder(poId);
    await refreshData();
  };

  // ----------------------------------------------------
  // Reports & Calculations
  // ----------------------------------------------------
  const filteredInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.date);
    const limit = new Date();
    if (reportRange === 'today') {
      return invDate.toDateString() === limit.toDateString();
    } else if (reportRange === '7days') {
      limit.setDate(limit.getDate() - 7);
      return invDate >= limit;
    } else {
      limit.setDate(limit.getDate() - 30);
      return invDate >= limit;
    }
  });

  const reportMetrics = (() => {
    let salesTotal = 0;
    let costTotal = 0;
    let vatCollected = 0;
    let discountTotal = 0;
    
    filteredInvoices.forEach(inv => {
      salesTotal += inv.total;
      vatCollected += inv.vatAmount;
      discountTotal += inv.discountAmount;
      inv.items.forEach(item => {
        costTotal += (item.costPrice * item.quantity);
      });
    });

    const netProfit = (salesTotal - vatCollected) - costTotal;

    return {
      salesTotal,
      costTotal,
      vatCollected,
      discountTotal,
      netProfit,
      count: filteredInvoices.length,
    };
  })();

  // Group invoices by date for charts
  const getSalesHistoryData = () => {
    const dataMap: { [date: string]: { sales: number; profit: number } } = {};
    
    // Fill last 7 days with zeros initially
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' });
      dataMap[dateStr] = { sales: 0, profit: 0 };
    }

    invoices.forEach(inv => {
      const d = new Date(inv.date);
      const dateStr = d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' });
      if (dataMap[dateStr] !== undefined) {
        dataMap[dateStr].sales += inv.total;
        
        let cost = 0;
        inv.items.forEach(it => { cost += it.costPrice * it.quantity; });
        dataMap[dateStr].profit += (inv.total - inv.vatAmount) - cost;
      }
    });

    return Object.entries(dataMap).map(([date, vals]) => ({
      date,
      sales: parseFloat(vals.sales.toFixed(1)),
      profit: parseFloat(vals.profit.toFixed(1)),
    }));
  };

  const salesHistory = getSalesHistoryData();
  const maxSalesVal = Math.max(...salesHistory.map(d => d.sales), 100);

  // Best selling products calculation
  const getBestSellers = () => {
    const counts: { [id: string]: { name: string; qty: number; total: number } } = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!counts[item.productId]) {
          counts[item.productId] = {
            name: lang === 'ar' ? item.nameAr : item.nameEn,
            qty: 0,
            total: 0
          };
        }
        counts[item.productId].qty += item.quantity;
        counts[item.productId].total += item.total;
      });
    });

    return Object.values(counts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  };

  const bestSellers = getBestSellers();

  // Low stock and expiring alerts count
  const lowStockCount = products.filter(p => p.quantity <= p.lowStockThreshold).length;
  
  const perishableAlerts = products.filter(p => {
    if (!p.isPerishable || !p.expiryDate) return false;
    const exp = new Date(p.expiryDate);
    const today = new Date();
    const diff = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Alert if within 7 days
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <div className="text-indigo-400 font-medium">
          {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="animate-pulse">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => {
      setIsAuthenticated(true);
      window.location.reload();
    }} />;
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white`}>
      {/* Top Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-extrabold text-lg text-white">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {lang === 'ar' ? storeInfo?.nameAr : storeInfo?.nameEn}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              VAT: {storeInfo?.vatNumber}
            </p>
          </div>
        </div>

        {/* Global Controls & Status Bar */}
        <div className="flex items-center gap-4">
          {/* Dashboard Quick Alerts */}
          {(lowStockCount > 0 || perishableAlerts.length > 0) && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                {lang === 'ar' 
                  ? `${lowStockCount} منتجات منخفضة، ${perishableAlerts.length} قاربت على الانتهاء` 
                  : `${lowStockCount} low stock, ${perishableAlerts.length} expiring soon`}
              </span>
            </div>
          )}

          {/* Profile Switcher */}
          {/* Logout Button */}
          <button
            onClick={async () => {
              await apiService.logout();
              setIsAuthenticated(false);
              window.location.reload();
            }}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
          >
            <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
          >
            <Globe className="h-4 w-4 text-indigo-400" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          <nav className="flex-1 p-4 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>{lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'pos'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span>{lang === 'ar' ? 'نقطة البيع الكاشير' : 'POS Sales Screen'}</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Package className="h-5 w-5" />
              <span>{lang === 'ar' ? 'إدارة المخزون' : 'Inventory Stock'}</span>
            </button>

            <button
              onClick={() => setActiveTab('suppliers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'suppliers'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Truck className="h-5 w-5" />
              <span>{lang === 'ar' ? 'الموردين وأوامر الشراء' : 'Suppliers & POs'}</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'reports'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>{lang === 'ar' ? 'التقارير والمحاسبة' : 'Reports & Accounting'}</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'audit'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <History className="h-5 w-5" />
              <span>{lang === 'ar' ? 'سجل العمليات والرقابة' : 'Audit Logs'}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>{lang === 'ar' ? 'إعدادات النظام' : 'Settings'}</span>
            </button>
          </nav>

          {/* Quick Stats Sidebar footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-2">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              {lang === 'ar' ? 'صلاحيات الحساب الحالي' : 'Active Profile Role'}
            </div>
            <div className="flex items-center gap-2 text-sm text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              {lang === 'ar' ? getTrans(currentUser.role as keyof typeof t) : currentUser.role.toUpperCase()}
            </div>
          </div>
        </aside>

        {/* Dynamic Inner Workspace Page */}
        <main className="flex-1 bg-slate-950 overflow-y-auto p-6 md:p-8">
          
          {/* ========================================================
              TAB: DASHBOARD
              ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {lang === 'ar' ? 'مرحباً بك في لوحة تحكم SmartMarkt' : 'Welcome to SmartMarkt'}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {lang === 'ar' ? 'ملخص مبيعات اليوم والوضع الحالي للمتجر' : 'Quick summary of today\'s activities and metrics.'}
                  </p>
                </div>
                <div className="text-sm text-slate-400 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 font-mono">
                  {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Numerical Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition"></div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {lang === 'ar' ? 'مبيعات اليوم المحققة' : 'Today\'s Total Sales'}
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white">
                    {filteredInvoices.reduce((a, c) => a + c.total, 0).toFixed(2)} <span className="text-sm text-indigo-400 font-semibold">{getTrans('currency')}</span>
                  </div>
                  <div className="mt-1 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12% {lang === 'ar' ? 'منذ الأمس' : 'vs yesterday'}</span>
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 h-24 w-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition"></div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {lang === 'ar' ? 'عدد فواتير المبيعات' : 'Sales Invoice Count'}
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white">
                    {filteredInvoices.length} <span className="text-sm text-purple-400 font-semibold">{lang === 'ar' ? 'فاتورة' : 'bills'}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-mono">
                    {lang === 'ar' ? 'متوسط الفاتورة:' : 'Avg basket:'} {(filteredInvoices.reduce((a, c) => a + c.total, 0) / (filteredInvoices.length || 1)).toFixed(1)} {getTrans('currency')}
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition"></div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {lang === 'ar' ? 'ضريبة القيمة المضافة المحصلة' : 'Total VAT Collected (15%)'}
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white">
                    {filteredInvoices.reduce((a, c) => a + c.vatAmount, 0).toFixed(2)} <span className="text-sm text-emerald-400 font-semibold">{getTrans('currency')}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {lang === 'ar' ? 'جاهزة للإقرار الضريبي' : 'ZATCA Compliance active'}
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 h-24 w-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition"></div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {lang === 'ar' ? 'إجمالي الأرباح الصافية (تقديري)' : 'Estimated Net Profit'}
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-400">
                    {reportMetrics.netProfit.toFixed(2)} <span className="text-sm font-semibold">{getTrans('currency')}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {lang === 'ar' ? 'بعد استقطاع التكاليف والضرائب' : 'After COGS and VAT deduction'}
                  </div>
                </div>
              </div>

              {/* Graphics & Details Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 7-Day Sales History Chart (SVG-based) */}
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                      {lang === 'ar' ? 'أداء المبيعات والأرباح (آخر 7 أيام)' : 'Sales & Profits (Last 7 Days)'}
                    </h3>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                        <span className="h-3 w-3 rounded bg-indigo-500 inline-block"></span>
                        {lang === 'ar' ? 'المبيعات' : 'Sales'}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <span className="h-3 w-3 rounded bg-emerald-500 inline-block"></span>
                        {lang === 'ar' ? 'الأرباح' : 'Profit'}
                      </span>
                    </div>
                  </div>

                  {/* SVG Chart */}
                  <div className="h-64 w-full flex items-end justify-between gap-4 pt-6 px-2 border-b border-slate-800">
                    {salesHistory.map((item, idx) => {
                      const salesHeight = (item.sales / maxSalesVal) * 80; // max 80% height
                      const profitHeight = (item.profit / maxSalesVal) * 80;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                          {/* Hover stats tooltips */}
                          <div className="absolute bottom-full mb-2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-xs hidden group-hover:block z-10 shadow-xl min-w-[100px]">
                            <div className="font-semibold text-slate-300">{item.date}</div>
                            <div className="text-indigo-400">{lang === 'ar' ? 'مبيعات:' : 'Sales:'} {item.sales}</div>
                            <div className="text-emerald-400">{lang === 'ar' ? 'أرباح:' : 'Profit:'} {item.profit}</div>
                          </div>

                          <div className="w-full flex items-end gap-1 justify-center h-[90%]">
                            {/* Sales Bar */}
                            <div 
                              className="w-4 sm:w-6 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all group-hover:brightness-125"
                              style={{ height: `${Math.max(4, salesHeight)}%` }}
                            ></div>
                            {/* Profit Bar */}
                            <div 
                              className="w-4 sm:w-6 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all group-hover:brightness-125"
                              style={{ height: `${Math.max(4, profitHeight)}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium mt-2 text-center overflow-ellipsis w-full truncate block whitespace-nowrap">
                            {item.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Best Selling Products */}
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-white">
                    {lang === 'ar' ? 'المنتجات الأكثر مبيعاً' : 'Best Selling Products'}
                  </h3>
                  <div className="space-y-4">
                    {bestSellers.length === 0 ? (
                      <p className="text-sm text-slate-500 italic text-center py-8">
                        {lang === 'ar' ? 'لا توجد بيانات مبيعات كافية' : 'No sales data yet'}
                      </p>
                    ) : (
                      bestSellers.map((item, idx) => {
                        const totalBestQty = Math.max(...bestSellers.map(b => b.qty), 1);
                        const progress = (item.qty / totalBestQty) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-300">
                              <span>{item.name}</span>
                              <span className="font-mono">{item.qty} {lang === 'ar' ? 'وحدة' : 'units'}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: POS SALES SCREEN
              ======================================================== */}
          {activeTab === 'pos' && (
            <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
              {/* POS Left Column: Shopping Cart (60% width on large screens) */}
              <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
                {/* Cart Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-indigo-400" />
                    <h3 className="font-bold text-white">
                      {lang === 'ar' ? 'سلة المبيعات الحالية' : 'Current Shopping Cart'}
                    </h3>
                    <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-bold">
                      {cart.reduce((a, c) => a + c.quantity, 0)}
                    </span>
                  </div>
                  {cart.length > 0 && (
                    <button 
                      onClick={() => setCart([])}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'تفريغ السلة' : 'Clear'}</span>
                    </button>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                      <Barcode className="h-16 w-16 text-slate-700 animate-pulse" />
                      <p className="text-sm font-semibold">
                        {lang === 'ar' ? 'سلة المبيعات فارغة، ابدأ بمسح الباركود أو اختيار المنتجات' : 'Cart is empty. Scan barcodes or tap products to add them.'}
                      </p>
                    </div>
                  ) : (
                    cart.map((item, idx) => {
                      const basePrice = item.customPrice !== undefined ? item.customPrice : item.product.sellingPrice;
                      const itemTotal = item.quantity * basePrice * (1 - item.discount / 100);
                      return (
                        <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-bold text-sm text-slate-200">
                              {lang === 'ar' ? item.product.nameAr : item.product.nameEn}
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              {item.product.barcode} | {basePrice.toFixed(2)} {getTrans('currency')} / {item.product.unit}
                            </div>
                          </div>

                          {/* POS Controls for adjustments */}
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Manual Price Override for Owner/Manager */}
                            {hasAccess(['owner', 'manager']) ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500">{lang === 'ar' ? 'السعر:' : 'Price:'}</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={basePrice}
                                  onChange={(e) => updateCartCustomPrice(item.product.id, parseFloat(e.target.value) || 0)}
                                  className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs font-mono text-center focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                />
                              </div>
                            ) : null}

                            {/* Discount Percentage */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500">% {lang === 'ar' ? 'خصم:' : 'Disc:'}</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discount || ''}
                                placeholder="0"
                                onChange={(e) => updateCartDiscount(item.product.id, parseInt(e.target.value) || 0)}
                                className="w-12 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs font-mono text-center focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>

                            {/* Quantity Buttons (Touch friendly >= 44px equivalent) */}
                            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                              <button 
                                onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded font-bold flex items-center justify-center text-lg select-none"
                              >
                                -
                              </button>
                              <span className="w-10 text-center font-mono font-bold text-sm text-slate-200">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded font-bold flex items-center justify-center text-lg select-none"
                              >
                                +
                              </button>
                            </div>

                            {/* Total price & remove button */}
                            <div className="text-right min-w-[70px]">
                              <div className="font-bold text-sm text-indigo-400 font-mono">
                                {itemTotal.toFixed(2)}
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono">
                                + {(itemTotal * 0.15).toFixed(2)} VAT
                              </div>
                            </div>

                            <button 
                              onClick={() => removeFromCart(item.product.id)}
                              className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center justify-center transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Cart Checkout Drawer Footer */}
                {cart.length > 0 && (
                  <div className="p-5 border-t border-slate-800 bg-slate-950/80 space-y-4">
                    {/* Summary Math */}
                    {(() => {
                      const { subtotal, discountTotal, vatAmount, total } = calculateCartTotals();
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-slate-400">
                            <span>{lang === 'ar' ? 'المجموع الفرعي (غير شامل للضريبة):' : 'Subtotal (Excl. VAT):'}</span>
                            <span className="font-mono">{subtotal.toFixed(2)} {getTrans('currency')}</span>
                          </div>
                          {discountTotal > 0 && (
                            <div className="flex justify-between text-sm text-emerald-400">
                              <span>{lang === 'ar' ? 'إجمالي الخصم الممنوح:' : 'Total Discount:'}</span>
                              <span className="font-mono">-{discountTotal.toFixed(2)} {getTrans('currency')}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm text-slate-400">
                            <span>{lang === 'ar' ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
                            <span className="font-mono">{vatAmount.toFixed(2)} {getTrans('currency')}</span>
                          </div>
                          <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-slate-800">
                            <span>{lang === 'ar' ? 'المجموع النهائي المستحق:' : 'Grand Total Due:'}</span>
                            <span className="font-mono text-indigo-400 text-2xl">{total.toFixed(2)} {getTrans('currency')}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Touch Friendly Action Checkout Button */}
                    <button 
                      onClick={() => setIsCheckoutOpen(true)}
                      className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 text-base"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>{lang === 'ar' ? 'دفع وتحصيل الفاتورة (ZATCA)' : 'Pay and Post Invoice (ZATCA)'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* POS Right Column: Products & Quick Scans (40% width) */}
              <div className="w-full lg:w-96 flex flex-col gap-4">
                {/* Scanner simulator bar */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <Barcode className="h-4 w-4" />
                      {lang === 'ar' ? 'قارئ الباركود (محاكاة)' : 'Barcode Scanner Input'}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder={lang === 'ar' ? 'امسح أو اكتب الباركود...' : 'Scan/Enter Barcode...'}
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button 
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 px-4 rounded-lg font-bold text-xs"
                    >
                      {lang === 'ar' ? 'أدخل' : 'Enter'}
                    </button>
                  </form>
                  {/* Simulation Helper */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[10px] text-slate-500 font-semibold mb-1">
                      {lang === 'ar' ? 'أو اختر للتجربة السريعة:' : 'Or simulate quick barcode scans:'}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {products.slice(0, 4).map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setBarcodeInput(p.barcode);
                            setTimeout(() => addToCart(p), 100);
                          }}
                          className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded px-2 py-1 text-left truncate text-slate-400 hover:text-slate-200"
                        >
                          🔍 {lang === 'ar' ? p.nameAr : p.nameEn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Catalog Search & Filters */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex-1 flex flex-col overflow-hidden">
                  <div className="space-y-3 pb-3 border-b border-slate-800">
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder={lang === 'ar' ? 'البحث عن منتج...' : 'Search Catalog...'}
                        value={posSearch}
                        onChange={(e) => setPosSearch(e.target.value)}
                        className={`w-full bg-slate-950 border border-slate-800 rounded-lg py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none ${lang === 'ar' ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'}`}
                      />
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                      {uniqueCategories.map((cat, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPosCategory(cat)}
                          className={`text-xs px-3 py-1 rounded-full whitespace-nowrap border shrink-0 transition ${
                            posCategory === cat
                              ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {cat === 'all' ? (lang === 'ar' ? 'الكل' : 'All') : cat.replace(/ \(.+\)/, '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Catalog Grid View */}
                  <div className="flex-1 overflow-y-auto pt-3 grid grid-cols-2 gap-2">
                    {products
                      .filter(p => {
                        const searchMatch = p.nameAr.toLowerCase().includes(posSearch.toLowerCase()) ||
                                            p.nameEn.toLowerCase().includes(posSearch.toLowerCase()) ||
                                            p.barcode.includes(posSearch);
                        const categoryMatch = posCategory === 'all' || p.category === posCategory;
                        return searchMatch && categoryMatch;
                      })
                      .map(p => (
                        <button
                          key={p.id}
                          onClick={() => addToCart(p)}
                          className="bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-xl p-3 text-right flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 text-slate-200"
                        >
                          <div>
                            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-semibold px-1.5 py-0.5 rounded">
                              {p.unit}
                            </span>
                            <div className="font-bold text-xs mt-1.5 leading-snug break-words">
                              {lang === 'ar' ? p.nameAr : p.nameEn}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between w-full">
                            <span className="font-mono text-xs text-emerald-400 font-bold">
                              {p.sellingPrice.toFixed(2)} SAR
                            </span>
                            <span className={`text-[9px] font-bold ${p.quantity <= p.lowStockThreshold ? 'text-amber-400' : 'text-slate-500'}`}>
                              {p.quantity} {p.unit}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: INVENTORY MANAGEMENT
              ======================================================== */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  {/* Search */}
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'بحث عن منتج بالاسم/الباركود...' : 'Search Name/Barcode...'}
                      value={invSearch}
                      onChange={(e) => setInvSearch(e.target.value)}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-lg py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none ${lang === 'ar' ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'}`}
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={invCategory}
                    onChange={(e) => setInvCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">{lang === 'ar' ? 'كل الفئات' : 'All Categories'}</option>
                    {uniqueCategories.filter(c => c !== 'all').map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>

                  {/* Alert Filters */}
                  <select
                    value={invAlertFilter}
                    onChange={(e) => setInvAlertFilter(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">{lang === 'ar' ? 'كل الحالات' : 'All States'}</option>
                    <option value="low">{lang === 'ar' ? 'مخزون منخفض فقط' : 'Low Stock Only'}</option>
                    <option value="expiry">{lang === 'ar' ? 'منتجات شارفت على الانتهاء' : 'Expiring Products'}</option>
                  </select>
                </div>

                {/* Import / Export / Add Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCsvExport}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs rounded-lg px-3 py-2 font-bold transition"
                  >
                    <Download className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingProduct({
                        id: `prod-${Date.now()}`,
                        barcode: '',
                        nameAr: '',
                        nameEn: '',
                        category: uniqueCategories[1] || 'تموينات (Pantry)',
                        costPrice: 0,
                        sellingPrice: 0,
                        quantity: 0,
                        unit: 'pcs',
                        lowStockThreshold: 5,
                        isPerishable: false,
                      });
                      setIsProductModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-xs rounded-lg px-4 py-2 font-bold transition shadow"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'إضافة منتج جديد' : 'New Product'}</span>
                  </button>
                </div>
              </div>

              {/* Bulk CSV Import Panel */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                    {lang === 'ar' ? 'استيراد منتجات دفعات (CSV)' : 'Bulk Import Products (CSV)'}
                  </h3>
                  <div className="text-[10px] text-slate-500">
                    Header: barcode,nameAr,nameEn,category,costPrice,sellingPrice,quantity,unit,lowStockThreshold
                  </div>
                </div>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <textarea
                    rows={2}
                    value={csvFileContent}
                    onChange={(e) => setCsvFileContent(e.target.value)}
                    placeholder='e.g. 6281001234567,عصير تفاح,Apple Juice,مشروبات,1.50,2.50,100,pcs,10'
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-left focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={handleCsvImport}
                    className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg px-4 py-3 text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'استيراد الآن' : 'Import'}</span>
                  </button>
                </div>
              </div>

              {/* Product Table Grid */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 text-xs font-bold border-b border-slate-800">
                        <th className="p-4 font-mono">{lang === 'ar' ? 'الباركود' : 'Barcode'}</th>
                        <th className="p-4">{lang === 'ar' ? 'الاسم (عربي/إنجليزي)' : 'Name'}</th>
                        <th className="p-4">{lang === 'ar' ? 'الفئة' : 'Category'}</th>
                        <th className="p-4 font-mono">{lang === 'ar' ? 'سعر التكلفة' : 'Cost'}</th>
                        <th className="p-4 font-mono">{lang === 'ar' ? 'سعر البيع' : 'Selling'}</th>
                        <th className="p-4 font-mono">{lang === 'ar' ? 'الكمية المتوفرة' : 'Stock'}</th>
                        <th className="p-4">{lang === 'ar' ? 'تاريخ الصلاحية' : 'Expiry'}</th>
                        <th className="p-4 text-center">{lang === 'ar' ? 'التحكم' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-sm">
                      {products
                        .filter(p => {
                          const searchMatch = p.nameAr.toLowerCase().includes(invSearch.toLowerCase()) ||
                                              p.nameEn.toLowerCase().includes(invSearch.toLowerCase()) ||
                                              p.barcode.includes(invSearch);
                          const categoryMatch = invCategory === 'all' || p.category === invCategory;
                          
                          let alertMatch = true;
                          if (invAlertFilter === 'low') {
                            alertMatch = p.quantity <= p.lowStockThreshold;
                          } else if (invAlertFilter === 'expiry') {
                            if (!p.isPerishable || !p.expiryDate) {
                              alertMatch = false;
                            } else {
                              const exp = new Date(p.expiryDate);
                              const diff = exp.getTime() - new Date().getTime();
                              const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
                              alertMatch = diffDays <= 7;
                            }
                          }

                          return searchMatch && categoryMatch && alertMatch;
                        })
                        .map((p, idx) => {
                          const isLow = p.quantity <= p.lowStockThreshold;
                          
                          // Expiry color helpers
                          let expiryState: 'none' | 'safe' | 'alert' | 'expired' = 'none';
                          let daysLeft = 0;
                          if (p.isPerishable && p.expiryDate) {
                            const exp = new Date(p.expiryDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const diff = exp.getTime() - today.getTime();
                            daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                            if (daysLeft < 0) expiryState = 'expired';
                            else if (daysLeft <= 7) expiryState = 'alert';
                            else expiryState = 'safe';
                          }

                          return (
                            <tr key={idx} className="hover:bg-slate-900/60 transition">
                              <td className="p-4 font-mono text-xs text-slate-400">{p.barcode}</td>
                              <td className="p-4">
                                <div className="font-bold text-slate-200">{p.nameAr}</div>
                                <div className="text-xs text-slate-500">{p.nameEn}</div>
                              </td>
                              <td className="p-4 text-xs text-slate-400">
                                <span className="bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                                  {p.category.replace(/ \(.+\)/, '')}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-slate-300 font-medium">{p.costPrice.toFixed(2)}</td>
                              <td className="p-4 font-mono text-indigo-400 font-bold">{p.sellingPrice.toFixed(2)}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-mono font-bold ${isLow ? 'text-amber-400' : 'text-slate-200'}`}>
                                    {p.quantity}
                                  </span>
                                  <span className="text-xs text-slate-500">{p.unit}</span>
                                  {isLow && (
                                    <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                                      {lang === 'ar' ? 'منخفض' : 'Low'}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                {p.isPerishable && p.expiryDate ? (
                                  <div>
                                    <div className="font-mono text-xs text-slate-400">{p.expiryDate}</div>
                                    {expiryState === 'expired' && (
                                      <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold">
                                        {lang === 'ar' ? 'منتهي الصلاحية!' : 'Expired!'}
                                      </span>
                                    )}
                                    {expiryState === 'alert' && (
                                      <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                                        {lang === 'ar' ? `باقي ${daysLeft} أيام` : `${daysLeft} days left`}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-600">-</span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingProduct({ ...p });
                                      setIsProductModalOpen(true);
                                    }}
                                    className="h-8 w-8 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 rounded-lg flex items-center justify-center transition"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleProductDelete(p.id)}
                                    className="h-8 w-8 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg flex items-center justify-center transition"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: SUPPLIERS & PURCHASING
              ======================================================== */}
          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              {/* Suppliers List Area */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{lang === 'ar' ? 'قائمة الموردين المعتمدين' : 'Registered Suppliers'}</h3>
                    <p className="text-xs text-slate-400">{lang === 'ar' ? 'إدارة حسابات الدفع للشركات الموردة للمخازن' : 'Manage supply lines and balances payable'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingSupplier(null);
                      setIsSupplierModalOpen(true);
                    }}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-xs px-3 py-1.5 rounded-lg font-bold transition shadow"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'إضافة مورد' : 'New Supplier'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {suppliers.map((s, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-200 text-sm">{s.name}</h4>
                        <div className="text-xs text-slate-500 font-mono mt-1">{s.phone} | {s.email}</div>
                        {s.vatNumber && (
                          <div className="text-[10px] text-slate-500 font-mono">VAT: {s.vatNumber}</div>
                        )}
                      </div>
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold">{lang === 'ar' ? 'الحساب المستحق للمورد:' : 'Accounts Payable:'}</div>
                          <div className={`font-mono text-sm font-bold ${s.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {s.balance.toFixed(2)} SAR
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {s.balance > 0 && (
                            <button
                              onClick={() => {
                                const payAmt = prompt(lang === 'ar' ? 'أدخل المبلغ المسدد للمورد:' : 'Enter payment amount:', s.balance.toString());
                                if (payAmt) handleSupplierPayoff(s.id, parseFloat(payAmt) || 0);
                              }}
                              className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded px-2.5 py-1 font-bold transition"
                            >
                              {lang === 'ar' ? 'تسديد حساب' : 'Settle'}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingSupplier(s);
                              setIsSupplierModalOpen(true);
                            }}
                            className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded p-1 transition"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleSupplierDelete(s.id)}
                            className="text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded p-1 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Purchase Orders Section */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{lang === 'ar' ? 'أوامر الشراء والتوريد' : 'Purchase Orders (PO)'}</h3>
                    <p className="text-xs text-slate-400">{lang === 'ar' ? 'متابعة شحنات البضائع المستلمة لتغذية المخزون' : 'Track incoming supplier shipments to update warehouse stock'}</p>
                  </div>
                  <button
                    onClick={() => setIsPoModalOpen(true)}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs px-4 py-2 rounded-lg font-bold transition shadow"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'إنشاء أمر توريد جديد' : 'Create Purchase Order'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 text-xs font-bold border-b border-slate-800">
                        <th className="p-3 font-mono">PO Number</th>
                        <th className="p-3">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                        <th className="p-3">{lang === 'ar' ? 'المورد' : 'Supplier'}</th>
                        <th className="p-3">{lang === 'ar' ? 'عدد البنود' : 'Items'}</th>
                        <th className="p-3 font-mono">{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                        <th className="p-3">{lang === 'ar' ? 'حالة الاستلام' : 'Status'}</th>
                        <th className="p-3 text-center">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {purchaseOrders.map((po, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition">
                          <td className="p-3 font-mono text-xs text-indigo-400 font-bold">{po.poNumber}</td>
                          <td className="p-3 font-mono text-xs text-slate-400">{new Date(po.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</td>
                          <td className="p-3 font-bold text-slate-200">{po.supplierName}</td>
                          <td className="p-3 text-xs text-slate-400">{po.items.length} {lang === 'ar' ? 'منتج' : 'items'}</td>
                          <td className="p-3 font-mono font-bold text-slate-300">{po.total.toFixed(2)} SAR</td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              po.status === 'received' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {po.status === 'received' 
                                ? (lang === 'ar' ? 'تم الاستلام وتحديث المخزن' : 'Received') 
                                : (lang === 'ar' ? 'قيد الانتظار' : 'Pending Receipt')}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {po.status === 'pending' ? (
                              <button
                                onClick={() => handlePoReceive(po.id)}
                                className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded px-3 py-1 transition"
                              >
                                {lang === 'ar' ? 'تأكيد الاستلام' : 'Receive PO'}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500 font-mono">{po.receivedDate ? new Date(po.receivedDate).toLocaleDateString(lang==='ar'?'ar-SA':'en-US') : ''}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: REPORTS & ACCOUNTING
              ======================================================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Date Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-white">{lang === 'ar' ? 'التقارير المحاسبية والضريبية' : 'Accounting & VAT Reports'}</h3>
                  <p className="text-xs text-slate-400">{lang === 'ar' ? 'التحليلات المالية التفصيلية لتسهيل الإقرارات الضريبية والتدقيق' : 'Detail accounting exports for audit compliance'}</p>
                </div>
                <div className="flex gap-2">
                  {(['today', '7days', 'month'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setReportRange(range)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition ${
                        reportRange === range
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {range === 'today' ? (lang==='ar'?'اليوم':'Today') : range === '7days' ? (lang==='ar'?'آخر 7 أيام':'7 Days') : (lang==='ar'?'آخر 30 يوم':'30 Days')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial Box Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 text-right">
                  <div className="text-slate-500 text-xs font-semibold">{lang === 'ar' ? 'المبيعات الإجمالية (شامل الضريبة):' : 'Gross Sales (with VAT):'}</div>
                  <div className="mt-2 text-xl font-bold text-white font-mono">{reportMetrics.salesTotal.toFixed(2)} SAR</div>
                </div>
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 text-right">
                  <div className="text-slate-500 text-xs font-semibold">{lang === 'ar' ? 'قيمة الخصومات الممنوحة:' : 'Total Discounts Given:'}</div>
                  <div className="mt-2 text-xl font-bold text-rose-400 font-mono">-{reportMetrics.discountTotal.toFixed(2)} SAR</div>
                </div>
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 text-right">
                  <div className="text-slate-500 text-xs font-semibold">{lang === 'ar' ? 'قيمة الضريبة المحصلة (15%):' : 'Total VAT Collected:'}</div>
                  <div className="mt-2 text-xl font-bold text-indigo-400 font-mono">{reportMetrics.vatCollected.toFixed(2)} SAR</div>
                </div>
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 text-right">
                  <div className="text-slate-500 text-xs font-semibold">{lang === 'ar' ? 'تكلفة البضاعة المباعة (COGS):' : 'Cost of Goods Sold (COGS):'}</div>
                  <div className="mt-2 text-xl font-bold text-slate-300 font-mono">{reportMetrics.costTotal.toFixed(2)} SAR</div>
                </div>
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 text-right">
                  <div className="text-slate-500 text-xs font-semibold">{lang === 'ar' ? 'صافي الربح الفعلي:' : 'Net Profit:'}</div>
                  <div className="mt-2 text-xl font-bold text-emerald-400 font-mono">{reportMetrics.netProfit.toFixed(2)} SAR</div>
                </div>
              </div>

              {/* Transactions Ledger Detail */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">{lang === 'ar' ? 'دفتر قيود المبيعات المفصل' : 'Sales Journal & Ledger Details'}</h4>
                  <div className="text-xs text-slate-400 font-mono">{filteredInvoices.length} {lang==='ar'?'فاتورة مبيعات':'invoices recorded'}</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 text-xs font-bold border-b border-slate-800">
                        <th className="p-3 font-mono">Invoice No.</th>
                        <th className="p-3">{lang === 'ar' ? 'تاريخ المعاملة' : 'Date / Time'}</th>
                        <th className="p-3 font-mono">{lang === 'ar' ? 'قيمة المبيعات' : 'Amount'}</th>
                        <th className="p-3 font-mono">{lang === 'ar' ? 'قيمة الضريبة' : 'VAT'}</th>
                        <th className="p-3 font-mono">{lang === 'ar' ? 'التكلفة' : 'COGS'}</th>
                        <th className="p-3 font-mono">{lang === 'ar' ? 'صافي الربح' : 'Net'}</th>
                        <th className="p-3">{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</th>
                        <th className="p-3 text-center">{lang === 'ar' ? 'فواتير' : 'View'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {filteredInvoices.map((inv, idx) => {
                        let cogs = 0;
                        inv.items.forEach(it => { cogs += it.costPrice * it.quantity; });
                        const net = (inv.total - inv.vatAmount) - cogs;
                        
                        return (
                          <tr key={idx} className="hover:bg-slate-900/60 transition">
                            <td className="p-3 font-mono text-xs text-slate-400 font-bold">{inv.invoiceNumber}</td>
                            <td className="p-3 font-mono text-xs text-slate-500">
                              {new Date(inv.date).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                            </td>
                            <td className="p-3 font-mono text-slate-300">{inv.total.toFixed(2)}</td>
                            <td className="p-3 font-mono text-indigo-400">{inv.vatAmount.toFixed(2)}</td>
                            <td className="p-3 font-mono text-slate-500">{cogs.toFixed(2)}</td>
                            <td className={`p-3 font-mono font-bold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{net.toFixed(2)}</td>
                            <td className="p-3 font-medium text-slate-300 text-xs">
                              {inv.paymentMethod === 'cash' ? (lang === 'ar' ? '💵 كاش' : 'Cash') : inv.paymentMethod === 'card' ? (lang === 'ar' ? '💳 مدى / بطاقة' : 'Card') : (lang === 'ar' ? '🔄 دفع مشترك' : 'Split')}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => setActiveInvoice(inv)}
                                className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded transition"
                              >
                                {lang === 'ar' ? 'عرض الفاتورة والباركود' : 'Receipt'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: AUDIT LOGS
              ======================================================== */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{lang === 'ar' ? 'سجل عمليات النظام والرقابة الداخلية' : 'System Audit Log'}</h3>
                  <p className="text-xs text-slate-400">{lang === 'ar' ? 'سجل غير قابل للتعديل يراقب كل عملية بيع أو تعديل مخزون أو حركة مالية' : 'Immutable audit trail tracking all modifications, updates, and sales'}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 text-xs font-bold border-b border-slate-800">
                        <th className="p-3">{lang === 'ar' ? 'الوقت والتاريخ' : 'Timestamp'}</th>
                        <th className="p-3">{lang === 'ar' ? 'المستخدم' : 'Operator'}</th>
                        <th className="p-3">{lang === 'ar' ? 'الصلاحية' : 'Role'}</th>
                        <th className="p-3 font-mono">{lang === 'ar' ? 'العملية' : 'Action'}</th>
                        <th className="p-3">{lang === 'ar' ? 'التفاصيل والوصف' : 'Operation Details'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-sm">
                      {logs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition">
                          <td className="p-3 font-mono text-xs text-slate-500">
                            {new Date(log.timestamp).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                          </td>
                          <td className="p-3 font-bold text-slate-300">{log.userName}</td>
                          <td className="p-3 text-xs text-slate-400">
                            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-semibold uppercase">
                              {lang === 'ar' ? getTrans(log.role as any) : log.role}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-xs text-indigo-400 font-bold">{log.action}</td>
                          <td className="p-3 text-xs text-slate-300 leading-relaxed">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: SETTINGS
              ======================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm max-w-2xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{lang === 'ar' ? 'إعدادات المؤسسة والفواتير' : 'Supermarket Store Information'}</h3>
                  <p className="text-xs text-slate-400">{lang === 'ar' ? 'البيانات الأساسية التي تظهر في فواتير ZATCA وفي الباركود الثنائي' : 'Essential settings injected in ZATCA compliant e-invoices'}</p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!hasAccess(['owner'])) {
                      alert(lang === 'ar' ? 'تعديل بيانات المتجر متاح للمالك فقط!' : 'Store changes restricted to owner!');
                      return;
                    }
                    const formData = new FormData(e.currentTarget);
                    const info: StoreInfo = {
                      nameAr: formData.get('nameAr') as string,
                      nameEn: formData.get('nameEn') as string,
                      vatNumber: formData.get('vatNumber') as string,
                      phone: formData.get('phone') as string,
                      address: formData.get('address') as string,
                    };
                    await apiService.updateStoreInfo(info);
                    setStoreInfo(info);
                    alert(lang === 'ar' ? 'تم حفظ التعديلات بنجاح!' : 'Store configuration updated successfully!');
                  }}
                  className="space-y-4 text-slate-300 text-sm"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold">{lang === 'ar' ? 'اسم المتجر (بالعربية):' : 'Store Name (Arabic):'}</label>
                      <input
                        type="text"
                        name="nameAr"
                        defaultValue={storeInfo?.nameAr || ''}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold">{lang === 'ar' ? 'اسم المتجر (بالإنجليزية):' : 'Store Name (English):'}</label>
                      <input
                        type="text"
                        name="nameEn"
                        defaultValue={storeInfo?.nameEn || ''}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold">{lang === 'ar' ? 'الرقم الضريبي (ZATCA VAT - 15 خانة):' : 'VAT Registration No (15 digits):'}</label>
                      <input
                        type="text"
                        name="vatNumber"
                        maxLength={15}
                        defaultValue={storeInfo?.vatNumber || ''}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold">{lang === 'ar' ? 'رقم الهاتف:' : 'Phone Contact:'}</label>
                      <input
                        type="text"
                        name="phone"
                        defaultValue={storeInfo?.phone || ''}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold">{lang === 'ar' ? 'العنوان الجغرافي:' : 'Address Location:'}</label>
                    <input
                      type="text"
                      name="address"
                      defaultValue={storeInfo?.address || ''}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition"
                  >
                    {lang === 'ar' ? 'حفظ إعدادات المؤسسة' : 'Save Store Details'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================
          MODAL: CHECKOUT & PAYMENT CONFIG
          ======================================================== */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">{lang === 'ar' ? 'دفع وتحصيل الفاتورة' : 'Post & Close Sale'}</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Payment selection tabs */}
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'card', 'split'] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3 rounded-lg border font-bold text-xs flex flex-col items-center gap-1.5 transition ${
                      paymentMethod === method
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {method === 'cash' ? <Wallet className="h-4 w-4" /> : method === 'card' ? <CreditCard className="h-4 w-4" /> : <ArrowRightLeft className="h-4 w-4" />}
                    <span>{method === 'cash' ? (lang==='ar'?'كاش':'Cash') : method === 'card' ? (lang==='ar'?'مدى / شبكة':'mada Card') : (lang==='ar'?'مشترك':'Split')}</span>
                  </button>
                ))}
              </div>

              {/* Amount due display */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center font-mono">
                <span className="text-slate-500 text-xs">{lang === 'ar' ? 'المبلغ المطلوب سداده:' : 'Amount Due:'}</span>
                <div className="text-2xl font-bold text-indigo-400 mt-1">
                  {calculateCartTotals().total.toFixed(2)} SAR
                </div>
              </div>

              {/* Cash amount inputs */}
              {paymentMethod === 'cash' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">{lang === 'ar' ? 'المبلغ المستلم كاش:' : 'Cash Received:'}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-center text-lg text-emerald-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {parseFloat(cashReceived) >= calculateCartTotals().total && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-center text-xs text-emerald-400 font-mono font-bold">
                      {lang === 'ar' ? 'المتبقي للعميل (الباقي):' : 'Return Change to Customer:'}{' '}
                      {(parseFloat(cashReceived) - calculateCartTotals().total).toFixed(2)} SAR
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'split' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">{lang === 'ar' ? 'المبلغ النقدي (الكاش) المدفوع:' : 'Cash Amount Paid:'}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-center text-lg text-emerald-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {parseFloat(cashReceived) > 0 && parseFloat(cashReceived) <= calculateCartTotals().total && (
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-xs text-slate-400 font-mono">
                      {lang === 'ar' ? 'الباقي على الشبكة (المدى):' : 'Remaining Card balance:'}{' '}
                      {(calculateCartTotals().total - (parseFloat(cashReceived) || 0)).toFixed(2)} SAR
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleCheckoutSubmit}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition"
            >
              {lang === 'ar' ? 'تأكيد وحفظ الفاتورة ZATCA' : 'Generate Tax Invoice'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PRODUCT ADD / EDIT (INVENTORY CRUD)
          ======================================================== */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-lg w-full overflow-hidden shadow-2xl p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingProduct.barcode ? (lang === 'ar' ? 'تعديل بيانات منتج' : 'Edit Product') : (lang === 'ar' ? 'إضافة منتج جديد' : 'New Product')}
              </h3>
              <button 
                onClick={() => {
                  setIsProductModalOpen(false);
                  setEditingProduct(null);
                }} 
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProductSave} className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">{lang === 'ar' ? 'الباركود (رقم الفريد):' : 'Barcode ID *'}</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.barcode}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">{lang === 'ar' ? 'الفئة:' : 'Category'}</label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    placeholder="e.g. مشروبات"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">{lang === 'ar' ? 'الاسم باللغة العربية:' : 'Arabic Name *'}</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameAr}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameAr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">{lang === 'ar' ? 'الاسم باللغة الإنجليزية:' : 'English Name *'}</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameEn}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">{lang === 'ar' ? 'سعر التكلفة:' : 'Cost Price'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.costPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-indigo-400">{lang === 'ar' ? 'سعر البيع:' : 'Selling Price'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.sellingPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">{lang === 'ar' ? 'الكمية الحالية:' : 'Quantity'}</label>
                  <input
                    type="number"
                    value={editingProduct.quantity || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, quantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold">{lang === 'ar' ? 'وحدة القياس:' : 'UoM Unit'}</label>
                  <input
                    type="text"
                    value={editingProduct.unit}
                    placeholder="pcs, kg, pack"
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">{lang === 'ar' ? 'حد الطلب الأدنى:' : 'Stock Alert Thresh'}</label>
                  <input
                    type="number"
                    value={editingProduct.lowStockThreshold}
                    onChange={(e) => setEditingProduct({ ...editingProduct, lowStockThreshold: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end pb-1.5">
                  <label className="font-bold flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingProduct.isPerishable}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isPerishable: e.target.checked })}
                      className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:outline-none"
                    />
                    <span>{lang === 'ar' ? 'منتج غذائي/مؤقت' : 'Perishable'}</span>
                  </label>
                </div>
              </div>

              {editingProduct.isPerishable && (
                <div className="space-y-1">
                  <label className="font-bold text-amber-400">{lang === 'ar' ? 'تاريخ انتهاء الصلاحية:' : 'Expiry Date'}</label>
                  <input
                    type="date"
                    value={editingProduct.expiryDate || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, expiryDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-lg text-white transition mt-4"
              >
                {lang === 'ar' ? 'حفظ التعديلات' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SUPPLIER DETAILS ADD / EDIT
          ======================================================== */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-md w-full overflow-hidden shadow-2xl p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingSupplier ? (lang === 'ar' ? 'تعديل بيانات مورد' : 'Edit Supplier') : (lang === 'ar' ? 'إضافة مورد جديد' : 'New Supplier')}
              </h3>
              <button 
                onClick={() => {
                  setIsSupplierModalOpen(false);
                  setEditingSupplier(null);
                }} 
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSupplierSave} className="space-y-4 text-sm text-slate-300">
              <div className="space-y-1">
                <label className="font-bold">{lang === 'ar' ? 'اسم الشركة/المورد:' : 'Supplier Company Name *'}</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingSupplier?.name || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">{lang === 'ar' ? 'رقم الاتصال:' : 'Phone Contact *'}</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    defaultValue={editingSupplier?.phone || ''}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">{lang === 'ar' ? 'البريد الإلكتروني:' : 'Email Address'}</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingSupplier?.email || ''}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none text-left"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold">{lang === 'ar' ? 'الرقم الضريبي للمورد (إن وجد):' : 'Supplier VAT Number'}</label>
                <input
                  type="text"
                  name="vatNumber"
                  maxLength={15}
                  defaultValue={editingSupplier?.vatNumber || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-lg text-white transition mt-4"
              >
                {lang === 'ar' ? 'حفظ البيانات' : 'Save Supplier'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE PURCHASE ORDER
          ======================================================== */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-4xl w-full overflow-hidden shadow-2xl p-6 flex flex-col h-[85vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4 shrink-0">
              <h3 className="text-lg font-bold text-white">{lang === 'ar' ? 'إنشاء أمر توريد جديد' : 'New Purchase Order'}</h3>
              <button 
                onClick={() => {
                  setIsPoModalOpen(false);
                  setPoItems([]);
                  setSelectedPoSupplier('');
                }} 
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
              {/* Left Side: PO Item Basket */}
              <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden min-h-0">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                  <span className="text-xs font-bold text-slate-300">{lang === 'ar' ? 'بنود الشحن والتوريد:' : 'PO Items Added:'}</span>
                  <select
                    value={selectedPoSupplier}
                    onChange={(e) => setSelectedPoSupplier(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="">{lang === 'ar' ? '-- اختر المورد --' : '-- Choose Supplier --'}</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {poItems.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-12">{lang === 'ar' ? 'لم يتم إضافة بنود بعد. اختر من قائمة المنتجات المتاحة.' : 'No items added. Pick from inventory products.'}</p>
                  ) : (
                    poItems.map((item, idx) => (
                      <div key={idx} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs gap-3">
                        <div className="flex-1">
                          <div className="font-bold text-slate-300">{lang==='ar'?item.product.nameAr:item.product.nameEn}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.product.barcode}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Cost Price input override */}
                          <div className="flex items-center gap-1">
                            <span>{lang==='ar'?'سعر الشراء:':'Cost:'}</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.costPrice}
                              onChange={(e) => {
                                const cost = parseFloat(e.target.value) || 0;
                                setPoItems(poItems.map((pi, piIdx) => piIdx === idx ? { ...pi, costPrice: cost } : pi));
                              }}
                              className="w-14 bg-slate-950 border border-slate-800 rounded px-1 text-center font-mono focus:outline-none"
                            />
                          </div>
                          {/* Qty input */}
                          <div className="flex items-center gap-1">
                            <span>{lang==='ar'?'الكمية:':'Qty:'}</span>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value, 10) || 1;
                                setPoItems(poItems.map((pi, piIdx) => piIdx === idx ? { ...pi, quantity: qty } : pi));
                              }}
                              className="w-12 bg-slate-950 border border-slate-800 rounded px-1 text-center font-mono focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => setPoItems(poItems.filter((_, piIdx) => piIdx !== idx))}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
                  <div className="text-xs text-slate-400">
                    {lang === 'ar' ? 'إجمالي الشراء التقديري:' : 'Est. PO Total:'}{' '}
                    <span className="font-mono font-bold text-indigo-400 text-sm">
                      {poItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0).toFixed(2)} SAR
                    </span>
                  </div>
                  <button
                    onClick={handlePoSubmit}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded px-4 py-2 transition shadow"
                  >
                    {lang === 'ar' ? 'إرسال أمر الشراء' : 'Submit PO'}
                  </button>
                </div>
              </div>

              {/* Right Side: Product Catalog selector */}
              <div className="w-80 flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden min-h-0 shrink-0">
                <div className="p-2 border-b border-slate-800 bg-slate-900/50 relative">
                  <Search className="absolute left-4 top-4.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'ابحث لتدرج بضاعة...' : 'Search inventory...'}
                    value={poProductSearch}
                    onChange={(e) => setPoProductSearch(e.target.value)}
                    className={`w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none ${lang==='ar'?'pr-8 pl-2 text-right':'pl-8 pr-2 text-left'}`}
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {products
                    .filter(p => p.nameAr.toLowerCase().includes(poProductSearch.toLowerCase()) || p.nameEn.toLowerCase().includes(poProductSearch.toLowerCase()) || p.barcode.includes(poProductSearch))
                    .map(p => (
                      <button
                        key={p.id}
                        onClick={() => addToPoCart(p)}
                        className="w-full text-right bg-slate-900 hover:bg-slate-850 p-2 rounded border border-slate-800/80 flex items-center justify-between text-xs text-slate-300 transition"
                      >
                        <div className="truncate flex-1">
                          <div className="font-semibold truncate">{lang==='ar'?p.nameAr:p.nameEn}</div>
                          <div className="text-[9px] text-slate-500 font-mono">{p.barcode}</div>
                        </div>
                        <Plus className="h-4 w-4 text-indigo-400 shrink-0 ml-2" />
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL / POPUP: DETAILED PRINT TAX RECEIPT (ZATCA COMPLIANCE)
          ======================================================== */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-xl max-w-sm w-full p-6 shadow-2xl relative">
            {/* Close modal controls (Not printed) */}
            <button 
              onClick={() => setActiveInvoice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 print:hidden transition"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Print trigger button (Not printed) */}
            <div className="flex gap-2 mb-6 justify-center print:hidden pt-4">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                <Printer className="h-4 w-4" />
                <span>{lang === 'ar' ? 'طباعة الفاتورة حرارياً' : 'Print Receipt'}</span>
              </button>
              <button
                onClick={() => setActiveInvoice(null)}
                className="border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                {lang === 'ar' ? 'إغلاق المعاينة' : 'Close'}
              </button>
            </div>

            {/* Printable Receipt Layout (Will be isolated via Media Print rules) */}
            <div id="printable-receipt" className="font-sans text-xs space-y-4 leading-normal p-2 text-right dir-rtl">
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <h3 className="font-extrabold text-base">{storeInfo?.nameAr}</h3>
                <h4 className="text-[11px] text-slate-600 font-medium">{storeInfo?.nameEn}</h4>
                <p className="text-[10px] text-slate-500">{storeInfo?.address}</p>
                <p className="text-[10px] text-slate-500 font-mono">{storeInfo?.phone}</p>
                <div className="bg-slate-100 py-1 px-2 rounded mt-2 inline-block font-extrabold text-[10px] text-slate-800">
                  {lang === 'ar' ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice'}
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="space-y-1 border-b border-dashed border-slate-300 pb-3 font-mono text-[10px] text-slate-600">
                <div className="flex justify-between">
                  <span className="font-bold">{lang === 'ar' ? 'الرقم الضريبي للمتجر:' : 'Store VAT Number:'}</span>
                  <span>{storeInfo?.vatNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">{lang === 'ar' ? 'رقم الفاتورة الموحد:' : 'Invoice No:'}</span>
                  <span>{activeInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">{lang === 'ar' ? 'تاريخ ووقت المعاملة:' : 'Date:'}</span>
                  <span>{new Date(activeInvoice.date).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">{lang === 'ar' ? 'أمين الصندوق (الكاشير):' : 'Cashier:'}</span>
                  <span>{activeInvoice.cashierName}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                <div className="grid grid-cols-5 text-[10px] font-extrabold text-slate-800 border-b border-slate-200 pb-1">
                  <span className="col-span-2 text-right">{lang === 'ar' ? 'البند' : 'Item'}</span>
                  <span className="text-center font-mono">{lang === 'ar' ? 'الكمية' : 'Qty'}</span>
                  <span className="text-left font-mono">{lang === 'ar' ? 'السعر' : 'Price'}</span>
                  <span className="text-left font-mono">{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
                </div>
                <div className="space-y-1.5">
                  {activeInvoice.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-5 text-[10px] text-slate-700">
                      <span className="col-span-2 text-right truncate">
                        {lang === 'ar' ? item.nameAr : item.nameEn}
                      </span>
                      <span className="text-center font-mono">{item.quantity}</span>
                      <span className="text-left font-mono">{(item.sellingPrice * (1 - item.discount / 100)).toFixed(2)}</span>
                      <span className="text-left font-mono font-bold">{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="space-y-1 pb-3 font-mono text-[10px] text-slate-800">
                <div className="flex justify-between">
                  <span>{lang === 'ar' ? 'المجموع غير شامل الضريبة:' : 'Total Excl. VAT:'}</span>
                  <span>{activeInvoice.subtotal.toFixed(2)} SAR</span>
                </div>
                {activeInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>{lang === 'ar' ? 'إجمالي الخصم الممنوح:' : 'Discount:'}</span>
                    <span>-{activeInvoice.discountAmount.toFixed(2)} SAR</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-indigo-700">
                  <span>{lang === 'ar' ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
                  <span>{activeInvoice.vatAmount.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between font-extrabold text-xs text-slate-900 border-t border-slate-200 pt-1.5">
                  <span>{lang === 'ar' ? 'الإجمالي النهائي (شامل الضريبة):' : 'Total (Incl. VAT):'}</span>
                  <span>{activeInvoice.total.toFixed(2)} SAR</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-[10px] text-slate-600 font-mono">
                <div className="flex justify-between">
                  <span className="font-bold">{lang === 'ar' ? 'طريقة الدفع للمبيعات:' : 'Method of Payment:'}</span>
                  <span>
                    {activeInvoice.paymentMethod === 'cash' ? (lang === 'ar' ? 'نقدي (كاش)' : 'Cash') : activeInvoice.paymentMethod === 'card' ? (lang === 'ar' ? 'شبكة مدى' : 'mada Card') : (lang === 'ar' ? 'مشترك (نقدي + مدى)' : 'Split')}
                  </span>
                </div>
                {activeInvoice.paymentDetails.cashAmount ? (
                  <div className="flex justify-between">
                    <span>{lang === 'ar' ? 'المبلغ النقدي المسدد:' : 'Cash Paid:'}</span>
                    <span>{activeInvoice.paymentDetails.cashAmount.toFixed(2)} SAR</span>
                  </div>
                ) : null}
                {activeInvoice.paymentDetails.cardAmount ? (
                  <div className="flex justify-between">
                    <span>{lang === 'ar' ? 'المبلغ المسدد بالشبكة:' : 'Card Paid:'}</span>
                    <span>{activeInvoice.paymentDetails.cardAmount.toFixed(2)} SAR</span>
                  </div>
                ) : null}
              </div>

              {/* ZATCA Phase 1 TLV QR Code & Compliance details */}
              <div className="flex flex-col items-center justify-center pt-4 border-t border-dashed border-slate-300 gap-2">
                {receiptQrUrl ? (
                  <img src={receiptQrUrl} alt="ZATCA Compliance QR Code" className="h-32 w-32 object-contain" />
                ) : (
                  <div className="h-32 w-32 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">Loading QR...</div>
                )}
                <div className="text-center text-[8px] text-slate-500 leading-tight space-y-0.5">
                  <p className="font-bold">{lang === 'ar' ? 'فاتورة ضريبية مبسطة معتمدة' : 'Verified Simplified Tax Invoice'}</p>
                  <p>{lang === 'ar' ? 'مطابقة لمتطلبات هيئة الزكاة والضريبة والجمارك' : 'Complies with ZATCA (Fatoora) Regulations'}</p>
                  <p className="font-mono text-[6px] text-slate-400">SmartMarkt Saudi POS v1.0.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
