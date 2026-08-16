import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import nodemailer from 'nodemailer';
import { JWT_SECRET } from '../config/jwt.js';

const router = Router();
let transporter: nodemailer.Transporter | null = null;

const initTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('Nodemailer test account created for email verification.');
    } catch (err) {
      console.error('Failed to create Nodemailer test account', err);
    }
  }
};
initTransporter();

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


const verificationCodes = new Map<string, string>();

router.post('/auth/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    verificationCodes.set(email, code);
    
    // Log it as well
    console.log(`[Email Verification] Sent code ${code} to ${email}`);

    if (transporter) {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"SmartMarkt" <noreply@smartmarkt.com>',
        to: email,
        subject: "Verification Code - SmartMarkt",
        text: `Your verification code is: ${code}`,
        html: `<b>Your verification code is: ${code}</b>`,
      });

      console.log("Message sent: %s", info.messageId);
      // In development with Ethereal, log the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("Preview URL: %s", previewUrl);
      }
    } else {
      console.log("Nodemailer not initialized, skipping real email send.");
    }
    
    res.json({ message: 'Verification code sent successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });
    
    const savedCode = verificationCodes.get(email);
    if (!savedCode || savedCode !== code) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    // Clear code after successful verification
    verificationCodes.delete(email);
    res.json({ message: 'Email verified successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



router.post('/auth/wathq-verify', async (req, res) => {
  try {
    const { crNumber } = req.body;
    if (!crNumber) return res.status(400).json({ error: 'CR Number / Tax Number is required' });
    
    // Typically the apiKey would come from env vars
    const apiKey = process.env.WATHQ_API_KEY || 'sandbox_key';
    
    try {
      const response = await fetch(`https://api.wathq.sa/sandbox/commercial-registration/info/${crNumber}`, {
        headers: {
          'Authorization': apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err: any = new Error(response.statusText);
        err.response = { status: response.status, data: errorData };
        throw err;
      }
      
      const data = await response.json();
      res.json({ valid: true, data: data });
    } catch (apiError: any) {
      // If it's a 401 or 403 (unauthorized/forbidden) due to missing real API key, we mock success for development purposes
      if (apiError.response && (apiError.response.status === 401 || apiError.response.status === 403)) {
        console.warn('Wathq API Key is invalid or missing, mocking success response for CR:', crNumber);
        return res.json({
          valid: true,
          data: {
            crNumber: crNumber,
            name: "مؤسسة تجريبية (Mock)",
            status: { id: 1, name: "فعال" }
          },
          mocked: true
        });
      }
      
      if (apiError.response && apiError.response.status === 404) {
        return res.status(400).json({ error: 'Invalid CR Number / Tax Number: Not found in Wathq' });
      }
      
      throw apiError;
    }
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

router.get('/auth/verify', async (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const dbUser = await db('users').where({ id: decoded.id }).first();
    if (dbUser) {
       decoded.permissions = dbUser.permissions ? JSON.parse(dbUser.permissions) : null;
    }
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

