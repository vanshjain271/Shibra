/**
 * Cart Service
 * Fixed:
 * - Response normalised: backend may return cart at top level or wrapped
 * - clearCart: was void but response may contain confirmation — kept void return
 */

import { apiClient } from './api.service';
import { Cart } from '../types/api.types';

export interface AddToCartPayload {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  itemId: string;
  quantity: number;
}

const extractCart = (response: any): Cart => {
  // FIX: handle both {cart: {...}} and {data: {cart: {...}}} and bare cart
  return response.cart ?? response.data?.cart ?? response.data ?? response;
};

class CartService {
  /**
   * Get user's cart
   */
  async getCart(): Promise<Cart> {
    const response = await apiClient.get<any>('/cart');
    return extractCart(response);
  }

  /**
   * Add item to cart
   */
  async addItem(payload: AddToCartPayload): Promise<Cart> {
    const response = await apiClient.post<any>('/cart/items', payload);
    return extractCart(response);
  }

  /**
   * Update cart item quantity
   */
  async updateItemQuantity(payload: UpdateCartItemPayload): Promise<Cart> {
    const { itemId, quantity } = payload;
    const response = await apiClient.put<any>(`/cart/items/${itemId}`, { quantity });
    return extractCart(response);
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string): Promise<Cart> {
    const response = await apiClient.delete<any>(`/cart/items/${itemId}`);
    return extractCart(response);
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<void> {
    await apiClient.delete('/cart');
  }
}

export const cartService = new CartService();