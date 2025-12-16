import { getDb } = require('@/lib/db');
import { getServerSession } = require('next-auth/next');
import { authOptions } = require('../../auth/[...nextauth]/route');

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cancellation_reason } = await req.json();
    const saleId = params.id;

    const db = getDb();

    // Mark sale as cancelled
    db.prepare('UPDATE sales SET status = ? WHERE id = ?').run('cancelled', saleId);

    // Log cancellation
    db.prepare(`
      INSERT INTO cancellation_logs (sale_id, cancelled_by_user_id, cancellation_reason)
      VALUES (?, ?, ?)
    `).run(saleId, session.user.id, cancellation_reason || null);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
