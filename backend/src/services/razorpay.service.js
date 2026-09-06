/**
 * Razorpay Service - MVP
 * 
 * Handles Razorpay payment gateway integration
 * - Order creation
 * - Payment verification
 * - Signature validation
 */

const crypto = require('crypto');
const axios = require('axios');

class RazorpayService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET;
    this.baseUrl = 'https://api.razorpay.com/v1';
    
    if (!this.keyId || !this.keySecret) {
      console.warn('⚠️ Razorpay credentials not configured');
    }
  }

  /**
   * Create Razorpay order
   * Called when user clicks "Pay Now"
   * 
   * @param {Object} orderData - { amount, currency, receipt, notes }
   * @returns {Promise<Object>} { success, razorpayOrderId?, error? }
   */
  async createOrder(orderData) {
    try {
      if (!this.keyId || !this.keySecret) {
        throw new Error('Razorpay credentials not configured');
      }

      const { amount, currency = 'INR', receipt, notes = {} } = orderData;

      if (!amount || amount <= 0) {
        return {
          success: false,
          error: 'Invalid amount'
        };
      }

      if (!receipt) {
        return {
          success: false,
          error: 'Receipt/Order ID is required'
        };
      }

      // Amount should be in paise (multiply by 100)
      const amountInPaise = Math.round(amount * 100);

      const response = await axios.post(
        `${this.baseUrl}/orders`,
        {
          amount: amountInPaise,
          currency,
          receipt,
          notes
        },
        {
          auth: {
            username: this.keyId,
            password: this.keySecret
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        razorpayOrderId: response.data.id,
        amount: response.data.amount,
        currency: response.data.currency,
        receipt: response.data.receipt
      };
    } catch (error) {
      console.error('Razorpay Create Order Error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.description || error.message
      };
    }
  }

  /**
   * Verify Razorpay payment signature
   * Critical security check - must be done on backend
   * 
   * @param {Object} paymentData - { razorpayOrderId, razorpayPaymentId, razorpaySignature }
   * @returns {Object} { valid: boolean, error? }
   */
  verifyPaymentSignature(paymentData) {
    try {
      if (!this.keySecret) {
        throw new Error('Razorpay key secret not configured');
      }

      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = paymentData;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return {
          valid: false,
          error: 'Missing payment verification data'
        };
      }

      // Generate expected signature
      const text = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(text)
        .digest('hex');

      // Compare signatures (timing-safe comparison)
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpaySignature)
      );

      if (!isValid) {
        return {
          valid: false,
          error: 'Invalid payment signature'
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Razorpay Signature Verification Error:', error.message);
      
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch payment details from Razorpay
   * 
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} { success, payment?, error? }
   */
  async fetchPayment(paymentId) {
    try {
      if (!this.keyId || !this.keySecret) {
        throw new Error('Razorpay credentials not configured');
      }

      const response = await axios.get(
        `${this.baseUrl}/payments/${paymentId}`,
        {
          auth: {
            username: this.keyId,
            password: this.keySecret
          }
        }
      );

      return {
        success: true,
        payment: response.data
      };
    } catch (error) {
      console.error('Razorpay Fetch Payment Error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.description || error.message
      };
    }
  }

  /**
   * Create refund
   * 
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} amount - Amount to refund (in rupees)
   * @param {Object} notes - Refund notes
   * @returns {Promise<Object>} { success, refund?, error? }
   */
  async createRefund(paymentId, amount = null, notes = {}) {
    try {
      if (!this.keyId || !this.keySecret) {
        throw new Error('Razorpay credentials not configured');
      }

      const data = { notes };
      
      // If amount specified, it's a partial refund
      if (amount) {
        data.amount = Math.round(amount * 100); // Convert to paise
      }

      const response = await axios.post(
        `${this.baseUrl}/payments/${paymentId}/refund`,
        data,
        {
          auth: {
            username: this.keyId,
            password: this.keySecret
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        refund: response.data
      };
    } catch (error) {
      console.error('Razorpay Create Refund Error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.description || error.message
      };
    }
  }

  /**
   * Get Razorpay key ID for frontend SDK
   * 
   * @returns {string} Key ID
   */
  getKeyId() {
    return this.keyId;
  }

  /**
   * Verify Razorpay Webhook Signature
   * 
   * @param {string} rawBody - Raw request body
   * @param {string} signature - Signature from headers (x-razorpay-signature)
   * @param {string} webhookSecret - Secret configured in Razorpay dashboard
   * @returns {boolean} Is valid
   */
  verifyWebhookSignature(rawBody, signature, webhookSecret) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');
        
      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook Signature Verification Error:', error);
      return false;
    }
  }
}

module.exports = new RazorpayService();