// app/api/sales/route.js
import { NextResponse } from 'next/server';
import db from '../../../lib/db';
import { requireUser } from '../../../lib/auth';

export async function POST(request) {
  const user = requireUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { lines, discount, payment_method, knet_ref } = body;

  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ message: 'No items' }, { status: 400 });
  }

  if (payment_method === 'KNET' && !knet_ref) {
    return NextResponse.json({ message: 'KNET reference required' }, { status: 400 });
  }

  let subtotal = 0;
  for (const l of lines) {
    subtotal += l.quantity * l.unit_price;
  }
  const total = subtotal - (discount || 0);

  const insertSale = db.prepare(
    `INSERT INTO sales (user_id, total, discount, payment_method, knet_ref)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertLine = db.prepare(
    `INSERT INTO sale_items (sale_id, item_id, quantity, unit_price)
     VALUES (?, ?, ?, ?)`
  );

  const transaction = db.transaction(() => {
    const info = insertSale.run(user.id, total, discount || 0, payment_method, knet_ref || null);
    const saleId = info.lastInsertRowid;
    for (const l of lines) {
      insertLine.run(saleId, l.item_id, l.quantity, l.unit_price);
    }
    return saleId;
  });

  const saleId = transaction();
  return NextResponse.json({ success: true, sale_id: saleId });
}
