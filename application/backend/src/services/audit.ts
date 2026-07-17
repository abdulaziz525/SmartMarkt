import { db } from '../config/db.js';

export async function logAudit(userId: string, userName: string, role: string, action: string, details: string, storeId?: string) {
  try {
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      role,
      action,
      details,
      store_id: storeId || null
    };
    await db('audit_logs').insert(newLog);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

