import { Router } from 'express';
import { db } from '../config/db.js';
import { logAudit } from '../services/audit.js';

const router = Router();

router.get('/products', async (req, res) => {
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

router.post('/products', async (req, res) => {
  try {
    const { product} = req.body;
    
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
      if (req.user) {
        await logAudit(
          req.user.id,
          req.user.nameAr,
          req.user.role,
          'PRODUCT_UPDATE',
          `Updated product: ${product.nameEn} (${product.barcode}). Stock: ${existing.quantity} -> ${product.quantity}`
        );
      }
    } else {
      await db('products').insert(productData);
      if (req.user) {
        await logAudit(
          req.user.id,
          req.user.nameAr,
          req.user.role,
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

router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {} = req.body;

    const product = await db('products').where({ id }).first();
    if (product) {
      await db('products').where({ id }).delete();
      if (req.user) {
        await logAudit(
          req.user.id,
          req.user.nameAr,
          req.user.role,
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

router.post('/products/import-csv', async (req, res) => {
  try {
    const { productsList} = req.body;
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

    if (req.user && successCount > 0) {
      await logAudit(
        req.user.id,
        req.user.nameAr,
        req.user.role,
        'PRODUCT_IMPORT',
        `Successfully imported ${successCount} products via CSV`
      );
    }

    res.json({ successCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
