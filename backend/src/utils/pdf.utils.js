/**
 * PDF Utility — Shibra Wholesale Mobile Accessories
 * Clean professional invoice: no GST, full product detail, advance/token, balance
 */

const PDFDocument = require('pdfkit');
const StoreSettings = require('../models/StoreSettings');

// ── Theme config ────────────────────────────────────────────────
const PURPLE = '#7c3aed';
const DARK = '#1E293B';
const GREY = '#64748B';
const LIGHT = '#F8FAFC';
const WHITE = '#FFFFFF';
const BORDER = '#E2E8F0';

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (n) => `Rs.${Number(n || 0).toFixed(2)}`;

const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
};

// Normalize invoice object — works for both Invoice-model objects and raw order maps
const normalize = (raw) => {
  if (!raw) return {};
  const order = raw.order || {};
  const user  = raw.user || {};
  const addr  = raw.billingAddress || raw.shippingAddress || {};

  // Invoice number
  const invoiceNumber = raw.invoiceNumber ||
    (order.orderNumber ? `INV-${order.orderNumber}` : 'INV-DRAFT');

  // Order number
  const orderNumber = raw.orderNumber || order.orderNumber || '-';

  // Customer
  const customerName  = addr.name  || user.name  || raw.customerName  || '-';
  const customerPhone = addr.phone || user.phone  || raw.customerPhone || '-';

  // Address lines
  const addressParts = [
    addr.addressLine1, addr.addressLine2,
    addr.city, addr.state,
    addr.pincode ? `- ${addr.pincode}` : '',
  ].filter(Boolean);

  // Financial
  const grandTotal     = Number(raw.grandTotal || raw.amount || raw.subtotal || 0);
  const shipping       = Number(raw.shipping || order.shippingCharge || 0);
  const discount       = Number(raw.discount || order.discount || raw.coupon?.discountAmount || 0);
  const tokenReceived  = Number(raw.tokenReceived || raw.token || order.tokenReceived || 0);
  const rawTotal       = grandTotal + shipping - discount;
  const balance        = Math.max(0, rawTotal - tokenReceived);
  const roundedBalance = Math.round(balance);

  // Items — normalise item fields
  const items = (raw.items || []).map(item => ({
    name:        item.name || 'Product',
    variantName: item.variantName || '',
    quantity:    Number(item.quantity || 0),
    mrp:         Number(item.mrp || item.price || 0),
    price:       Number(item.price || 0),
    total:       Number(item.total || item.totalWithTax || (Number(item.price || 0) * Number(item.quantity || 0))),
  }));

  return {
    invoiceNumber,
    orderNumber,
    invoiceDate: raw.invoiceDate || raw.createdAt || new Date(),
    customerName,
    customerPhone,
    addressParts,
    grandTotal,
    shipping,
    discount,
    tokenReceived,
    rawTotal,
    balance,
    roundedBalance,
    items,
    payment: raw.payment || order.payment || {},
  };
};

// ── Main generator ────────────────────────────────────────────────
const generateInvoicePDF = async (rawInvoice) => {
  // Fetch dynamic company details
  const settings = await StoreSettings.findOne() || {};
  const companyConfig = {
    name: settings.storeName || 'Shibra',
    tradeName: settings.companyTradeName || 'Arbuda accessories',
    address: settings.companyAddress || 'Shop No. 481, 4th Floor, D-Block, Hubtown Building,',
    address2: `${settings.companyCity || 'Ahmedabad'} - ${settings.companyPincode || '380022'}, ${settings.companyState || 'Gujarat'}`,
    phone: settings.companyPhone || '9549289191',
    email: settings.companyEmail || 'info@shibra.in',
  };

  return new Promise((resolve, reject) => {
    try {
      const inv = normalize(rawInvoice);
      const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
      const buffers = [];

      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      drawPage(doc, inv, companyConfig);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ── Page drawing ──────────────────────────────────────────────────
const drawPage = (doc, inv, companyConfig) => {
  const W = 595; // A4 width

  // ── Purple header bar ──────────────────────────────────────────────
  doc.rect(0, 0, W, 10).fill(PURPLE);

  // ── Company block (left) ────────────────────────────────────────
  doc.fillColor(PURPLE).fontSize(15).font('Helvetica-Bold')
     .text(companyConfig.name, 40, 20, { width: 280 });
  doc.fillColor(GREY).fontSize(8).font('Helvetica')
     .text(companyConfig.tradeName, 40, 42)
     .text(companyConfig.address,   40, 53)
     .text(companyConfig.address2,  40, 63)
     .text(`Phone: ${companyConfig.phone}`, 40, 73)
     .text(`Email: ${companyConfig.email}`,  40, 83);

  // ── INVOICE title + meta (right) ────────────────────────────────
  doc.fillColor(PURPLE).fontSize(26).font('Helvetica-Bold')
     .text('INVOICE', 360, 18, { width: 195, align: 'right' });

  const metaY = 50;
  const metaRows = [
    ['Invoice No:', inv.invoiceNumber],
    ['Order No:',   inv.orderNumber],
    ['Date:',       fmtDate(inv.invoiceDate)],
  ];
  metaRows.forEach(([label, val], i) => {
    const y = metaY + i * 14;
    doc.fillColor(GREY).fontSize(8).font('Helvetica')
       .text(label, 360, y, { width: 90, align: 'right' });
    doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold')
       .text(val || '-', 455, y, { width: 100, align: 'right' });
  });

  // ── Divider ─────────────────────────────────────────────────────
  doc.rect(40, 100, W - 80, 1).fill(PURPLE);

  // ── BILL TO ─────────────────────────────────────────────────────
  const billY = 110;
  doc.fillColor(PURPLE).fontSize(7.5).font('Helvetica-Bold')
     .text('BILL TO', 40, billY);
  doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold')
     .text(inv.customerName, 40, billY + 11);
  doc.fillColor(GREY).fontSize(8.5).font('Helvetica')
     .text(inv.customerPhone, 40, billY + 25);
  if (inv.addressParts.length > 0) {
    doc.fillColor(GREY).fontSize(8).font('Helvetica')
       .text(inv.addressParts.join(', '), 40, billY + 37, { width: 260 });
  }

  // ── Items Table ─────────────────────────────────────────────────
  const tableTop = 185;
  const cols = [
    { label: '#',        width: 28,  align: 'center' },
    { label: 'Product',  width: 198, align: 'left'   },
    { label: 'Qty',      width: 38,  align: 'center' },
    { label: 'MRP',      width: 68,  align: 'right'  },
    { label: 'Price',    width: 68,  align: 'right'  },
    { label: 'Discount', width: 55,  align: 'right'  },
    { label: 'Amount',   width: 100, align: 'right'  },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0); // 555

  // Header row
  doc.rect(40, tableTop, tableW, 22).fill(PURPLE);
  let cx = 40;
  cols.forEach(col => {
    doc.fillColor(WHITE).fontSize(8.5).font('Helvetica-Bold')
       .text(col.label, cx + 4, tableTop + 7, { width: col.width - 8, align: col.align });
    cx += col.width;
  });

  // Item rows
  let rowY = tableTop + 22;
  const items = inv.items;
  items.forEach((item, idx) => {
    const rowH = 26;
    // Alternating fill
    if (idx % 2 === 1) doc.rect(40, rowY, tableW, rowH).fill('#FEF2F2');

    const discAmt = Math.max(0, item.mrp - item.price) * item.quantity;
    const rowData = [
      String(idx + 1),
      item.name + (item.variantName ? ` - ${item.variantName}` : '') + (item.selectedModel ? ` [Model: ${item.selectedModel}]` : '') + (item.lotType && item.lotType !== 'none' ? ` [Lot: ${item.lotType}]` : ''),
      String(item.quantity),
      fmt(item.mrp),
      fmt(item.price),
      discAmt > 0 ? fmt(discAmt) : '-',
      fmt(item.total),
    ];

    cx = 40;
    doc.fillColor(DARK).fontSize(8).font('Helvetica');
    rowData.forEach((val, ci) => {
      doc.text(val, cx + 4, rowY + 9, { width: cols[ci].width - 8, align: cols[ci].align });
      cx += cols[ci].width;
    });

    // Bottom border
    doc.rect(40, rowY + rowH - 0.5, tableW, 0.5).fill(BORDER);
    rowY += rowH;

    // Page break if needed
    if (rowY > 700) {
      doc.addPage({ size: 'A4', margin: 0 });
      doc.rect(0, 0, W, 10).fill(PURPLE);
      rowY = 20;
    }
  });

  // ── Financial Summary ────────────────────────────────────────────
  const sumX    = 355; // right-side summary box starts here
  const sumW    = 200; // width of summary area
  let   sumY    = Math.max(rowY + 15, 520);

  const sumRows = [];
  sumRows.push({ label: 'Sub Total',  val: fmt(inv.grandTotal)  });
  if (inv.shipping > 0)       sumRows.push({ label: 'Delivery Charge', val: `+ ${fmt(inv.shipping)}` });
  if (inv.discount > 0)       sumRows.push({ label: 'Discount',        val: `- ${fmt(inv.discount)}` });
  if (inv.tokenReceived > 0)  sumRows.push({ label: 'Advance (Token)', val: `- ${fmt(inv.tokenReceived)}`, green: true });
  const roundOff = inv.roundedBalance - inv.balance;
  if (Math.abs(roundOff) > 0.005) sumRows.push({ label: 'Round Off', val: roundOff > 0 ? `+ ${fmt(roundOff)}` : `- ${fmt(Math.abs(roundOff))}` });

  sumRows.forEach(row => {
    doc.rect(sumX, sumY, sumW, 20).stroke(BORDER);
    doc.fillColor(row.green ? '#059669' : GREY).fontSize(8).font('Helvetica')
       .text(row.label, sumX + 5, sumY + 6, { width: 100 });
    doc.fillColor(row.green ? '#059669' : DARK).font('Helvetica-Bold')
       .text(row.val, sumX + 100, sumY + 6, { width: sumW - 110, align: 'right' });
    sumY += 20;
  });

  // Balance due — big red row
  doc.rect(sumX, sumY, sumW, 26).fill(PURPLE);
  doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold')
     .text('Balance Due', sumX + 5, sumY + 8, { width: 90 });
  doc.text(fmt(inv.roundedBalance), sumX + 100, sumY + 8, { width: sumW - 110, align: 'right' });
  sumY += 26;

  // Left notes
  const noteY = Math.max(rowY + 15, 520);
  const paidAmt = Number(inv.payment?.amountPaid || 0);

  doc.fillColor(GREY).fontSize(8).font('Helvetica')
     .text(`Total Qty: ${items.reduce((s, i) => s + i.quantity, 0)} pcs`, 40, noteY);
  if (inv.tokenReceived > 0) {
    doc.fillColor('#059669').font('Helvetica-Bold')
       .text(`Advance Paid: ${fmt(inv.tokenReceived)}`, 40, noteY + 14);
  }
  if (paidAmt > 0) {
    doc.fillColor(GREY).font('Helvetica')
       .text(`Online Payment: ${fmt(paidAmt)}`, 40, noteY + 28);
  }

  // Payment status chip
  let chipColor = PURPLE;
  let chipLabel = 'UNPAID';
  if (inv.roundedBalance === 0) { chipColor = '#059669'; chipLabel = 'PAID'; }
  else if (inv.tokenReceived > 0) { chipColor = '#D97706'; chipLabel = 'PART PAID'; }

  doc.rect(40, noteY + 45, 70, 18).fill(chipColor);
  doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold')
     .text(chipLabel, 40, noteY + 50, { width: 70, align: 'center' });

  // ── Footer ────────────────────────────────────────────────────────
  const footerY = 800;
  doc.rect(0, footerY, W, 1).fill(BORDER);
  doc.fillColor(GREY).fontSize(7.5).font('Helvetica')
     .text('Thank you for your business!', 40, footerY + 6, { width: W - 80, align: 'center' });
  doc.text(companyConfig.name + ' | ' + companyConfig.phone, 40, footerY + 16, { width: W - 80, align: 'center' });
};

module.exports = { generateInvoicePDF };