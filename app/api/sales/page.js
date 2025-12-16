'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

export default function SalesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('amount');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [knetRef, setKnetRef] = useState('');
  const [chequeNum, setChequeNum] = useState('');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (session?.user?.role !== 'cashier') {
      router.push('/dashboard');
    }
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await fetch('/api/items');
    if (res.ok) {
      const data = await res.json();
      setItems(data);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find((ci) => ci.item_id === item.id);
    if (existing) {
      existing.quantity += 1;
      existing.line_total = existing.quantity * existing.unit_price;
    } else {
      cart.push({
        item_id: item.id,
        item_name_en: item.name_en,
        item_name_ar: item.name_ar,
        unit_price: item.price_per_unit,
        quantity: 1,
        line_total: item.price_per_unit,
      });
    }
    setCart([...cart]);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((ci) => ci.item_id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    const item = cart.find((ci) => ci.item_id === itemId);
    if (item) {
      item.quantity = Math.max(0.1, parseFloat(quantity) || 0);
      item.line_total = item.quantity * item.unit_price;
      setCart([...cart]);
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, ci) => sum + ci.line_total, 0);
    let discountAmount = 0;
    if (discountType === 'amount') {
      discountAmount = Math.min(discount, subtotal);
    } else {
      discountAmount = (subtotal * discount) / 100;
    }
    const total = subtotal - discountAmount;
    return { subtotal, discountAmount, total };
  };

  const handleCompleteSale = async () => {
    // KNET validation
    if (paymentMethod === 'knet' && !knetRef.trim()) {
      alert('KNET reference number is required');
      return;
    }

    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    const { subtotal, discountAmount, total } = calculateTotals();

    const saleData = {
      user_id: session.user.id,
      items: cart,
      subtotal,
      discount_amount: discountAmount,
      discount_percentage: discountType === 'percentage' ? discount : 0,
      total_amount: total,
      payment_method: paymentMethod,
      knet_reference: paymentMethod === 'knet' ? knetRef : null,
      cheque_number: paymentMethod === 'cheque' ? chequeNum : null,
    };

    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData),
    });

    if (res.ok) {
      const sale = await res.json();
      generatePDF(sale);
      resetForm();
    } else {
      alert('Error creating sale');
    }
  };

  const generatePDF = (sale) => {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 10;

    // Header
    pdf.setFontSize(16);
    pdf.text('SALES RECEIPT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.text(`Sale #: ${sale.sale_number}`, 10, yPosition);
    yPosition += 5;
    pdf.text(`Date: ${new Date(sale.created_at).toLocaleString()}`, 10, yPosition);
    yPosition += 5;
    pdf.text(`Cashier: ${session.user.name}`, 10, yPosition);
    yPosition += 10;

    // Items
    pdf.setFontSize(9);
    pdf.text('Item', 10, yPosition);
    pdf.text('Qty (cbm)', 80, yPosition);
    pdf.text('Price', 120, yPosition);
    pdf.text('Total', 160, yPosition);
    yPosition += 6;

    sale.items.forEach((item) => {
      pdf.text(item.item_name_en, 10, yPosition);
      pdf.text(item.quantity.toString(), 80, yPosition);
      pdf.text(`${item.unit_price.toFixed(3)} KWD`, 120, yPosition);
      pdf.text(`${item.line_total.toFixed(3)} KWD`, 160, yPosition);
      yPosition += 5;
    });

    yPosition += 5;
    pdf.setDrawColor(0);
    pdf.line(10, yPosition, 190, yPosition);
    yPosition += 5;

    // Totals
    pdf.text(`Subtotal: ${sale.subtotal.toFixed(3)} KWD`, 120, yPosition);
    yPosition += 5;
    if (sale.discount_amount > 0) {
      pdf.text(`Discount: -${sale.discount_amount.toFixed(3)} KWD`, 120, yPosition);
      yPosition += 5;
    }
    pdf.setFontSize(11);
    pdf.text(`TOTAL: ${sale.total_amount.toFixed(3)} KWD`, 120, yPosition);
    yPosition += 8;

    // Payment
    pdf.setFontSize(9);
    pdf.text(`Payment: ${paymentMethod.toUpperCase()}`, 10, yPosition);
    if (paymentMethod === 'knet') {
      yPosition += 5;
      pdf.text(`KNET Ref: ${knetRef}`, 10, yPosition);
    }

    pdf.save(`Receipt-${sale.sale_number}.pdf`);
  };

  const resetForm = () => {
    setCart([]);
    setDiscount(0);
    setDiscountType('amount');
    setPaymentMethod('cash');
    setKnetRef('');
    setChequeNum('');
  };

  const { subtotal, discountAmount, total } = calculateTotals();

  return (
    <div className="container mx-auto">
      <h2 className="text-2xl font-bold mb-6">New Sale</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items Selection */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg border-2 border-gray-200 text-left"
              >
                <p className="font-semibold">{item.name_en}</p>
                <p className="text-sm text-gray-600">{item.name_ar}</p>
                <p className="text-lg font-bold text-accent mt-2">
                  {item.price_per_unit.toFixed(3)} KWD/{item.unit}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart & Checkout */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4">Cart</h3>

          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.item_id} className="border-b pb-2">
                <p className="font-semibold text-sm">{item.item_name_en}</p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.item_id, e.target.value)}
                    className="w-16 border px-2 py-1 text-sm"
                  />
                  <span className="text-sm flex-1">cbm @ {item.unit_price.toFixed(3)}</span>
                  <button
                    onClick={() => removeFromCart(item.item_id)}
                    className="bg-red-500 text-white text-xs px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-sm text-right">{item.line_total.toFixed(3)} KWD</p>
              </div>
            ))}
          </div>

          {/* Discount */}
          <div className="mb-4 pb-4 border-b">
            <label className="block text-sm font-medium mb-2">Discount</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="flex-1 border px-2 py-1 text-sm"
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="border px-2 py-1 text-sm"
              >
                <option value="amount">KWD</option>
                <option value="percentage">%</option>
              </select>
            </div>
          </div>

          {/* Totals */}
          <div className="mb-4 space-y-2 pb-4 border-b">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{subtotal.toFixed(3)} KWD</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount:</span>
                <span>-{discountAmount.toFixed(3)} KWD</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{total.toFixed(3)} KWD</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border px-2 py-2 text-sm rounded"
            >
              <option value="cash">Cash</option>
              <option value="knet">KNET</option>
              <option value="cheque">Cheque</option>
              <option value="credit">Credit</option>
            </select>
          </div>

          {/* KNET Reference */}
          {paymentMethod === 'knet' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">KNET Reference *</label>
              <input
                type="text"
                value={knetRef}
                onChange={(e) => setKnetRef(e.target.value)}
                placeholder="Required"
                className={`w-full border px-2 py-2 text-sm rounded ${
                  !knetRef ? 'border-red-500' : ''
                }`}
              />
              <p className="text-xs text-red-600 mt-1">
                {!knetRef ? 'KNET reference is required' : ''}
              </p>
            </div>
          )}

          {/* Cheque Number */}
          {paymentMethod === 'cheque' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Cheque Number</label>
              <input
                type="text"
                value={chequeNum}
                onChange={(e) => setChequeNum(e.target.value)}
                className="w-full border px-2 py-2 text-sm rounded"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || (paymentMethod === 'knet' && !knetRef)}
              className="flex-1 bg-accent text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Complete Sale
            </button>
            <button
              onClick={resetForm}
              className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
