/**
 * SMS Service - MVP
 * 
 * Handles OTP delivery via Twilio or MSG91
 * Service-first architecture: all SMS logic here
 */

const axios = require('axios');

class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'msg91';
  }

  /**
   * Generate OTP
   * @returns {string} 6-digit OTP
   */
  generateOTP() {
    const length = parseInt(process.env.OTP_LENGTH) || 6;
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * Send OTP via configured provider
   */
  async sendOTP(phone, otp) {
    const formattedPhone = this._formatPhone(phone);
    const message = `Your Shibra verification code is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;

    try {
      if (this.provider === 'msg91') {
        return await this._sendViaMSG91(phone, otp);
      } else if (this.provider === 'twilio') {
        return await this._sendViaTwilio(formattedPhone, message);
      } else {
        return this._devFallback(phone, otp);
      }
    } catch (error) {
      console.error('SMS Service Error:', error.message);
      if (process.env.NODE_ENV === 'development') {
        return this._devFallback(phone, otp);
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Send via Twilio
   * @private
   */
  async _sendViaTwilio(phone, message) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured');
    }

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({ To: phone, From: fromNumber, Body: message }),
      { auth: { username: accountSid, password: authToken } }
    );

    return { success: true, messageId: response.data.sid };
  }

  /**
   * Send OTP via MSG91
   * @private
   */
  async _sendViaMSG91(phone, otp) {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_OTP_TEMPLATE_ID;

    if (!authKey || !templateId) {
      if (process.env.NODE_ENV === 'development') return this._devFallback(phone, otp);
      throw new Error('MSG91 credentials not configured');
    }

    const response = await axios.post(
      'https://api.msg91.com/api/v5/otp',
      { template_id: templateId, mobile: `91${phone}`, otp: otp },
      { headers: { 'authkey': authKey, 'Content-Type': 'application/json' } }
    );

    return { success: response.data.type === 'success', messageId: response.data.request_id };
  }

  /**
   * Send a generic SMS message
   */
  async sendMessage(phone, message, templateId = null) {
    const formattedPhone = this._formatPhone(phone);
    try {
      if (this.provider === 'msg91') {
        const authKey = process.env.MSG91_AUTH_KEY;
        const senderId = process.env.MSG91_SENDER_ID || 'SHIBRAA'; // Default DLT Sender ID
        
        if (!authKey || !templateId) {
          console.log(`[MSG91 Simulation] SMS To ${phone}: ${message}`);
          return { success: true, messageId: 'simulated' };
        }

        // Send via MSG91 Flow/SMS API
        const response = await axios.post(
          'https://api.msg91.com/api/v5/flow/',
          {
            template_id: templateId,
            sender: senderId,
            mobiles: `91${phone}`,
            // Variables would be passed dynamically based on template, assuming generic fallback for now
            VAR1: message
          },
          { headers: { 'authkey': authKey, 'Content-Type': 'application/json' } }
        );
        return { success: true, messageId: response.data.message };
      } else if (this.provider === 'twilio') {
        return await this._sendViaTwilio(formattedPhone, message);
      }
    } catch (error) {
      console.error('Send SMS Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a WhatsApp message
   */
  async sendWhatsAppMessage(phone, message, templateId = null) {
    const formattedPhone = this._formatPhone(phone);
    
    try {
      if (this.provider === 'msg91') {
        const authKey = process.env.MSG91_AUTH_KEY;
        const integratedNumber = process.env.MSG91_WHATSAPP_NUMBER;
        
        if (!authKey || !integratedNumber) {
          console.log(`[MSG91 Simulation] WhatsApp To ${phone}: ${message}`);
          return { success: true, messageId: 'simulated' };
        }

        const response = await axios.post(
          'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
          {
            integrated_number: integratedNumber,
            content_type: "template",
            payload: {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: `91${phone}`,
              type: "template",
              template: {
                name: templateId || "shibra_generic_update",
                language: { code: "en" },
                components: [
                  { type: "body", parameters: [{ type: "text", text: message }] }
                ]
              }
            }
          },
          { headers: { 'authkey': authKey, 'Content-Type': 'application/json' } }
        );
        return { success: true, messageId: 'msg91-wa-sent' };
        
      } else if (this.provider === 'twilio') {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
        if (!accountSid || !authToken) {
          console.log(`[Twilio Simulation] WhatsApp To ${phone}: ${message}`);
          return { success: true, messageId: 'simulated' };
        }
        const response = await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          new URLSearchParams({ To: `whatsapp:${formattedPhone}`, From: fromWhatsApp, Body: message }),
          { auth: { username: accountSid, password: authToken } }
        );
        return { success: true, messageId: response.data.sid };
      }
    } catch (error) {
      console.error('WhatsApp Error:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send Order Status Update
   */
  async sendOrderStatusUpdate(phone, orderNumber, status) {
    let message = '';
    const storeName = 'Shibra';
    
    // In a real MSG91 scenario, you map these statuses to DLT Template IDs.
    // E.g. const templateId = process.env[`MSG91_TEMPLATE_${status.toUpperCase()}`]
    const templateId = process.env.MSG91_ORDER_UPDATE_TEMPLATE_ID; 

    switch (status.toUpperCase()) {
      case 'CONFIRMED': message = `Hello! Your ${storeName} order #${orderNumber} has been CONFIRMED. We are preparing it for you!`; break;
      case 'PACKED': message = `Good news! Your ${storeName} order #${orderNumber} is PACKED and ready for pickup.`; break;
      case 'SHIPPED': message = `On the way! Your ${storeName} order #${orderNumber} has been SHIPPED. Track it in the app.`; break;
      case 'DELIVERED': message = `Delivered! Your ${storeName} order #${orderNumber} has been successfully delivered. Thank you for shopping with us!`; break;
      case 'CANCELLED': message = `Notice: Your ${storeName} order #${orderNumber} has been cancelled. Contact support for any queries.`; break;
      default: message = `Update: Your ${storeName} order #${orderNumber} status changed to ${status.toLowerCase()}.`;
    }

    await this.sendMessage(phone, message, templateId);
    await this.sendWhatsAppMessage(phone, message, process.env.MSG91_WA_ORDER_UPDATE_TEMPLATE);
  }

  /**
   * Development fallback - logs OTP to console
   * @private
   */
  _devFallback(phone, otp) {
    console.log('========================================');
    console.log(`[DEV MSG91 MODE] OTP for ${phone}: ${otp}`);
    console.log('========================================');
    return { success: true, messageId: 'dev-mode', devOtp: process.env.NODE_ENV === 'development' ? otp : undefined };
  }

  /**
   * Format phone number to E.164 for Twilio
   * @private
   */
  _formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
    return phone;
  }
}

module.exports = new SMSService();
