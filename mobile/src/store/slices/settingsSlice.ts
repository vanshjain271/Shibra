import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../services/api.service';

export interface StoreSettings {
  minOrderAmount: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  codEnabled: boolean;
  razorpayEnabled: boolean;
  advancePartialPayment: boolean;
  partialPaymentPercent: number;
  [key: string]: any; // Allow other fields from the DB
}

interface SettingsState {
  settings: StoreSettings | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: null,
  isLoading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ success: boolean; data: StoreSettings }>('/settings');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch settings');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action: PayloadAction<StoreSettings>) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default settingsSlice.reducer;
