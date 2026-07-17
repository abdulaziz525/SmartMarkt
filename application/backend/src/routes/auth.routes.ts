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

router.post('/auth/setup', async (req, res) => {
  try {
    const { fullName, email, password, nameAr, nameEn, vatNumber, phone, address } = req.body;
    
    const userCount = await db('users').count({ count: '*' }).first();
    if ((Number(userCount?.count) || 0) > 0) {
      return res.status(403).json({ error: 'Setup already completed. Users exist.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newOwnerId = Math.random().toString(36).substring(2, 9);
    
    const newOwner = {
      id: newOwnerId,
      username: email,
      password: hashedPassword,
      nameAr: fullName,
      nameEn: fullName,
      role: 'owner',
      active: true
    };

    const storeInfo = {
      nameAr,
      nameEn,
      vatNumber,
      phone,
      address
    };

    await db.transaction(async (trx) => {
      await trx('users').insert(newOwner);
      const existingStore = await trx('store_info').first();
      if (existingStore) {
        await trx('store_info').update(storeInfo);
      } else {
        await trx('store_info').insert(storeInfo);
      }
    });

    const token = jwt.sign(
      { id: newOwner.id, role: newOwner.role, nameAr: newOwner.nameAr },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    const { password: _, ...userData } = newOwner;
    res.status(201).json(userData);
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
      { id: user.id, role: user.role, nameAr: user.nameAr },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Remove password hash before sending
    const { password: _, ...userData } = user;
    res.json(userData);

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/logout', (req, res) => {
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
    const { username, email, id, password } = req.body;
    
    // We will use email as username since login uses it
    const actualUsername = email || username;

    const existingUser = await db('users').where({ username: actualUsername }).first();
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: id || Math.random().toString(36).substring(2, 9),
      username: actualUsername,
      password: hashedPassword,
      nameAr: username,
      nameEn: username,
      role: 'cashier',
      active: true
    };

    await db('users').insert(newUser);

    const token = jwt.sign(
      { id: newUser.id, role: newUser.role, nameAr: newUser.nameAr },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    const { password: _, ...userData } = newUser;
    res.status(201).json(userData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
