import { getDb } = require('@/lib/db');
import { getServerSession } = require('next-auth/next');
import { authOptions } = require('../auth/[...nextauth]/route');

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      items,
      subtotal,
      discount_amount,
      discount_percentage,
      total_amount,
      payment_method,
      knet_reference,
      cheque_number,
    } = await req.json();

    // KNET validation
    if (payment_method === 'knet' && !knet_reference) {
      return Response.json(
        { error: 'KNET reference required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Generate sale number
    const lastSale = db.prepare('SELECT MAX(id) as id FROM sales').get();
    const saleNumber = `SALE-${new Date().getFullYear()}-${String((lastSale.id || 0) + 1).padStart(6, '0')}`;

    // Create sale
    const saleResult = db.prepare(`
      INSERT INTO sales (
        sale_number, user_id, total_items_qty, subtotal, discount_amount,
        discount_percentage, total_amount, payment_method, knet_reference,
        cheque_number, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
    `).run(
      saleNumber,
      session.user.id,
      items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      discount_amount,
      discount_percentage,
      total_amount,
      payment_method,
      knet_reference,
      cheque_number
    );

    const saleId = saleResult.lastInsertRowid;

    // Add sale items
    const itemStmt = db.prepare(`
      INSERT INTO sale_items (sale_id, item_id, quantity, unit_price, line_total)
      VALUES (?, ?, ?, ?, ?)
    `);

    items.forEach((item) => {
      itemStmt.run(
        saleId,
        item.item_id,
        item.quantity,
        item.unit_price,
        item.line_total
      );
    });

    // Fetch complete sale with items
    const sale = db.prepare(`
      SELECT s.*, GROUP_CONCAT(
        json_object(
          'item_id', si.item_id,
          'item_name_en', i.name_en,
          'item_name_ar', i.name_ar,
          'quantity', si.quantity,
          'unit_price', si.unit_price,
          'line_total', si.line_total
        )
      ) as items_json
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN items i ON si.item_id = i.id
      WHERE s.id = ?
      GROUP BY s.id
    `).get(saleId);

    // Parse items JSON
    sale.items = sale.items_json
      ? JSON.parse('[' + sale.items_json + ']')
      : [];
    delete sale.items_json;

    return Response.json(sale);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    const db = getDb();
    let query = 'SELECT * FROM sales WHERE status = ? ORDER BY created_at DESC';
    let params = ['completed'];

    if (date) {
      query += ' AND DATE(created_at) = ?';
      params.push(date);
    }

    const sales = db.prepare(query).all(...params);
    return Response.json(sales);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
