/**
 * Razorpay Payment Service
 *
 * Handles Razorpay payment gateway integration for Android
 * Uses react-native-razorpay library
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const RazorpayCheckout = require('react-native-razorpay').default ?? require('react-native-razorpay');
let Config: any = {};
try {
  Config = require('react-native-config').default || require('react-native-config');
} catch (e) {
  console.log('Razorpay: Config not available');
}
import { Alert } from 'react-native';

export interface RazorpayOptions {
  key?: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email?: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayErrorResponse {
  code: number;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id: string;
    payment_id: string;
  };
}

class RazorpayService {
  private keyId: string;

  constructor() {
    this.keyId = Config.RAZORPAY_KEY_ID || '';
    
    if (!this.keyId) {
      console.warn('⚠️ Razorpay Key ID not configured in ENV. Will rely on backend key.');
    }
  }

  /**
   * Open Razorpay checkout
   * 
   * @param options Payment options
   * @returns Promise with payment response
   */
  async openCheckout(
    options: RazorpayOptions
  ): Promise<{ success: true; data: RazorpaySuccessResponse } | { success: false; error: RazorpayErrorResponse }> {
    try {
      const activeKey = options.key || this.keyId;
      if (!activeKey) {
        throw new Error('Razorpay Key ID not configured');
      }

      const razorpayOptions = {
        key: activeKey,
        order_id: options.orderId,
        amount: Math.round(options.amount * 100), // Convert to paise
        currency: options.currency,
        name: options.name,
        description: options.description,
        prefill: options.prefill,
        theme: options.theme,
      };

      const data = await RazorpayCheckout.open(razorpayOptions);

      return {
        success: true,
        data: {
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_signature: data.razorpay_signature,
        },
      };
    } catch (error: any) {
      console.error('Razorpay Checkout Error:', error);

      // Razorpay specific error
      if (error.code) {
        return {
          success: false,
          error: {
            code: error.code,
            description: error.description || 'Payment failed',
            source: error.source || 'unknown',
            step: error.step || 'unknown',
            reason: error.reason || 'unknown',
            metadata: error.metadata || { order_id: '', payment_id: '' },
          },
        };
      }

      // Generic error
      return {
        success: false,
        error: {
          code: 0,
          description: error.message || 'Payment failed',
          source: 'app',
          step: 'checkout',
          reason: 'unknown',
          metadata: error.metadata || { order_id: '', payment_id: '' },
        },
      };
    }
  }

  /**
   * Show payment error alert
   * 
   * @param error Error response
   */
  showPaymentError(error: RazorpayErrorResponse): void {
    let message = error.description;

    // Add more context based on error step
    if (error.step === 'payment_authentication') {
      message = 'Payment authentication failed. Please try again.';
    } else if (error.step === 'payment_capture') {
      message = 'Payment capture failed. Please contact support.';
    }

    Alert.alert('Payment Failed', message, [{ text: 'OK' }]);
  }

  /**
   * Get formatted payment amount
   * 
   * @param amount Amount in rupees
   * @returns Formatted string
   */
  formatAmount(amount: number): string {
    return `₹${amount.toFixed(2)}`;
  }

  /**
   * Validate payment response
   * 
   * @param response Payment response
   * @returns Is valid
   */
  isValidResponse(response: any): response is RazorpaySuccessResponse {
    return !!(
      response &&
      response.razorpay_payment_id &&
      response.razorpay_order_id &&
      response.razorpay_signature
    );
  }
}

export default new RazorpayService();
