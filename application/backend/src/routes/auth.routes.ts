import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

router.get('/auth/status', async (req, res) => {
  try {
    const userCount = await db('users').count({ count: '*' }).first();
    const isSetupComplete = (Number(userCount?.count) || 0) > 0;
    res.json({ isSetupComplete });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function performSignup(req: any, res: any, payload: any) {
  const { fullName, username, email, password, organizationName, storeName, vatNumber, phone, address } = payload;

  if (!fullName || !username || !email || !password || !organizationName || !storeName || !vatNumber || !phone || !address) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (payload.confirmPassword && password !== payload.confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const existingUser = await db('users').where({ username }).first();
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const orgId = `org-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const storeId = `store-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const userId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newOrg = { id: orgId, name: organizationName };
  const newStore = {
    id: storeId,
    nameAr: storeName,
    nameEn: storeName,
    vatNumber,
    phone,
    address,
    organization_id: orgId,
    status: 'active'
  };
  const newOwner = {
    id: userId,
    username: username,
    password: hashedPassword,
    nameAr: fullName,
    nameEn: fullName,
    role: 'owner',
    active: true,
    organization_id: orgId,
    store_id: storeId
  };

  await db.transaction(async (trx) => {
    await trx('organizations').insert(newOrg);
    await trx('stores').insert(newStore);
    await trx('users').insert(newOwner);

    // Seed default sample data dynamically for the new store context
    const getFutureDate = (days: number): string => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const products = [
      { id: `p-${Date.now()}-1`, barcode: '6281007011234', nameAr: 'حليب المراعي طازج 1 لتر', nameEn: 'Almarai Fresh Milk 1L', category: 'أغذية طازجة (Fresh)', costPrice: 4.00, sellingPrice: 6.00, quantity: 45, unit: 'pcs', lowStockThreshold: 15, expiryDate: getFutureDate(4), isPerishable: true, store_id: storeId },
      { id: `p-${Date.now()}-2`, barcode: '6281007021111', nameAr: 'جبنة المراعي مثلثات 8 قطع', nameEn: 'Almarai Cheese Triangles 8p', category: 'أغذية طازجة (Fresh)', costPrice: 3.50, sellingPrice: 5.00, quantity: 12, unit: 'pack', lowStockThreshold: 15, expiryDate: getFutureDate(25), isPerishable: true, store_id: storeId },
      { id: `p-${Date.now()}-3`, barcode: '0120000001332', nameAr: 'بيبسي علبة 330 مل', nameEn: 'Pepsi Can 330ml', category: 'مشروبات (Beverages)', costPrice: 1.80, sellingPrice: 2.50, quantity: 180, unit: 'pcs', lowStockThreshold: 30, isPerishable: false, store_id: storeId }
    ];

    const suppliers = [
      { id: `s-${Date.now()}-1`, name: 'شركة المراعي (Almarai)', phone: '920000001', email: 'sales@almarai.com', vatNumber: '310123456700003', balance: 4500.00, store_id: storeId },
      { id: `s-${Date.now()}-2`, name: 'بيبسي كولا السعودية (PepsiCo)', phone: '920000002', email: 'orders@pepsico.com.sa', vatNumber: '310234567800003', balance: 1200.00, store_id: storeId }
    ];

    await trx('products').insert(products);
    await trx('suppliers').insert(suppliers);

    // Audit Log initialization
    await trx('audit_logs').insert({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: userId,
      userName: fullName,
      role: 'owner',
      action: 'STORE_INFO_UPDATE',
      details: `Initial setup complete. Organization ${organizationName} and store ${storeName} created.`,
      store_id: storeId
    });
  });

  const token = jwt.sign(
    {
      id: userId,
      role: 'owner',
      nameAr: fullName,
      organization_id: orgId,
      store_id: storeId
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  });

  res.status(201).json({
    id: userId,
    username: email,
    role: 'owner',
    nameAr: fullName,
    organization_id: orgId,
    store_id: storeId
  });
}

router.post('/auth/setup', async (req, res) => {
  try {
    const payload = {
      fullName: req.body.fullName,
      email: req.body.email,
      password: req.body.password,
      organizationName: req.body.nameEn || req.body.organizationName || 'Default Org',
      storeName: req.body.nameAr || req.body.storeName || 'Default Store',
      vatNumber: req.body.vatNumber,
      phone: req.body.phone,
      address: req.body.address
    };
    await performSignup(req, res, payload);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/signup', async (req, res) => {
  try {
    await performSignup(req, res, req.body);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await db('users').where({ username }).first();
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        nameAr: user.nameAr,
        organization_id: user.organization_id,
        store_id: user.store_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

import { tokenBlacklist } from '../middlewares/authMiddleware.js';

router.post('/auth/logout', (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    tokenBlacklist.add(token);
  }
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

router.get('/auth/verify', (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json(decoded);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, id, password, organization_id, store_id } = req.body;
    const actualUsername = email || username;

    const existingUser = await db('users').where({ username: actualUsername }).first();
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const tokenCookie = req.cookies?.token;
    let finalOrgId = organization_id;
    let finalStoreId = store_id;
    if (tokenCookie) {
      try {
        const decoded = jwt.verify(tokenCookie, JWT_SECRET) as any;
        finalOrgId = finalOrgId || decoded.organization_id;
        finalStoreId = finalStoreId || decoded.store_id;
      } catch (e) {
        // ignore
      }
    }

    if (!finalOrgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: id || Math.random().toString(36).substring(2, 9),
      username: actualUsername,
      password: hashedPassword,
      nameAr: username,
      nameEn: username,
      role: 'cashier',
      active: true,
      organization_id: finalOrgId,
      store_id: finalStoreId || null
    };

    await db('users').insert(newUser);

    const token = jwt.sign(
      {
        id: newUser.id,
        role: newUser.role,
        nameAr: newUser.nameAr,
        organization_id: newUser.organization_id,
        store_id: newUser.store_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    const { password: _, ...userData } = newUser;
    res.status(201).json(userData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

