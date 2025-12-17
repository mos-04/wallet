import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Migration script: run with DATABASE_URL env var set
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: Set DATABASE_URL environment variable (Supabase connection string).');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        username text UNIQUE NOT NULL,
        password text NOT NULL,
        name text,
        role text,
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS items (
        id serial PRIMARY KEY,
        name_en text NOT NULL,
        name_ar text,
        price_per_unit numeric(12,3) NOT NULL,
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS sales (
        id serial PRIMARY KEY,
        sale_number text UNIQUE NOT NULL,
        sale_date timestamptz DEFAULT now(),
        cashier_name text,
        subtotal numeric(12,3),
        discount_amount numeric(12,3),
        discount_percentage numeric(5,2),
        total_amount numeric(12,3),
        payment_method text,
        knet_reference text,
        cheque_number text,
        status text,
        notes text
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id serial PRIMARY KEY,
        sale_id integer REFERENCES sales(id) ON DELETE CASCADE,
        item_id integer REFERENCES items(id),
        item_name_en text,
        quantity integer,
        unit_price numeric(12,3)
      );

      CREATE TABLE IF NOT EXISTS refunds (
        id serial PRIMARY KEY,
        refund_number text UNIQUE NOT NULL,
        sale_id integer REFERENCES sales(id),
        amount numeric(12,3),
        reason text,
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id serial PRIMARY KEY,
        user_name text,
        action text,
        details text,
        timestamp timestamptz DEFAULT now()
      );
    `);

    // Insert default users if not exists
    const adminPass = await bcrypt.hash('admin123', 10);
    const cashierPass = await bcrypt.hash('cashier123', 10);

    await client.query(`
      INSERT INTO users (username, password, name, role)
      VALUES
        ('admin', $1, 'Administrator', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `, [adminPass]);

    await client.query(`
      INSERT INTO users (username, password, name, role)
      VALUES
        ('cashier1', $1, 'Cashier One', 'cashier')
      ON CONFLICT (username) DO NOTHING;
    `, [cashierPass]);

    await client.query('COMMIT');
    console.log('Migration complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
