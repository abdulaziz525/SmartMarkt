import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Store, Trash2, Edit3, Settings } from 'lucide-react';
import type { Product } from '../../types';
import { apiService } from '../../services/api';

// The base API URL from Vite env
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const Storefront: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Auth state
  const [isCustomerAuth, setIsCustomerAuth] = useState(false);

  // Checkout modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'installments'>('card');
  const [checkoutError, setCheckoutError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Owner Admin controls
  const [isStoreOwner, setIsStoreOwner] = useState(false);

  // Form for Auth
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalAddress, setNationalAddress] = useState('');

  useEffect(() => {
    fetchProducts();
    checkOwnerAuth();
  }, [storeId]);

  const checkOwnerAuth = async () => {
    try {
      const user = await apiService.verifyAuth();
      if (user && (user.role === 'owner' || user.role === 'manager')) {
        setIsStoreOwner(true);
      }
    } catch (err) {
      setIsStoreOwner(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/storefront/${storeId}/products`);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = authMode === 'login' ? '/storefront/auth/login' : '/storefront/auth/register';
      const body = authMode === 'login' 
        ? { email, password }
        : { name, phone, email, password, nationalAddress };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsCustomerAuth(true);
      setShowCheckout(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCheckout = async () => {
    setCheckoutError('');
    try {
      const res = await fetch(`${API_BASE}/storefront/${storeId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paymentMethod,
          fulfillmentMode: fulfillment,
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          }))
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg(`Order placed successfully! ${fulfillment === 'pickup' ? 'Your pickup QR is ready.' : ''}`);
      setCart([]);
      setTimeout(() => {
        setShowCheckout(false);
        setSuccessMsg('');
      }, 3000);
      
    } catch (err: any) {
      setCheckoutError(err.message);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(item => item.product.id === product.id);
      if (exists) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);

  if (isLoading) return <div className="p-10 text-center text-white">Loading Storefront...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl font-bold">SmartMarkt Storefront</h1>
        </div>
        <div className="flex items-center gap-4">
          {isStoreOwner && (
            <button 
              onClick={() => window.open('/', '_blank')}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-800 transition"
            >
              <Settings className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
          )}
          <button 
            onClick={() => setShowCheckout(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>{cart.length} items</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Available Products</h2>
        {error && <div className="text-red-500 mb-4 font-bold">{error}</div>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-indigo-600 font-bold">{p.category}</div>
                  {isStoreOwner && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => window.open('/', '_blank')} 
                        className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition"
                        title="Edit in Dashboard"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this product?')) {
                            try {
                              await apiService.deleteProduct(p.id);
                              fetchProducts();
                            } catch (e: any) {
                              alert(e.message);
                            }
                          }
                        }}
                        className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-lg mb-2">{p.nameEn} / {p.nameAr}</h3>
                <div className="text-2xl font-black text-slate-800 mb-4">{p.sellingPrice.toFixed(2)} SAR</div>
              </div>
              <button
                disabled={p.quantity <= 0}
                onClick={() => addToCart(p)}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {p.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Checkout / Auth Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Checkout</h2>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6">
              {successMsg ? (
                <div className="text-center py-10">
                  <div className="text-emerald-500 text-5xl mb-4">✓</div>
                  <h3 className="text-2xl font-bold text-slate-800">{successMsg}</h3>
                </div>
              ) : !isCustomerAuth ? (
                <form onSubmit={handleAuth} className="flex flex-col gap-4">
                  <h3 className="font-bold mb-2">Please login or register to checkout</h3>
                  {error && <div className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded">{error}</div>}
                  
                  {authMode === 'register' && (
                    <>
                      <input required placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded-xl p-3" />
                      <input required placeholder="Phone Number" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full border rounded-xl p-3" />
                      <input required placeholder="National Address (e.g. AAAA1111)" pattern="^[A-Za-z]{4}\d{4}$" title="4 English letters followed by 4 numbers" value={nationalAddress} onChange={e=>setNationalAddress(e.target.value)} className="w-full border rounded-xl p-3" />
                    </>
                  )}
                  <input required type="email" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded-xl p-3" />
                  <input required type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded-xl p-3" />
                  
                  <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-2">
                    {authMode === 'login' ? 'Login to Continue' : 'Register & Continue'}
                  </button>
                  <button type="button" onClick={() => setAuthMode(m => m === 'login' ? 'register' : 'login')} className="text-sm text-indigo-600 font-semibold mt-2">
                    {authMode === 'login' ? 'Create an account instead' : 'Already have an account? Login'}
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Cart Summary */}
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h3 className="font-bold mb-3 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Order Summary</h3>
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm mb-2">
                        <span>{item.quantity}x {item.product.nameEn}</span>
                        <span className="font-bold">{(item.product.sellingPrice * item.quantity).toFixed(2)} SAR</span>
                      </div>
                    ))}
                    <div className="border-t mt-3 pt-3 flex justify-between font-black text-lg">
                      <span>Total</span>
                      <span>{cartTotal.toFixed(2)} SAR</span>
                    </div>
                  </div>

                  {checkoutError && <div className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-lg border border-red-200">{checkoutError}</div>}

                  {/* Options */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <h4 className="font-bold text-sm mb-2">Fulfillment Mode</h4>
                      <select value={fulfillment} onChange={e => setFulfillment(e.target.value as any)} className="w-full border rounded-xl p-3 font-semibold">
                        <option value="pickup">Store Pickup (Click & Collect)</option>
                        <option value="delivery">Local Delivery</option>
                      </select>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm mb-2">Payment Method</h4>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full border rounded-xl p-3 font-semibold">
                        <option value="card">Credit/Debit Card</option>
                        <option value="cash">Cash on Delivery/Pickup</option>
                        <option value="installments">Buy Now, Pay Later (4 Installments)</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                      className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-2 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Complete Purchase
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
