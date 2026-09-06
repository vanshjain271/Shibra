/**
 * Redux Store
 * Combines all slices and configures middleware
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from './slices/authSlice';
import productReducer from './slices/productSlice';
import cartReducer from './slices/cartSlice';
import orderReducer from './slices/orderSlice';
import addressReducer from './slices/addressSlice';
import reviewReducer from './slices/reviewSlice';
import settingsReducer from './slices/settingsSlice';
import { apiClient } from '../services/api.service';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    orders: orderReducer,
    address: addressReducer,
    review: reviewReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

// Register API client's unauthorized callback to dispatch Redux logout
apiClient.onUnauthorized(() => {
  store.dispatch(logout());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
