/**
 * Coupon Service
 * 
 * Handles coupon validation and fetching active coupons
 */

import { apiClient } from './api.service';
import { Coupon } from '../types/api.types';

class CouponService {
  /**
   * Get active coupons for the user
   */
  async getActiveCoupons(): Promise<Coupon[]> {
    const response = await apiClient.get<any>('/coupons');
    return response.coupons ?? response.data?.coupons ?? response.data ?? [];
  }

  /**
   * Validate a coupon code for the current cart
   */
  async validateCoupon(code: string, cartTotal: number, cartItems: any[] = []): Promise<Coupon> {
    const response = await apiClient.post<any>('/coupons/validate', {
      code,
      cartTotal: cartTotal,
      cartItems: cartItems,
    });
    return response.coupon ?? response.data?.coupon ?? response.data;
  }
}

export const couponService = new CouponService();
