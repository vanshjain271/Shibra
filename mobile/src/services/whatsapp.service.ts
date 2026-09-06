/**
 * WhatsApp Service
 * 
 * Handles WhatsApp deep linking for product inquiries
 * Opens WhatsApp with prefilled message
 */

import { Linking, Alert } from 'react-native';
import { Product, OrderDetail } from '../types/api.types';

class WhatsAppService {
  private sellerPhone: string = '919328492451'; // Official Shibra Support

  /**
   * Set seller WhatsApp number
   */
  setSellerPhone(phone: string): void {
    this.sellerPhone = this.cleanPhoneNumber(phone);
  }

  /**
   * Open WhatsApp for product inquiry
   * 
   * @param product Product details
   */
  async openProductInquiry(product: Product): Promise<void> {
    const message = this.generateProductInquiryMessage(product);
    await this.openWhatsApp(message);
  }

  /**
   * Open WhatsApp for order inquiry
   * 
   * @param order Order details
   */
  async openOrderInquiry(order: OrderDetail): Promise<void> {
    const message = this.generateOrderInquiryMessage(order);
    await this.openWhatsApp(message);
  }

  /**
   * Open WhatsApp for general inquiry
   * 
   * @param customMessage Optional custom message
   */
  async openGeneralInquiry(customMessage?: string): Promise<void> {
    const message = customMessage || 'Hi! I would like to inquire about your products.';
    await this.openWhatsApp(message);
  }

  /**
   * Open WhatsApp with message
   * 
   * @param message Message text
   */
  private async openWhatsApp(message: string): Promise<void> {
    try {
      const url = this.generateWhatsAppLink(message);

      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'WhatsApp Not Available',
          'WhatsApp is not installed on your device. Please install WhatsApp to contact the seller.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('WhatsApp Open Error:', error);
      Alert.alert(
        'Error',
        'Failed to open WhatsApp. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Generate WhatsApp deep link
   * 
   * @param message Message text
   * @returns WhatsApp URL
   */
  private generateWhatsAppLink(message: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${this.sellerPhone}?text=${encodedMessage}`;
  }

  /**
   * Generate product inquiry message
   */
  private generateProductInquiryMessage(product: Product): string {
    let message = `Hi! I'm interested in the following product:\n\n`;
    message += `*${product.name}*\n`;

    if (product.sku) {
      message += `SKU: ${product.sku}\n`;
    }

    message += `Price: ₹${product.salePrice}\n\n`;
    message += `Could you please provide more details?`;

    return message;
  }

  /**
   * Generate order inquiry message
   */
  private generateOrderInquiryMessage(order: OrderDetail): string {
    let message = `Hi! I have a question about my order:\n\n`;
    message += `*Order Number:* ${order.orderNumber}\n`;
    message += `*Order Date:* ${this.formatDate(order.createdAt)}\n`;
    message += `*Status:* ${this.formatOrderStatus(order.status)}\n\n`;
    message += `Please assist me with this order.`;

    return message;
  }

  /**
   * Clean phone number
   */
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Add India country code (91) if missing
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }

    return cleaned;
  }

  /**
   * Format date for message
   */
  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Format order status
   */
  private formatOrderStatus(status: string): string {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Check if WhatsApp is installed
   */
  async isWhatsAppInstalled(): Promise<boolean> {
    try {
      const url = 'whatsapp://send';
      return await Linking.canOpenURL(url);
    } catch {
      return false;
    }
  }
}

export default new WhatsAppService();
