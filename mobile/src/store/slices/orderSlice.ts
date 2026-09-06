/**
 * Order Slice
 * Fixed:
 * - verifyPayment thunk: CheckoutScreen calls it with flat args
 *   {orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature}
 *   but thunk expected {orderId, payload:{...}} — unified signature
 * - fetchMyOrders: response shape normalised, added hasMore to pagination
 * - selectedOrder typed as Order (OrderDetail alias) not null cast
 * - isLoadingMore added for OrdersScreen
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Order, Invoice, OrderDetail } from '../../types/api.types';
import {
  orderService,
  CreateOrderPayload,
  InitiatePaymentResponse,
  VerifyPaymentPayload,
} from '../../services/order.service';

interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean; // FIX: OrdersScreen uses pagination.hasMore
}

interface OrderState {
  orders: Order[];
  selectedOrder: OrderDetail | null;
  isLoading: boolean;
  isLoadingMore: boolean; // FIX: OrdersScreen reads isLoadingMore
  error: string | null;
  pagination: OrderPagination | null;

  // Checkout flow state
  currentOrder: Order | null;
  paymentData: InitiatePaymentResponse | null;
  invoice: Invoice | null;
}

const initialState: OrderState = {
  orders: [],
  selectedOrder: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  pagination: null,
  currentOrder: null,
  paymentData: null,
  invoice: null,
};

/**
 * Create order
 */
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (payload: CreateOrderPayload, { rejectWithValue }) => {
    try {
      const result = await orderService.createOrder(payload);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create order');
    }
  }
);

/**
 * Initiate payment
 */
export const initiatePayment = createAsyncThunk(
  'orders/initiatePayment',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const result = await orderService.initiatePayment(orderId);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initiate payment');
    }
  }
);

/**
 * Verify payment
 * FIX: CheckoutScreen calls dispatch(verifyPayment({orderId, razorpayOrderId, ...}))
 * flattened — so we accept a flat object and split internally.
 */
export const verifyPayment = createAsyncThunk(
  'orders/verifyPayment',
  async (
    args: {
      orderId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { orderId, ...paymentPayload } = args;
      const result = await orderService.verifyPayment(orderId, paymentPayload);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Payment verification failed');
    }
  }
);

/**
 * Handle payment failure
 */
export const handlePaymentFailure = createAsyncThunk(
  'orders/handlePaymentFailure',
  async (
    { orderId, reason }: { orderId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      const order = await orderService.paymentFailed(orderId, reason);
      return order;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to handle payment failure');
    }
  }
);

/**
 * Fetch my orders
 */
export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMyOrders',
  async (
    {
      page = 1,
      limit = 20,
      status,
    }: { page?: number; limit?: number; status?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await orderService.getMyOrders(page, limit, status);
      return { response, page };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch orders');
    }
  }
);

/**
 * Fetch order by ID
 */
export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const order = await orderService.getOrderById(orderId);
      return order;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch order');
    }
  }
);

/**
 * Cancel order
 */
export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (
    { orderId, reason }: { orderId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      const order = await orderService.cancelOrder(orderId, reason);
      return order;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel order');
    }
  }
);

/**
 * Fetch invoice
 */
export const fetchInvoice = createAsyncThunk(
  'orders/fetchInvoice',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const invoice = await orderService.getInvoice(orderId);
      return invoice;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch invoice');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCheckoutState: (state) => {
      state.currentOrder = null;
      state.paymentData = null;
      state.invoice = null;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
  },
  extraReducers: (builder) => {
    // Create order
    builder.addCase(createOrder.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createOrder.fulfilled, (state, action) => {
      state.isLoading = false;
      // FIX: service returns {order, amountToPay}
      state.currentOrder = (action.payload as any).order ?? action.payload;
    });
    builder.addCase(createOrder.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Initiate payment
    builder.addCase(initiatePayment.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(initiatePayment.fulfilled, (state, action) => {
      state.isLoading = false;
      state.paymentData = action.payload;
    });
    builder.addCase(initiatePayment.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Verify payment
    builder.addCase(verifyPayment.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(verifyPayment.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentOrder = action.payload.order;
      state.invoice = action.payload.invoice ?? null;
    });
    builder.addCase(verifyPayment.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Handle payment failure
    builder.addCase(handlePaymentFailure.fulfilled, (state, action) => {
      state.currentOrder = action.payload;
    });

    // Fetch my orders
    builder.addCase(fetchMyOrders.pending, (state, action) => {
      const page = (action.meta.arg as any).page ?? 1;
      if (page === 1) {
        state.isLoading = true;
      } else {
        state.isLoadingMore = true; // FIX: subsequent pages use isLoadingMore
      }
      state.error = null;
    });
    builder.addCase(fetchMyOrders.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isLoadingMore = false;
      const { response, page } = action.payload as any;
      const orders = response.orders ?? response.data ?? [];
      const pag = response.pagination;

      if (page === 1) {
        state.orders = orders;
      } else {
        state.orders = [...state.orders, ...orders]; // FIX: append for loadMore
      }

      state.pagination = pag
        ? {
          page: pag.page,
          limit: pag.limit,
          total: pag.total,
          pages: pag.pages,
          hasMore: pag.hasNext ?? pag.hasMore ?? false,
        }
        : null;
    });
    builder.addCase(fetchMyOrders.rejected, (state, action) => {
      state.isLoading = false;
      state.isLoadingMore = false;
      state.error = action.payload as string;
    });

    // Fetch order by ID
    builder.addCase(fetchOrderById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchOrderById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedOrder = action.payload;
    });
    builder.addCase(fetchOrderById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Cancel order
    builder.addCase(cancelOrder.fulfilled, (state, action) => {
      const order = (action.payload as any).order || action.payload;
      state.selectedOrder = order;
      const index = state.orders.findIndex((o) => o._id === order._id);
      if (index !== -1) {
        state.orders[index] = order;
      }
    });

    // Fetch invoice
    builder.addCase(fetchInvoice.fulfilled, (state, action) => {
      state.invoice = action.payload;
    });
  },
});

export const { clearError, clearCheckoutState, clearSelectedOrder } =
  orderSlice.actions;

export default orderSlice.reducer;