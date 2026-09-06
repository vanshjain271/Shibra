/**
 * Order Service
 * Fixed:
 * - CreateOrderPayload: paymentMode was 'FULL_PAYMENT' | 'COD_PARTIAL'
 *   but CheckoutScreen uses 'PREPAID' | 'COD' — aligned to app usage
 * - shippingAddress in CreateOrderPayload: CheckoutScreen passes selectedAddress._id (string)
 *   not a full Address object — fixed to string
 * - verifyPayment: aligned VerifyPaymentPayload field names to match
 *   what CheckoutScreen sends (razorpayOrderId etc.)
 * - getMyOrders: response normalised for both wrapped and unwrapped shapes
 */

import { apiClient } from './api.service';
import { Order, Invoice, ApiResponse } from '../types/api.types';

export interface CreateOrderPayload {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  shippingAddress: string; // FIX: CheckoutScreen passes address._id string
  paymentMode: 'PREPAID' | 'COD' | 'UPI_QR' | 'COD_PARTIAL';
  couponCode?: string;
}

export interface InitiatePaymentResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  order: Order;
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaginatedOrdersResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasMore: boolean;
    hasPrev: boolean;
  };
}

class OrderService {
  /**
   * Create order with stock reservation
   */
  async createOrder(payload: CreateOrderPayload): Promise<{ order: Order; amountToPay: number }> {
    const response = await apiClient.post<any>('/orders', payload);
    // Handle both wrapped {data:{order}} and unwrapped {order} shapes
    return {
      order: response.order ?? response.data?.order,
      amountToPay: response.amountToPay ?? response.data?.amountToPay ?? 0,
    };
  }

  /**
   * Initiate Razorpay payment
   */
  async initiatePayment(orderId: string): Promise<InitiatePaymentResponse> {
    const response = await apiClient.post<any>(`/orders/${orderId}/initiate-payment`);
    return (response.data ?? response) as InitiatePaymentResponse;
  }

  /**
   * Verify Razorpay payment
   */
  async verifyPayment(
    orderId: string,
    payload: VerifyPaymentPayload
  ): Promise<{ order: Order; invoice: Invoice }> {
    const response = await apiClient.post<any>(
      `/orders/${orderId}/verify-payment`,
      payload
    );
    return {
      order: response.order ?? response.data?.order,
      invoice: response.invoice ?? response.data?.invoice,
    };
  }

  /**
   * Handle payment failure
   */
  async paymentFailed(orderId: string, reason: string): Promise<Order> {
    const response = await apiClient.post<any>(
      `/orders/${orderId}/payment-failed`,
      { reason }
    );
    return response.order ?? response.data?.order;
  }

  /**
   * Get my orders
   */
  async getMyOrders(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<PaginatedOrdersResponse> {
    const params: any = { page, limit };
    if (status) params.status = status;

    const response = await apiClient.get<any>('/orders/my', { params });

    // Normalise response shape
    const orders = response.orders ?? response.data?.orders ?? [];
    const pag = response.pagination ?? response.data?.pagination ?? {};

    return {
      success: true,
      orders,
      pagination: {
        page: pag.page ?? page,
        limit: pag.limit ?? limit,
        total: pag.total ?? 0,
        pages: pag.pages ?? 1,
        hasNext: pag.hasNext ?? false,
        hasMore: pag.hasNext ?? pag.hasMore ?? false,
        hasPrev: pag.hasPrev ?? false,
      },
    };
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    const response = await apiClient.get<any>(`/orders/${orderId}`);
    return response.order ?? response.data?.order ?? response;
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    const response = await apiClient.post<any>(`/orders/${orderId}/cancel`, { reason });
    return response.order ?? response.data?.order;
  }

  /**
   * Get invoice for order
   */
  async getInvoice(orderId: string): Promise<Invoice> {
    const response = await apiClient.get<any>(`/invoices/order/${orderId}`);
    return response.invoice ?? response.data?.invoice ?? response;
  }
}

export const orderService = new OrderService();