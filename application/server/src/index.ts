import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, dbType } from './db.js';
import { runMigrations } from './migrations.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ZATCA TLV Generator for Phase 1 E-Invoicing
function toTLV(tag: number, value: string): Buffer {
  const valueBytes = Buffer.from(value, 'utf8');
  const tlvBytes = Buffer.alloc(2 + valueBytes.length);
  tlvBytes[0] = tag;
  tlvBytes[1] = valueBytes.length;
  valueBytes.copy(tlvBytes, 2);
  return tlvBytes;
}

function generateZatcaBase64(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  total: number,
  vatTotal: number
): string {
  const t1 = toTLV(1, sellerName);
  const t2 = toTLV(2, vatNumber);
  const t3 = toTLV(3, timestamp);
  const t4 = toTLV(4, total.toFixed(2));
  const t5 = toTLV(5, vatTotal.toFixed(2));
  
  const combined = Buffer.concat([t1, t2, t3, t4, t5]);
  return combined.toString('base64');
}

// Audit logger helper
async function logAudit(userId: string, userName: string, role: string, action: string, details: string) {
  try {
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      role,
      action,
      details,
    };
    await db('audit_logs').insert(newLog);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// 1. Status Check
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', dbType });
});

// 2. Store Info
app.get('/api/store-info', async (req, res) => {
  try {
    const store = await db('store_info').first();
    res.json(store || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/store-info', async (req, res) => {
  try {
    const { nameAr, nameEn, vatNumber, phone, address, currentUser } = req.body;
    
    // Check if store info exists
    const existing = await db('store_info').first();
    if (existing) {
      await db('store_info').update({ nameAr, nameEn, vatNumber, phone, address });
    } else {
      await db('store_info').insert({ nameAr, nameEn, vatNumber, phone, address });
    }

    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.nameAr,
        currentUser.role,
        'STORE_INFO_UPDATE',
        `Updated store name: ${nameAr}, VAT: ${vatNumber}`
      );
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await db('users').select('*');
    // Map database 1/0 to true/false for active
    const sanitized = users.map(u => ({ ...u, active: !!u.active }));
    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await db('products').select('*');
    const sanitized = products.map(p => ({
      ...p,
      costPrice: Number(p.costPrice),
      sellingPrice: Number(p.sellingPrice),
      quantity: Number(p.quantity),
      lowStockThreshold: Number(p.lowStockThreshold),
      isPerishable: !!p.isPerishable
    }));
    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { product, currentUser } = req.body;
    
    const existing = await db('products').where({ id: product.id }).first();
    
    const productData = {
      id: product.id,
      barcode: product.barcode,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      category: product.category,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      unit: product.unit,
      lowStockThreshold: product.lowStockThreshold,
      expiryDate: product.expiryDate || null,
      isPerishable: product.isPerishable ? 1 : 0
    };

    if (existing) {
      await db('products').where({ id: product.id }).update(productData);
      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.nameAr,
          currentUser.role,
          'PRODUCT_UPDATE',
          `Updated product: ${product.nameEn} (${product.barcode}). Stock: ${existing.quantity} -> ${product.quantity}`
        );
      }
    } else {
      await db('products').insert(productData);
      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.nameAr,
          currentUser.role,
          'PRODUCT_CREATE',
          `Added new product: ${product.nameEn} (${product.barcode}), Qty: ${product.quantity}`
        );
      }
    }

    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUser } = req.body;

    const product = await db('products').where({ id }).first();
    if (product) {
      await db('products').where({ id }).delete();
      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.nameAr,
          currentUser.role,
          'PRODUCT_DELETE',
          `Deleted product: ${product.nameEn} (${product.barcode})`
        );
      }
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CSV Import bulk products helper
app.post('/api/products/import-csv', async (req, res) => {
  try {
    const { productsList, currentUser } = req.body;
    let successCount = 0;
    
    await db.transaction(async (trx) => {
      for (const p of productsList) {
        const productData = {
          id: p.id,
          barcode: p.barcode,
          nameAr: p.nameAr,
          nameEn: p.nameEn,
          category: p.category,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          quantity: p.quantity,
          unit: p.unit,
          lowStockThreshold: p.lowStockThreshold,
          expiryDate: p.expiryDate || null,
          isPerishable: p.isPerishable ? 1 : 0
        };

        const existing = await trx('products').where({ barcode: p.barcode }).first();
        if (existing) {
          // Keep the existing ID but update info
          await trx('products').where({ barcode: p.barcode }).update({
            ...productData,
            id: existing.id
          });
        } else {
          await trx('products').insert(productData);
        }
        successCount++;
      }
    });

    if (currentUser && successCount > 0) {
      await logAudit(
        currentUser.id,
        currentUser.nameAr,
        currentUser.role,
        'PRODUCT_IMPORT',
        `Successfully imported ${successCount} products via CSV`
      );
    }

    res.json({ successCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await db('suppliers').select('*');
    const sanitized = suppliers.map(s => ({
      ...s,
      balance: Number(s.balance)
    }));
    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const { supplier, currentUser } = req.body;
    
    const existing = await db('suppliers').where({ id: supplier.id }).first();
    
    const supplierData = {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      vatNumber: supplier.vatNumber || null,
      balance: supplier.balance
    };

    if (existing) {
      await db('suppliers').where({ id: supplier.id }).update(supplierData);
      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.nameAr,
          currentUser.role,
          'SUPPLIER_UPDATE',
          `Updated supplier: ${supplier.name}`
        );
      }
    } else {
      await db('suppliers').insert(supplierData);
      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.nameAr,
          currentUser.role,
          'SUPPLIER_CREATE',
          `Created supplier: ${supplier.name}`
        );
      }
    }

    res.json(supplier);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUser } = req.body;

    const supplier = await db('suppliers').where({ id }).first();
    if (supplier) {
      await db('suppliers').where({ id }).delete();
      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.nameAr,
          currentUser.role,
          'SUPPLIER_DELETE',
          `Deleted supplier: ${supplier.name}`
        );
      }
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Supplier not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Supplier Payment
app.post('/api/suppliers/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, currentUser } = req.body;

    await db.transaction(async (trx) => {
      const supplier = await trx('suppliers').where({ id }).first();
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      const newBalance = Number(supplier.balance) - Number(amount);
      await trx('suppliers').where({ id }).update({ balance: newBalance });

      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.nameAr,
          currentUser.role,
          'SUPPLIER_PAYMENT',
          `Paid ${amount.toFixed(2)} SAR to supplier ${supplier.name}`
        );
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Purchase Orders
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const pos = await db('purchase_orders').select('*').orderBy('date', 'desc');
    const allItems = await db('purchase_order_items').select('*');
    
    const formatted = pos.map(po => {
      const items = allItems
        .filter(item => item.poId === po.id)
        .map(item => ({
          productId: item.productId,
          productNameAr: item.productNameAr,
          productNameEn: item.productNameEn,
          costPrice: Number(item.costPrice),
          quantity: Number(item.quantity),
          total: Number(item.total)
        }));
      
      return {
        ...po,
        total: Number(po.total),
        items
      };
    });

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchase-orders', async (req, res) => {
  try {
    const { po, currentUser } = req.body;

    await db.transaction(async (trx) => {
      const existing = await trx('purchase_orders').where({ id: po.id }).first();
      
      const poData = {
        id: po.id,
        poNumber: po.poNumber,
        date: po.date,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        total: po.total,
        status: po.status,
        receivedDate: po.receivedDate || null
      };

      if (existing) {
        await trx('purchase_orders').where({ id: po.id }).update(poData);
        // Clear existing items and insert new ones
        await trx('purchase_order_items').where({ poId: po.id }).delete();
        
        if (currentUser) {
          await logAudit(
            currentUser.id,
            currentUser.nameAr,
            currentUser.role,
            'PO_UPDATE',
            `Updated Purchase Order: ${po.poNumber}, Status: ${po.status}`
          );
        }
      } else {
        await trx('purchase_orders').insert(poData);
        
        if (currentUser) {
          await logAudit(
            currentUser.id,
            currentUser.nameAr,
            currentUser.role,
            'PO_CREATE',
            `Created Purchase Order: ${po.poNumber} for supplier ${po.supplierName}`
          );
        }
      }

      // Insert items
      if (po.items && po.items.length > 0) {
        const itemRows = po.items.map((item: any) => ({
          poId: po.id,
          productId: item.productId,
          productNameAr: item.productNameAr,
          productNameEn: item.productNameEn,
          costPrice: item.costPrice,
          quantity: item.quantity,
          total: item.total
        }));
        await trx('purchase_order_items').insert(itemRows);
      }
    });

    res.json(po);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchase-orders/:id/receive', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUser } = req.body;

    await db.transaction(async (trx) => {
      const po = await trx('purchase_orders').where({ id }).first();
      if (!po) {
        throw new Error('Purchase order not found');
      }
      if (po.status === 'received') {
        throw new Error('Purchase order is already received');
      }

      const receivedDate = new Date().toISOString();
      await trx('purchase_orders').where({ id }).update({
        status: 'received',
        receivedDate
      });

      const poItems = await trx('purchase_order_items').where({ poId: id });
      
      // Update stocks and cost prices
      for (const item of poItems) {
        const product = await trx('products').where({ id: item.productId }).first();
        if (product) {
          const newQty = Number(product.quantity) + Number(item.quantity);
          await trx('products').where({ id: item.productId }).update({
            quantity: newQty,
            costPrice: item.costPrice // update to latest cost price
          });
        }
      }

      // Update Supplier balance
      const supplier = await trx('suppliers').where({ id: po.supplierId }).first();
      if (supplier) {
        const newBalance = Number(supplier.balance) + Number(po.total);
        await trx('suppliers').where({ id: po.supplierId }).update({
          balance: newBalance
        });
      }

      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.nameAr,
          currentUser.role,
          'PO_RECEIVE',
          `Received Purchase Order: ${po.poNumber}, inventory stock updated for ${poItems.length} items`
        );
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Invoices & Checkout
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await db('invoices').select('*').orderBy('date', 'desc');
    const allItems = await db('invoice_items').select('*');

    const formatted = invoices.map(inv => {
      const items = allItems
        .filter(item => item.invoiceId === inv.id)
        .map(item => ({
          productId: item.productId,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          quantity: Number(item.quantity),
          sellingPrice: Number(item.sellingPrice),
          costPrice: Number(item.costPrice),
          discount: Number(item.discount),
          taxRate: Number(item.taxRate),
          subtotal: Number(item.subtotal),
          vatAmount: Number(item.vatAmount),
          total: Number(item.total)
        }));

      return {
        ...inv,
        subtotal: Number(inv.subtotal),
        discountAmount: Number(inv.discountAmount),
        vatAmount: Number(inv.vatAmount),
        total: Number(inv.total),
        paymentDetails: {
          cashAmount: inv.cashAmount ? Number(inv.cashAmount) : 0,
          cardAmount: inv.cardAmount ? Number(inv.cardAmount) : 0
        },
        items
      };
    });

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const { items, paymentMethod, paymentDetails, currentUser } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Invoice must contain at least one item' });
    }

    const store = await db('store_info').first();
    if (!store) {
      return res.status(500).json({ error: 'Store information is missing. Set store settings first.' });
    }

    let createdInvoice: any = null;

    await db.transaction(async (trx) => {
      // 1. Resolve product list to compute invoices and update stock
      const productIds = items.map((i: any) => i.product.id);
      const dbProducts = await trx('products').whereIn('id', productIds);

      const invoiceItems = items.map((item: any) => {
        const p = item.product;
        const basePrice = item.customPrice !== undefined ? item.customPrice : p.sellingPrice;
        const subtotal = item.quantity * basePrice * (1 - item.discount / 100);
        const vatAmount = subtotal * 0.15;
        const total = subtotal + vatAmount;

        const prodInDb = dbProducts.find((prod: any) => prod.id === p.id);
        if (!prodInDb) {
          throw new Error(`Product ${p.nameEn} not found in database`);
        }

        const costPrice = Number(prodInDb.costPrice);

        return {
          productId: p.id,
          nameAr: p.nameAr,
          nameEn: p.nameEn,
          quantity: item.quantity,
          sellingPrice: basePrice,
          costPrice,
          discount: item.discount,
          taxRate: 0.15,
          subtotal,
          vatAmount,
          total,
        };
      });

      // Update inventory stock
      for (const item of items) {
        const prod = dbProducts.find((p: any) => p.id === item.product.id);
        if (prod) {
          const newQty = Math.max(0, Number(prod.quantity) - item.quantity);
          await trx('products').where({ id: prod.id }).update({ quantity: newQty });
        }
      }

      const subtotal = invoiceItems.reduce((acc: number, item: any) => acc + item.subtotal, 0);
      const vatAmount = invoiceItems.reduce((acc: number, item: any) => acc + item.vatAmount, 0);
      const total = subtotal + vatAmount;

      // 2. Generate invoice sequence number
      const countRes = await trx('invoices').count('id as cnt').first();
      const count = Number(countRes?.cnt || 0);
      const invSeq = count + 1001;
      const invoiceNumber = `INV-2026-${invSeq}`;
      const timestamp = new Date().toISOString();

      // 3. Generate ZATCA Base64 QR code
      const zatcaQrCode = generateZatcaBase64(
        store.nameAr,
        store.vatNumber,
        timestamp,
        total,
        vatAmount
      );

      const discountAmount = items.reduce((acc: number, item: any) => {
        const base = item.customPrice !== undefined ? item.customPrice : item.product.sellingPrice;
        return acc + (item.quantity * base * (item.discount / 100));
      }, 0);

      const invId = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const invoiceData = {
        id: invId,
        invoiceNumber,
        date: timestamp,
        subtotal,
        discountAmount,
        vatAmount,
        total,
        paymentMethod,
        cashAmount: paymentDetails.cashAmount || null,
        cardAmount: paymentDetails.cardAmount || null,
        zatcaQrCode,
        cashierId: currentUser.id,
        cashierName: currentUser.nameAr
      };

      await trx('invoices').insert(invoiceData);

      // Insert items
      const itemRows = invoiceItems.map((item: any) => ({
        invoiceId: invId,
        productId: item.productId,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        costPrice: item.costPrice,
        discount: item.discount,
        taxRate: item.taxRate,
        subtotal: item.subtotal,
        vatAmount: item.vatAmount,
        total: item.total
      }));
      
      await trx('invoice_items').insert(itemRows);

      // Log checkout audit
      const auditMsg = `Completed sale ${invoiceNumber}, Total: ${total.toFixed(2)} SAR, items count: ${invoiceItems.length}`;
      
      // We must insert audit log inside transaction
      await trx('audit_logs').insert({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.nameAr,
        role: currentUser.role,
        action: 'SALES_CHECKOUT',
        details: auditMsg
      });

      // Stock threshold alerts
      for (const item of invoiceItems) {
        const prod = dbProducts.find((p: any) => p.id === item.productId);
        if (prod) {
          const finalQty = Math.max(0, Number(prod.quantity) - item.quantity);
          if (finalQty <= Number(prod.lowStockThreshold)) {
            await trx('audit_logs').insert({
              id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              timestamp: new Date().toISOString(),
              userId: currentUser.id,
              userName: currentUser.nameAr,
              role: currentUser.role,
              action: 'STOCK_ALERT',
              details: `Low stock warning: ${prod.nameEn} quantity is now ${finalQty} (threshold: ${prod.lowStockThreshold})`
            });
          }
        }
      }

      createdInvoice = {
        id: invId,
        invoiceNumber,
        date: timestamp,
        items: invoiceItems,
        subtotal,
        discountAmount,
        vatAmount,
        total,
        paymentMethod,
        paymentDetails,
        zatcaQrCode,
        cashierId: currentUser.id,
        cashierName: currentUser.nameAr
      };
    });

    res.json(createdInvoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Audit Logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const logs = await db('audit_logs').select('*').orderBy('timestamp', 'desc');
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    const { action, details, currentUser } = req.body;
    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.nameAr,
        currentUser.role,
        action,
        details
      );
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Current user info required' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server and run database migrations
async function startServer() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`SmartMarkt backend server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database or start server:', err);
    process.exit(1);
  }
}

startServer();
