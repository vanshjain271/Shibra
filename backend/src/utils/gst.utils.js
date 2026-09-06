/**
 * GST Utility - MVP
 * 
 * Handles GST calculations for invoicing
 * - Intra-state: CGST + SGST (split 50-50)
 * - Inter-state: IGST (full rate)
 */

// Default GST rate (18%)
const DEFAULT_GST_RATE = 18;

// Seller's state (configure based on business location)
const SELLER_STATE = 'Gujarat';

/**
 * Determine if transaction is intra-state or inter-state
 */
const isIntraState = (buyerState, sellerState = SELLER_STATE) => {
  if (!buyerState || !sellerState) return false;
  return buyerState.toLowerCase().trim() === sellerState.toLowerCase().trim();
};

/**
 * Calculate GST breakdown for an amount
 */
const calculateGST = (taxableAmount, gstRate = DEFAULT_GST_RATE, buyerState, sellerState = SELLER_STATE) => {
  const intraState = isIntraState(buyerState, sellerState);
  const taxAmount = (taxableAmount * gstRate) / 100;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (intraState) {
    cgst = taxAmount / 2;
    sgst = taxAmount / 2;
  } else {
    igst = taxAmount;
  }

  return {
    taxableAmount: round(taxableAmount),
    gstRate,
    cgst: round(cgst),
    cgstRate: intraState ? gstRate / 2 : 0,
    sgst: round(sgst),
    sgstRate: intraState ? gstRate / 2 : 0,
    igst: round(igst),
    igstRate: intraState ? 0 : gstRate,
    totalTax: round(taxAmount),
    totalWithTax: round(taxableAmount + taxAmount),
    isIntraState: intraState
  };
};

/**
 * Calculate GST for order items
 */
const calculateOrderGST = (items, buyerState) => {
  const intraState = isIntraState(buyerState);
  
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const itemsWithGST = items.map(item => {
    const taxableAmount = item.price * item.quantity;
    const gstRate = item.taxRate || DEFAULT_GST_RATE;
    const gst = calculateGST(taxableAmount, gstRate, buyerState);

    subtotal += taxableAmount;
    totalCgst += gst.cgst;
    totalSgst += gst.sgst;
    totalIgst += gst.igst;

    return {
      ...item,
      taxableAmount: gst.taxableAmount,
      gstRate,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      totalTax: gst.totalTax,
      totalWithTax: gst.totalWithTax
    };
  });

  const totalTax = totalCgst + totalSgst + totalIgst;
  const grandTotal = subtotal + totalTax;

  return {
    items: itemsWithGST,
    subtotal: round(subtotal),
    totalCgst: round(totalCgst),
    totalSgst: round(totalSgst),
    totalIgst: round(totalIgst),
    totalTax: round(totalTax),
    grandTotal: round(grandTotal),
    isIntraState: intraState
  };
};

/**
 * Round to 2 decimal places
 */
const round = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Convert number to words (Indian numbering system)
 */
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  const convertToIndian = (n) => {
    if (n === 0) return '';
    
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const remainder = n;

    let result = '';
    if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return result.trim();
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let words = 'Rupees ' + convertToIndian(rupees);
  if (paise > 0) {
    words += ' and ' + convertToIndian(paise) + ' Paise';
  }
  words += ' Only';

  return words;
};

module.exports = {
  DEFAULT_GST_RATE,
  SELLER_STATE,
  isIntraState,
  calculateGST,
  calculateOrderGST,
  numberToWords,
  round
};