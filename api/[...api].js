import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Database pool (optional) - use DATABASE_URL (Supabase) in production
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
}

// In-memory fallbacks
const users = [
  { id: 1, username: 'admin', name: 'Administrator', role: 'admin', password: 'admin123' },
  { id: 2, username: 'cashier1', name: 'Cashier One', role: 'cashier', password: 'cashier123' },
];

const items = [
  { id: 1, name_en: 'Washed Sand', name_ar: 'الرمل المغسول', price_per_unit: 15.5, created_at: new Date().toISOString() },
  { id: 2, name_en: 'Concrete', name_ar: 'خرسانة', price_per_unit: 25.5, created_at: new Date().toISOString() },
  { id: 3, name_en: 'Gravel', name_ar: 'الحصى', price_per_unit: 12.0, created_at: new Date().toISOString() },
];

const sales = [];
const refunds = [];
const auditLogs = [];

let saleCounter = 1;
let refundCounter = 1;
let itemCounter = items.length + 1;

// Authentication
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (pool) {
      const { rows } = await pool.query('SELECT id, username, password, name, role FROM users WHERE username=$1', [username]);
      const user = rows[0];
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      auditLogs.push({ id: auditLogs.length + 1, user_name: user.name || 'Unknown', action: 'LOGIN', details: `User ${username} logged in`, timestamp: new Date().toISOString() });
      delete user.password;
      return res.json({ user });
    }
    // fallback in-memory
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    auditLogs.push({ id: auditLogs.length + 1, user_name: user?.name || 'Unknown', action: 'LOGIN', details: `User ${username} logged in`, timestamp: new Date().toISOString() });
    return res.json({ user });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => res.json({ success: true }));

// Items
app.get('/api/items', async (req, res) => {
  try {
    if (pool) {
      const { rows } = await pool.query('SELECT id, name_en, name_ar, price_per_unit, created_at FROM items ORDER BY id');
      return res.json(rows);
    }
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (pool) {
      const { rows } = await pool.query('SELECT id, name_en, name_ar, price_per_unit, created_at FROM items WHERE id=$1', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Item not found' });
      return res.json(rows[0]);
    }
    const item = items.find(i => i.id === id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const { name_en, name_ar, price_per_unit } = req.body;
    if (!name_en || !name_ar || !price_per_unit) return res.status(400).json({ error: 'Missing required fields' });
    if (pool) {
      const { rows } = await pool.query('INSERT INTO items (name_en, name_ar, price_per_unit) VALUES ($1,$2,$3) RETURNING id, name_en, name_ar, price_per_unit, created_at', [name_en, name_ar, price_per_unit]);
      const newItem = rows[0];
      await pool.query('INSERT INTO audit_logs (user_name, action, details) VALUES ($1,$2,$3)', ['Admin', 'CREATE_ITEM', `Created item: ${name_en}`]);
      return res.status(201).json(newItem);
    }
    const newItem = { id: itemCounter++, name_en, name_ar, price_per_unit, created_at: new Date().toISOString() };
    items.push(newItem);
    auditLogs.push({ id: auditLogs.length + 1, user_name: 'Admin', action: 'CREATE_ITEM', details: `Created item: ${name_en}`, timestamp: new Date().toISOString() });
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/items/:id/price', async (req, res) => {
  try {
    const { price_per_unit } = req.body;
    const id = parseInt(req.params.id);
    if (pool) {
      const { rows } = await pool.query('UPDATE items SET price_per_unit=$1 WHERE id=$2 RETURNING id, name_en, name_ar, price_per_unit, created_at', [price_per_unit, id]);
      if (!rows[0]) return res.status(404).json({ error: 'Item not found' });
      await pool.query('INSERT INTO audit_logs (user_name, action, details) VALUES ($1,$2,$3)', ['Admin', 'UPDATE_PRICE', `Updated ${rows[0].name_en} price to ${price_per_unit}`]);
      return res.json(rows[0]);
    }
    const item = items.find(i => i.id === id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    const oldPrice = item.price_per_unit;
    item.price_per_unit = price_per_unit;
    auditLogs.push({ id: auditLogs.length + 1, user_name: 'Admin', action: 'UPDATE_PRICE', details: `Updated ${item.name_en} price from ${oldPrice} to ${price_per_unit}`, timestamp: new Date().toISOString() });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (pool) {
      const { rows } = await pool.query('DELETE FROM items WHERE id=$1 RETURNING id, name_en', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Item not found' });
      await pool.query('INSERT INTO audit_logs (user_name, action, details) VALUES ($1,$2,$3)', ['Admin', 'DELETE_ITEM', `Deleted item: ${rows[0].name_en}`]);
      return res.json({ success: true });
    }
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ error: 'Item not found' });
    const deletedItem = items.splice(index, 1)[0];
    auditLogs.push({ id: auditLogs.length + 1, user_name: 'Admin', action: 'DELETE_ITEM', details: `Deleted item: ${deletedItem.name_en}`, timestamp: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/sales', (req, res) => {
  const { items: saleItems, subtotal, discount_amount, discount_percentage, total_amount, payment_method, knet_reference, cheque_number, notes } = req.body;
  const newSale = { id: sales.length + 1, sale_number: `SALE-2025-${String(saleCounter).padStart(6, '0')}`, sale_date: new Date().toISOString(), cashier_name: 'Cashier One', items: saleItems, subtotal, discount_amount, discount_percentage, total_amount, payment_method, knet_reference, cheque_number, status: 'completed', notes };
  sales.push(newSale);
  saleCounter++;
  auditLogs.push({ id: auditLogs.length + 1, user_name: 'Cashier One', action: 'CREATE_SALE', details: `Sale ${newSale.sale_number} created for ${total_amount} KWD`, timestamp: new Date().toISOString() });
  res.status(201).json(newSale);
});

app.get('/api/sales', (req, res) => {
  const { date } = req.query;
  if (date) {
    const filteredSales = sales.filter(s => new Date(s.sale_date).toISOString().split('T')[0] === date);
    return res.json(filteredSales);
  }
  res.json(sales);
});

app.get('/api/sales/:saleNumber', (req, res) => {
  const sale = sales.find(s => s.sale_number === req.params.saleNumber);
  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  res.json(sale);
});

app.post('/api/refunds', (req, res) => {
  const { sale_id, amount, reason } = req.body;
  const sale = sales.find(s => s.id === sale_id);
  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  const newRefund = { id: refunds.length + 1, refund_number: `REFUND-2025-${String(refundCounter).padStart(6, '0')}`, sale_id, amount, reason, created_at: new Date().toISOString() };
  refunds.push(newRefund);
  sale.status = 'refunded';
  refundCounter++;
  auditLogs.push({ id: auditLogs.length + 1, user_name: 'Admin', action: 'CREATE_REFUND', details: `Refund ${newRefund.refund_number} created for ${amount} KWD`, timestamp: new Date().toISOString() });
  res.status(201).json(newRefund);
});

app.get('/api/refunds', (req, res) => res.json(refunds));

app.get('/api/refunds/:refundNumber', (req, res) => {
  const refund = refunds.find(r => r.refund_number === req.params.refundNumber);
  if (!refund) return res.status(404).json({ error: 'Refund not found' });
  res.json(refund);
});

app.get('/api/reports/daily', (req, res) => {
  const { date } = req.query;
  let dailySales = sales;
  if (date) dailySales = sales.filter(s => new Date(s.sale_date).toISOString().split('T')[0] === date);
  const total_revenue = dailySales.reduce((sum, s) => sum + s.total_amount, 0);
  const total_sales_count = dailySales.length;
  const sales_by_payment = [
    { name: 'Cash', value: dailySales.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + s.total_amount, 0) },
    { name: 'KNET', value: dailySales.filter(s => s.payment_method === 'knet').reduce((sum, s) => sum + s.total_amount, 0) },
    { name: 'Cheque', value: dailySales.filter(s => s.payment_method === 'cheque').reduce((sum, s) => sum + s.total_amount, 0) },
    { name: 'Credit', value: dailySales.filter(s => s.payment_method === 'credit').reduce((sum, s) => sum + s.total_amount, 0) },
  ];
  const itemSalesMap = new Map();
  dailySales.forEach(sale => {
    sale.items.forEach(item => {
      const key = item.item_name_en;
      itemSalesMap.set(key, (itemSalesMap.get(key) || 0) + item.quantity);
    });
  });
  const top_items = Array.from(itemSalesMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  res.json({ date: date || new Date().toISOString().split('T')[0], total_revenue, total_sales_count, sales_by_payment, top_items });
});

app.get('/api/reports/sales-csv', (req, res) => {
  const { date } = req.query;
  let dailySales = sales;
  if (date) dailySales = sales.filter(s => new Date(s.sale_date).toISOString().split('T')[0] === date);
  const headers = ['Sale No', 'Date', 'Time', 'Cashier', 'Status', 'Total (KWD)', 'Payment Method', 'Reference', 'Items'];
  const rows = dailySales.map(s => [s.sale_number, new Date(s.sale_date).toLocaleDateString(), new Date(s.sale_date).toLocaleTimeString(), s.cashier_name, s.status, s.total_amount.toFixed(3), s.payment_method, s.knet_reference || s.cheque_number || '', s.items.map(i => `${i.item_name_en} (${i.quantity})`).join('; ')]);
  const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="sales_${date}.csv"`);
  res.send(csvContent);
});

app.get('/api/audit-logs', (req, res) => {
  const { limit, action } = req.query;
  let filteredLogs = [...auditLogs];
  if (action) filteredLogs = filteredLogs.filter(log => log.action === action);
  if (limit) filteredLogs = filteredLogs.slice(-parseInt(limit));
  res.json(filteredLogs.reverse());
});

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default serverless(app);
