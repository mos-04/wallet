const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'pos.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function initDb() {
  const db = getDb();

  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'cashier')),
      name TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      unit TEXT DEFAULT 'cbm',
      price_per_unit DECIMAL(10, 3) NOT NULL,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Sales Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_items_qty DECIMAL(10, 3),
      subtotal DECIMAL(10, 3),
      discount_amount DECIMAL(10, 3) DEFAULT 0,
      discount_percentage DECIMAL(5, 2) DEFAULT 0,
      total_amount DECIMAL(10, 3),
      payment_method TEXT NOT NULL CHECK(payment_method IN ('knet', 'cash', 'cheque', 'credit')),
      knet_reference TEXT,
      cheque_number TEXT,
      status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'cancelled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Sale Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      quantity DECIMAL(10, 3),
      unit_price DECIMAL(10, 3),
      line_total DECIMAL(10, 3),
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    );
  `);

  // Cancellation Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cancellation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      cancelled_by_user_id INTEGER NOT NULL,
      cancellation_reason TEXT,
      cancelled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id)
    );
  `);

  // Seed initial data
  try {
    const adminCheck = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (adminCheck.count === 0) {
      const bcrypt = require('bcrypt');
      const adminPassword = bcrypt.hashSync('admin123', 10);
      const cashierPassword = bcrypt.hashSync('cashier123', 10);

      db.prepare(`
        INSERT INTO users (username, password, role, name)
        VALUES (?, ?, ?, ?)
      `).run('admin', adminPassword, 'admin', 'Administrator');

      db.prepare(`
        INSERT INTO users (username, password, role, name)
        VALUES (?, ?, ?, ?)
      `).run('cashier1', cashierPassword, 'cashier', 'Cashier 1');
    }

    const itemsCheck = db.prepare('SELECT COUNT(*) as count FROM items').get();
    if (itemsCheck.count === 0) {
      db.prepare(`
        INSERT INTO items (name_en, name_ar, unit, price_per_unit)
        VALUES (?, ?, ?, ?)
      `).run('Washed Sand', 'الرمل المغسول', 'cbm', 15.500);

      db.prepare(`
        INSERT INTO items (name_en, name_ar, unit, price_per_unit)
        VALUES (?, ?, ?, ?)
      `).run('Sand', 'رمل', 'cbm', 12.000);

      db.prepare(`
        INSERT INTO items (name_en, name_ar, unit, price_per_unit)
        VALUES (?, ?, ?, ?)
      `).run('Gatch', 'جتش', 'cbm', 18.750);
    }
  } catch (error) {
    console.log('Seed data already exists or error:', error.message);
  }
}

module.exports = { getDb, initDb };
