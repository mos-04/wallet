import { getDb } = require('@/lib/db');
import { getServerSession } = require('next-auth/next');
import { authOptions } = require('../../auth/[...nextauth]/route');

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T');

    const db = getDb();

    // Total sales and revenue
    const totals = db.prepare(`
      SELECT 
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue
      FROM sales
      WHERE DATE(created_at) = ? AND status = 'completed'
    `).get(date);

    // By payment method
    const byPayment = {};
    const paymentStats = db.prepare(`
      SELECT payment_method, SUM(total_amount) as amount
      FROM sales
      WHERE DATE(created_at) = ? AND status = 'completed'
      GROUP BY payment_method
    `).all(date);

    paymentStats.forEach((row) => {
      byPayment[row.payment_method] = row.amount;
    });

    // By item
    const byItem = {};
    const itemStats = db.prepare(`
      SELECT i.name_en, SUM(si.quantity) as qty
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN items i ON si.item_id = i.id
      WHERE DATE(s.created_at) = ? AND s.status = 'completed'
      GROUP BY i.id
    `).all(date);

    itemStats.forEach((row) => {
      byItem[row.name_en] = row.qty;
    });

    // Cancelled count
    const cancelled = db.prepare(`
      SELECT COUNT(*) as count FROM sales
      WHERE DATE(created_at) = ? AND status = 'cancelled'
    `).get(date);

    return Response.json({
      date,
      total_sales: totals.total_sales || 0,
      total_revenue: totals.total_revenue || 0,
      by_payment: byPayment,
      by_item: byItem,
      cancelled_count: cancelled.count || 0,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
