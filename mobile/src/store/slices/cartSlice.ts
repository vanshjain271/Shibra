/**
 * Cart Slice
 * Redux state management for shopping cart
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Cart, Coupon } from '../../types/api.types';
import { cartService, AddToCartPayload, UpdateCartItemPayload } from '../../services/cart.service';
import { couponService } from '../../services/coupon.service';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  lastAddedItemId: string | null;
  appliedCoupon: Coupon | null;
  isValidatingCoupon: boolean;
}

const initialState: CartState = {
  cart: null,
  isLoading: false,
  error: null,
  lastAddedItemId: null,
  appliedCoupon: null,
  isValidatingCoupon: false,
};

/**
 * Fetch cart
 */
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const cart = await cartService.getCart();
      return cart;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch cart');
    }
  }
);

/**
 * Add item to cart
 */
export const addToCart = createAsyncThunk(
  'cart/addItem',
  async (payload: AddToCartPayload, { rejectWithValue }) => {
    try {
      const cart = await cartService.addItem(payload);
      return { cart, productId: payload.productId };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add item to cart');
    }
  }
);

/**
 * Update cart item quantity
 */
export const updateCartItem = createAsyncThunk(
  'cart/updateItem',
  async (payload: UpdateCartItemPayload, { rejectWithValue }) => {
    try {
      const cart = await cartService.updateItemQuantity(payload);
      return cart;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update cart item');
    }
  }
);

/**
 * Remove item from cart
 */
export const removeFromCart = createAsyncThunk(
  'cart/removeItem',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const cart = await cartService.removeItem(itemId);
      return cart;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove item from cart');
    }
  }
);

/**
 * Clear cart
 */
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await cartService.clearCart();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clear cart');
    }
  }
);

/**
 * Apply coupon
 */
export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async ({ code, total }: { code: string; total: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const items = state.cart.cart?.items || [];
      const coupon = await couponService.validateCoupon(code, total, items);
      return coupon;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Invalid coupon code');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLastAddedItem: (state) => {
      state.lastAddedItemId = null;
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null;
    },
    /**
     * Optimistically increment/decrement a cart item's quantity locally.
     * The actual API call happens in the background via updateCartItem thunk.
     * If the API call fails, the next fetchCart corrects the count.
     */
    optimisticUpdateItem: (
      state,
      action: PayloadAction<{ itemId: string; delta: number }>
    ) => {
      const { itemId, delta } = action.payload;
      if (!state.cart?.items) return;
      const item = state.cart.items.find((i) => i._id === itemId);
      if (item) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
          state.cart.items = state.cart.items.filter((i) => i._id !== itemId);
        } else {
          item.quantity = newQty;
        }
      }
    },
    /**
     * Optimistically add a new item to cart (before server confirms).
     */
    optimisticAddItem: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      // No-op if cart isn't loaded yet — real addToCart thunk handles it
      if (!state.cart) return;
    },
  },
  extraReducers: (builder) => {
    // Fetch cart
    builder.addCase(fetchCart.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      state.isLoading = false;
      state.cart = action.payload;
      if (state.appliedCoupon && (!state.cart || Number(state.cart.subtotal || 0) < Number(state.appliedCoupon.minOrderAmount || 0))) {
        state.appliedCoupon = null;
      }
    });
    builder.addCase(fetchCart.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Add to cart
    builder.addCase(addToCart.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(addToCart.fulfilled, (state, action) => {
      state.isLoading = false;
      state.cart = action.payload.cart;
      state.lastAddedItemId = action.payload.productId;
      if (state.appliedCoupon && (!state.cart || Number(state.cart.subtotal || 0) < Number(state.appliedCoupon.minOrderAmount || 0))) {
        state.appliedCoupon = null;
      }
    });
    builder.addCase(addToCart.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update cart item
    builder.addCase(updateCartItem.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateCartItem.fulfilled, (state, action) => {
      state.isLoading = false;
      state.cart = action.payload;
      if (state.appliedCoupon && (!state.cart || Number(state.cart.subtotal || 0) < Number(state.appliedCoupon.minOrderAmount || 0))) {
        state.appliedCoupon = null;
      }
    });
    builder.addCase(updateCartItem.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Remove from cart
    builder.addCase(removeFromCart.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(removeFromCart.fulfilled, (state, action) => {
      state.isLoading = false;
      state.cart = action.payload;
      if (state.appliedCoupon && (!state.cart || Number(state.cart.subtotal || 0) < Number(state.appliedCoupon.minOrderAmount || 0))) {
        state.appliedCoupon = null;
      }
    });
    builder.addCase(removeFromCart.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Clear cart
    builder.addCase(clearCart.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(clearCart.fulfilled, (state) => {
      state.isLoading = false;
      state.cart = null;
      state.appliedCoupon = null;
    });
    builder.addCase(clearCart.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Apply Coupon
    builder.addCase(applyCoupon.pending, (state) => {
      state.isValidatingCoupon = true;
      state.error = null;
    });
    builder.addCase(applyCoupon.fulfilled, (state, action) => {
      state.isValidatingCoupon = false;
      state.appliedCoupon = action.payload;
    });
    builder.addCase(applyCoupon.rejected, (state, action) => {
      state.isValidatingCoupon = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, clearLastAddedItem, removeCoupon, optimisticUpdateItem, optimisticAddItem } = cartSlice.actions;

export default cartSlice.reducer;
