import React, { useEffect } from 'react';
import { Sale, Refund } from '../types';

interface ReceiptModalProps {
  sale?: Sale;
  refund?: Refund;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, refund, onClose }) => {
  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const generateReceiptHTML = () => {
    const isRefund = !!refund;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html, body {
            width: 80mm;
            margin: 0;
            padding: 0;
            background: white;
            font-family: 'Courier New', monospace;
            font-size: 9pt;
            line-height: 1.2;
            color: black;
          }
          
          .receipt {
            width: 80mm;
            padding: 3mm;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 3mm;
            padding-bottom: 2mm;
            border-bottom: 1px dashed black;
          }
          
          .header h1 {
            font-size: 11pt;
            font-weight: bold;
            margin: 0 0 2mm 0;
          }
          
          .header h2 {
            font-size: 10pt;
            font-weight: bold;
            margin: 0 0 3mm 0;
          }
          
          .receipt-type {
            text-align: center;
            margin: 2mm 0;
            padding: 1mm 0;
            border-top: 1px dashed black;
            border-bottom: 1px dashed black;
            font-weight: bold;
            font-size: 9pt;
          }
          
          .info-section {
            margin-bottom: 3mm;
            font-size: 8pt;
            line-height: 1.4;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
          }
          
          .info-row-ar {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
            direction: rtl;
            text-align: right;
          }
          
          .items-section {
            margin-bottom: 3mm;
          }
          
          .section-title {
            text-align: center;
            font-weight: bold;
            font-size: 8pt;
            padding: 1mm 0;
            border-top: 1px dashed black;
            border-bottom: 1px dashed black;
            margin-bottom: 2mm;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
          }
          
          th {
            text-align: left;
            border-bottom: 1px solid black;
            padding: 1mm 0;
            font-weight: bold;
          }
          
          th.qty {
            text-align: center;
          }
          
          th.price {
            text-align: right;
          }
          
          td {
            padding: 1mm 0;
            border-bottom: 1px dashed #ccc;
          }
          
          td.item-name-en {
            font-weight: bold;
          }
          
          td.item-name-ar {
            font-size: 7pt;
          }
          
          td.qty {
            text-align: center;
          }
          
          td.price {
            text-align: right;
            font-weight: bold;
          }
          
          .totals-section {
            margin-bottom: 3mm;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            margin-bottom: 1mm;
          }
          
          .total-row.final {
            font-weight: bold;
            font-size: 9pt;
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            padding: 1mm 0;
            margin: 2mm 0;
          }
          
          .payment-section {
            margin-bottom: 3mm;
            font-size: 8pt;
          }
          
          .footer {
            text-align: center;
            margin-top: 4mm;
            padding-top: 2mm;
            border-top: 1px solid black;
            font-size: 8pt;
            line-height: 1.6;
          }
          
          .footer p {
            margin: 0 0 1mm 0;
          }
          
          @page {
            size: 80mm auto;
            margin: 0;
            padding: 0;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
              width: 80mm;
            }
            .receipt {
              padding: 2mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <!-- HEADER -->
          <div class="header">
            <h1>KUWAIT CONSTRUCTION MAT.</h1>
            <h2>مواد البناء الكويتية</h2>
            <div class="receipt-type">
              ${isRefund ? '<div>REFUND RECEIPT</div><div>فاتورة استرجاع</div>' : '<div>SALES RECEIPT</div><div>فاتورة بيع</div>'}
            </div>
          </div>
          
          <!-- INFO SECTION -->
          <div class="info-section">
            <div class="info-row">
              <span class="bold">${isRefund ? refund!.refund_number : sale!.sale_number}</span>
              <span>Sale Number:</span>
            </div>
            <div class="info-row-ar">
              <span>:رقم الفاتورة</span>
              <span class="bold">${isRefund ? refund!.refund_number : sale!.sale_number}</span>
            </div>
            
            ${isRefund ? `<div class="info-row" style="font-size: 7pt;">Original Sale: ${refund!.sale_id}</div>` : ''}
            
            <div class="info-row" style="margin-top: 1mm;">
              <span>${sale?.cashier_name || 'Admin'}</span>
              <span>Cashier:</span>
            </div>
            <div class="info-row-ar">
              <span>:أمين الصندوق</span>
              <span>${sale?.cashier_name || 'Admin'}</span>
            </div>
            
            <div class="info-row" style="margin-top: 1mm;">
              <span>${formatDateTime(isRefund ? refund!.created_at : sale!.sale_date)}</span>
              <span>Date/Time:</span>
            </div>
            <div class="info-row-ar">
              <span>:التاريخ/الوقت</span>
              <span>${formatDateTime(isRefund ? refund!.created_at : sale!.sale_date)}</span>
            </div>
          </div>
          
          <!-- ITEMS SECTION -->
          ${!isRefund && sale ? `
            <div class="items-section">
              <div class="section-title">ITEMS / البنود</div>
              <table>
                <thead>
                  <tr>
                    <th>Item/البند</th>
                    <th class="qty">Qty</th>
                    <th class="price">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${sale.items.map((item) => `
                    <tr>
                      <td>
                        <div class="item-name-en">${item.item_name_en}</div>
                        <div class="item-name-ar">${item.item_name_ar}</div>
                      </td>
                      <td class="qty">${item.quantity.toFixed(2)}</td>
                      <td class="price">${item.line_total.toFixed(3)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
          <!-- TOTALS SECTION -->
          <div class="totals-section">
            <div class="section-title">${isRefund ? 'REFUND DETAILS / تفاصيل الاسترجاع' : 'TOTALS / الإجماليات'}</div>
            
            ${!isRefund && sale ? `
              <div class="total-row">
                <span>${sale.subtotal.toFixed(3)} KWD</span>
                <span>Subtotal / الإجمالي</span>
              </div>
              
              ${sale.discount_amount > 0 ? `
                <div class="total-row">
                  <span>-${sale.discount_amount.toFixed(3)} KWD</span>
                  <span>Discount / الخصم ${sale.discount_percentage > 0 ? `(${sale.discount_percentage}%)` : ''}</span>
                </div>
              ` : ''}
              
              <div class="total-row final">
                <span>${sale.total_amount.toFixed(3)} KWD</span>
                <span>TOTAL / الصافي</span>
              </div>
              <div style="text-align: right; font-weight: bold; font-size: 9pt;">
                ${sale.total_amount.toFixed(3)} د.ك
              </div>
            ` : ''}
            
            ${isRefund ? `
              <div class="total-row final">
                <span>${refund!.amount.toFixed(3)} KWD</span>
                <span>Refund Amount</span>
              </div>
              <div style="text-align: right; font-weight: bold; font-size: 9pt;">
                ${refund!.amount.toFixed(3)} د.ك
              </div>
              <div style="margin-top: 1mm; font-size: 8pt;">
                <strong>Reason:</strong> ${refund!.reason}
              </div>
            ` : ''}
          </div>
          
          <!-- PAYMENT SECTION -->
          ${!isRefund && sale ? `
            <div class="payment-section">
              <div class="section-title">PAYMENT / الدفع</div>
              <div class="total-row">
                <span style="font-weight: bold; text-transform: uppercase;">${sale.payment_method}</span>
                <span>Method:</span>
              </div>
              ${sale.payment_method === 'knet' && sale.knet_reference ? `
                <div class="total-row">
                  <span>${sale.knet_reference}</span>
                  <span>Ref No:</span>
                </div>
              ` : ''}
              ${sale.payment_method === 'cheque' && sale.cheque_number ? `
                <div class="total-row">
                  <span>${sale.cheque_number}</span>
                  <span>Cheque No:</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <!-- FOOTER -->
          <div class="footer">
            <p style="font-weight: bold;">THANK YOU / شكرا لك</p>
            <p>أهلا بك مجددا</p>
            <p>WELCOME BACK</p>
            <p style="margin-top: 1mm; font-size: 7pt;">${formatDateTime(new Date().toISOString())}</p>
            <p style="font-size: 7pt;">Powered by POS System v1.0</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateReceiptHTML());
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }
  };

  if (!sale && !refund) return null;

  const isRefund = !!refund;

  return (
    <>
      <style>{`
        @media print {
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          
          html, body {
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .receipt-modal-wrapper {
            position: static !important;
            inset: auto !important;
            background: white !important;
            width: 80mm !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            display: block !important;
          }
          
          .receipt-backdrop {
            display: none !important;
          }
          
          .receipt-actions {
            display: none !important;
          }
          
          .receipt-content {
            width: 80mm !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
        }
        
        @page {
          size: 80mm 297mm;
          margin: 0;
          padding: 0;
        }
      `}</style>

      <div className="receipt-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="receipt-modal-wrapper bg-white w-96 shadow-xl">
          <div className="receipt-content font-mono text-sm leading-tight text-black p-4">
            
            {/* HEADER Section */}
            <div className="text-center mb-4 pb-2 border-b border-black border-dashed">
              <h1 className="text-xl font-bold">KUWAIT CONSTRUCTION MAT.</h1>
              <h2 className="text-lg font-bold font-arabic mb-2">مواد البناء الكويتية</h2>
              
              <div className="my-2 border-t border-b border-black py-1">
                {isRefund ? (
                   <>
                     <h3 className="text-lg font-bold">REFUND RECEIPT</h3>
                     <h3 className="text-lg font-bold font-arabic">فاتورة استرجاع</h3>
                   </>
                ) : (
                   <>
                     <h3 className="text-lg font-bold">SALES RECEIPT</h3>
                     <h3 className="text-lg font-bold font-arabic">فاتورة بيع</h3>
                   </>
                )}
              </div>
            </div>

            {/* INFO Section */}
            <div className="mb-4 space-y-1">
              <div className="flex justify-between">
                <span>Sale Number:</span>
                <span className="font-bold">{isRefund ? refund.refund_number : sale?.sale_number}</span>
              </div>
              <div className="flex justify-between font-arabic text-right">
                 <span className="font-bold">{isRefund ? refund.refund_number : sale?.sale_number}</span>
                 <span>:رقم الفاتورة</span>
              </div>
              
              {isRefund && (
                <div className="flex justify-between text-xs mt-1">
                  <span>Original Sale: {refund.sale_id}</span>
                </div>
              )}

              <div className="flex justify-between mt-2">
                <span>Cashier:</span>
                <span>{sale?.cashier_name || 'Admin'}</span>
              </div>
               <div className="flex justify-between font-arabic text-right">
                <span>{sale?.cashier_name || 'Admin'}</span>
                <span>:أمين الصندوق</span>
              </div>

              <div className="flex justify-between mt-2">
                <span>Date/Time:</span>
                <span>{formatDateTime(isRefund ? refund.created_at : sale!.sale_date)}</span>
              </div>
               <div className="flex justify-between font-arabic text-right">
                 <span>{formatDateTime(isRefund ? refund.created_at : sale!.sale_date)}</span>
                 <span>:التاريخ/الوقت</span>
              </div>
            </div>

            {/* ITEMS Section */}
            {!isRefund && sale && (
              <div className="mb-4">
                <div className="border-t border-b border-black border-dashed py-1 mb-2 text-center font-bold">
                  ITEMS / البنود
                </div>
                
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="w-1/2">Item/البند</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-dashed border-gray-300">
                        <td className="py-1 pr-2">
                          <div className="font-bold">{item.item_name_en}</div>
                          <div className="font-arabic text-xs">{item.item_name_ar}</div>
                        </td>
                        <td className="text-center">{item.quantity.toFixed(2)}</td>
                        <td className="text-right font-bold">
                          {item.line_total.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TOTALS Section */}
            <div className="mb-4">
              <div className="border-t border-b border-black border-dashed py-1 mb-2 text-center font-bold text-xs">
                 {isRefund ? 'REFUND DETAILS / تفاصيل الاسترجاع' : 'TOTALS / الإجماليات'}
              </div>

              {!isRefund && sale && (
                <>
                  <div className="flex justify-between text-xs">
                    <span>Subtotal / الإجمالي</span>
                    <span>{sale.subtotal.toFixed(3)} KWD</span>
                  </div>
                  
                  {sale.discount_amount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span>Discount / الخصم {sale.discount_percentage > 0 ? `(${sale.discount_percentage}%)` : ''}</span>
                      <span>-{sale.discount_amount.toFixed(3)} KWD</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-bold border-t border-black mt-2 pt-1">
                    <span>TOTAL / الصافي</span>
                    <span>{sale.total_amount.toFixed(3)} KWD</span>
                  </div>
                  <div className="text-right font-arabic font-bold text-base">
                    <span>{sale.total_amount.toFixed(3)} د.ك</span>
                  </div>
                </>
              )}

              {isRefund && (
                <>
                  <div className="flex justify-between font-bold text-base">
                    <span>Refund Amount</span>
                    <span>{refund.amount.toFixed(3)} KWD</span>
                  </div>
                   <div className="text-right font-arabic font-bold text-base">
                    <span>{refund.amount.toFixed(3)} د.ك</span>
                  </div>
                  <div className="mt-2 text-xs">
                    <p><strong>Reason:</strong> {refund.reason}</p>
                  </div>
                </>
              )}
            </div>

            {/* PAYMENT Section */}
            {!isRefund && sale && (
              <div className="mb-6">
                <div className="border-t border-b border-black border-dashed py-1 mb-2 text-center font-bold text-xs">
                  PAYMENT / الدفع
                </div>
                <div className="flex justify-between text-xs">
                  <span>Method:</span>
                  <span className="uppercase font-bold">{sale.payment_method}</span>
                </div>
                {sale.payment_method === 'knet' && sale.knet_reference && (
                  <div className="flex justify-between text-xs">
                    <span>Ref No:</span>
                    <span>{sale.knet_reference}</span>
                  </div>
                )}
                 {sale.payment_method === 'cheque' && sale.cheque_number && (
                  <div className="flex justify-between text-xs">
                    <span>Cheque No:</span>
                    <span>{sale.cheque_number}</span>
                  </div>
                )}
              </div>
            )}

            {/* FOOTER */}
            <div className="text-center text-xs space-y-1 mt-6 border-t border-black pt-4">
              <p className="font-bold">THANK YOU / شكرا لك</p>
              <p>WELCOME BACK / أهلا بك مجددا</p>
              <p className="mt-2 text-xs">{formatDateTime(new Date().toISOString())}</p>
              <p className="text-xs">Powered by POS System v1.0</p>
            </div>
          </div>

          {/* Screen Only Actions */}
          <div className="receipt-actions mt-6 flex gap-2 p-4 bg-gray-100 border-t">
            <button onClick={handlePrint} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
              Print
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-200 text-black py-2 rounded font-bold hover:bg-gray-300">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
