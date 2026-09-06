/**
 * WhatsApp Notification Service
 * Mock implementation for sending WhatsApp messages to customers
 * Can be replaced with actual Twilio, Interakt, or Wati API calls
 */

class WhatsAppService {
  /**
   * Send Order Status Update via WhatsApp
   * @param {string} phone - Customer's 10-digit phone number
   * @param {Object} order - Order details
   */
  async sendOrderStatusUpdate(phone, order) {
    const statusMessages = {
      CONFIRMED: `🎉 Great news! Your Shibra order #${order._id.toString().slice(-6).toUpperCase()} has been confirmed. We'll notify you once it's packed.`,
      PACKED: `📦 Your Shibra order #${order._id.toString().slice(-6).toUpperCase()} is packed and ready to be shipped!`,
      SHIPPED: `🚚 Good news! Your Shibra order #${order._id.toString().slice(-6).toUpperCase()} has been shipped.`,
      DELIVERED: `✅ Your Shibra order #${order._id.toString().slice(-6).toUpperCase()} has been successfully delivered. Thank you for shopping with us!`,
      CANCELLED: `❌ Your Shibra order #${order._id.toString().slice(-6).toUpperCase()} has been cancelled.`
    };

    const message = statusMessages[order.status];
    if (!message) return;

    try {
      // TODO: Replace with actual WhatsApp API Integration (e.g. Twilio, Interakt)
      console.log(`\n==========================================`);
      console.log(`🟢 [MOCK WHATSAPP] Sent to +91${phone}:`);
      console.log(`${message}`);
      console.log(`==========================================\n`);
      
      return { success: true, message: 'WhatsApp message sent (Mock)' };
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return { success: false, message: 'Failed to send WhatsApp message' };
    }
  }
}

module.exports = new WhatsAppService();
