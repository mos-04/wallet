// app/sales/page.js
'use client';

import { useEffect, useState } from 'react';

export default function SalesPage() {
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [knetRef, setKnetRef] = useState('');
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadItems() {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data.items || []);
    }
    loadItems();
  }, []);

  function addLine(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    setLines(prev => [...prev, { item, quantity: 1 }]);
  }

  function updateQty(index, qty) {
    const q = parseFloat(qty) || 0;
    setLines(prev => prev.map((l, i) => (i === index ? { ...l, quantity: q } : l)));
  }

  const subtotal = lines.reduce(
    (sum, l) => sum + l.quantity * l.item.price,
    0
  );
  const total = subtotal - (parseFloat(discount) || 0);

  async function submitSale() {
    setMessage('');
    if (!lines.length) {
      setMessage('Add at least one item');
      return;
    }
    if (paymentMethod === 'KNET' && !knetRef.trim()) {
      setMessage('KNET reference is required');
      return;
    }
    const body = {
      lines: lines.map(l => ({
        item_id: l.item.id,
        quantity: l.quantity,
        unit_price: l.item.price,
      })),
      discount: parseFloat(discount) || 0,
      payment_method: paymentMethod,
      knet_ref: paymentMethod === 'KNET' ? knetRef.trim() : null,
    };
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setLines([]);
      setDiscount(0);
      setKnetRef('');
      setPaymentMethod('Cash');
      setMessage('Sale completed and logged');
    } else {
      const data = await res.json();
      setMessage(data.message || 'Error creating sale');
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Sales</h1>

      <h3>Items</h3>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => addLine(item.id)}
          style={{ marginRight: 10, marginBottom: 5 }}
        >
          {item.name_en} ({item.price} KWD/{item.unit})
        </button>
      ))}

      <h3 style={{ marginTop: 20 }}>Current Sale</h3>
      {lines.map((l, index) => (
        <div key={index} style={{ marginBottom: 5 }}>
          {l.item.name_en} - 
          Qty: <input
            type="number"
            min="0"
            step="0.1"
            value={l.quantity}
            onChange={e => updateQty(index, e.target.value)}
            style={{ width: 70 }}
          />
          @ {l.item.price} KWD/{l.item.unit}
        </div>
      ))}

      <p>Subtotal: {subtotal.toFixed(3)} KWD</p>
      <div>
        Discount (KWD):{' '}
        <input
          type="number"
          value={discount}
          onChange={e => setDiscount(e.target.value)}
          style={{ width: 100 }}
        />
      </div>
      <p>Total: {total.toFixed(3)} KWD</p>

      <div style={{ marginTop: 10 }}>
        Payment:
        <select
          value={paymentMethod}
          onChange={e => setPaymentMethod(e.target.value)}
          style={{ marginLeft: 5 }}
        >
          <option>Cash</option>
          <option>KNET</option>
          <option>Cheque</option>
          <option>Credit</option>
        </select>
      </div>

      {paymentMethod === 'KNET' && (
        <div style={{ marginTop: 10 }}>
          KNET Reference:{' '}
          <input
            value={knetRef}
            onChange={e => setKnetRef(e.target.value)}
            required
          />
        </div>
      )}

      <button style={{ marginTop: 15 }} onClick={submitSale}>
        Complete Sale
      </button>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </main>
  );
}
