// app/dashboard/page.js
import { requireUser } from '../../lib/auth';
import db from '../../lib/db';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const user = requireUser();
  if (!user) {
    return (
      <main style={{ padding: 20 }}>
        <p>Not authenticated. Go to /login</p>
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const row = db
    .prepare(
      `SELECT 
        COUNT(*) as sales_count,
        COALESCE(SUM(total), 0) as total_amount
       FROM sales
       WHERE DATE(created_at) = ?`
    )
    .get(today);

  return (
    <main style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name || user.username}</p>
      <p>Today&apos;s sales count: {row.sales_count}</p>
      <p>Today&apos;s total (KWD): {row.total_amount}</p>
    </main>
  );
}
