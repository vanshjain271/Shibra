/**
 * WhatsApp Utils - MVP
 * 
 * Generate WhatsApp deep links for customer contact
 * Uses whatsapp:// protocol for app and wa.me for web
 */

/**
 * Generate WhatsApp link for product inquiry
 * 
 * @param {string} phone - Seller's WhatsApp number
 * @param {Object} product - Product details
 * @returns {string} WhatsApp deep link
 */
function generateProductInquiryLink(phone, product) {
  const cleanPhone = cleanPhoneNumber(phone);
  
  let message = `Hi! I'm interested in the following product:

*${product.name}*`;

  if (product.variantName) {
    message += `
Variant: ${product.variantName}`;
  }

  if (product.sku) {
    message += `
SKU: ${product.sku}`;
  }

  message += `
Price: ₹${product.price}

Could you please provide more details?`;

  return generateWhatsAppLink(cleanPhone, message);
}

/**
 * Generate WhatsApp link for order inquiry
 * 
 * @param {string} phone - Seller's WhatsApp number
 * @param {Object} order - Order details
 * @returns {string} WhatsApp deep link
 */
function generateOrderInquiryLink(phone, order) {
  const cleanPhone = cleanPhoneNumber(phone);
  
  const message = `Hi! I have a question about my order:

*Order Number:* ${order.orderNumber}
*Order Date:* ${formatDate(order.createdAt)}
*Status:* ${order.status}

Please assist me with this order.`;

  return generateWhatsAppLink(cleanPhone, message);
}

/**
 * Generate WhatsApp link for general inquiry
 * 
 * @param {string} phone - Seller's WhatsApp number
 * @param {string} customMessage - Custom message (optional)
 * @returns {string} WhatsApp deep link
 */
function generateGeneralInquiryLink(phone, customMessage = null) {
  const cleanPhone = cleanPhoneNumber(phone);
  
  const message = customMessage || `Hi! I would like to inquire about your products.`;

  return generateWhatsAppLink(cleanPhone, message);
}

/**
 * Generate base WhatsApp link
 * 
 * @param {string} phone - Phone number with country code
 * @param {string} message - Pre-filled message
 * @returns {string} WhatsApp link
 */
function generateWhatsAppLink(phone, message) {
  const encodedMessage = encodeURIComponent(message);
  
  // Use wa.me for universal compatibility
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}

/**
 * Clean phone number (remove spaces, dashes, etc.)
 * Add country code if missing
 * 
 * @param {string} phone - Phone number
 * @returns {string} Cleaned phone number with country code
 */
function cleanPhoneNumber(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add India country code (91) if missing
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return cleaned;
}

/**
 * Format date for WhatsApp message
 * 
 * @param {Date|string} date
 * @returns {string} Formatted date
 */
function formatDate(date) {
  if (!date) return 'N/A';
  
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Validate WhatsApp number format
 * 
 * @param {string} phone - Phone number
 * @returns {boolean} Is valid
 */
function isValidWhatsAppNumber(phone) {
  const cleaned = cleanPhoneNumber(phone);
  
  // Check if it's a valid length (10-15 digits with country code)
  return cleaned.length >= 10 && cleaned.length <= 15;
}

module.exports = {
  generateProductInquiryLink,
  generateOrderInquiryLink,
  generateGeneralInquiryLink,
  generateWhatsAppLink,
  cleanPhoneNumber,
  isValidWhatsAppNumber
};