import { Router } from 'express';
import { db } from '../config/db.js';

const router = Router();

// Get all customers (optionally filter by store/organization if needed)
router.get('/customers', async (req, res) => {
  try {
    // In a multi-tenant system, you might want to filter by organization
    // For now, let's fetch all customers for the system
    const customers = await db('customers').select('*');
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific customer and their invoices
router.get('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await db('customers').where({ id }).first();
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const invoices = await db('invoices')
      .where({ customer_id: id })
      .orderBy('date', 'desc');

    const plans = await db('installment_plans').where({ customer_id: id });
    const planIds = plans.map(p => p.id);
    
    let installments: any[] = [];
    if (planIds.length > 0) {
      installments = await db('installments')
        .whereIn('plan_id', planIds)
        .orderBy('due_date', 'asc');
    }

    res.json({
      ...customer,
      invoices,
      installment_plans: plans.map(plan => ({
        ...plan,
        installments: installments.filter(i => i.plan_id === plan.id)
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
