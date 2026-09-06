/**
 * Address Redux Slice
 * 
 * Manages address state and operations
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Address } from '../../types/api.types';
import addressService, { AddAddressParams, UpdateAddressParams } from '../../services/address.service';

interface AddressState {
  addresses: Address[];
  selectedAddress: Address | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AddressState = {
  addresses: [],
  selectedAddress: null,
  isLoading: false,
  error: null,
};

// Async Thunks
export const fetchAddresses = createAsyncThunk(
  'address/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const addresses = await addressService.getAddresses();
      return addresses;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch addresses');
    }
  }
);

export const addAddress = createAsyncThunk(
  'address/addAddress',
  async (data: AddAddressParams, { rejectWithValue }) => {
    try {
      const address = await addressService.addAddress(data);
      return address;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add address');
    }
  }
);

export const updateAddress = createAsyncThunk(
  'address/updateAddress',
  async (data: UpdateAddressParams, { rejectWithValue }) => {
    try {
      const address = await addressService.updateAddress(data);
      return address;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update address');
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'address/deleteAddress',
  async (addressId: string, { rejectWithValue }) => {
    try {
      await addressService.deleteAddress(addressId);
      return addressId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete address');
    }
  }
);

export const setDefaultAddress = createAsyncThunk(
  'address/setDefaultAddress',
  async (addressId: string, { rejectWithValue }) => {
    try {
      const address = await addressService.setDefaultAddress(addressId);
      return address;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to set default address');
    }
  }
);

// Slice
const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    selectAddress: (state, action: PayloadAction<Address>) => {
      state.selectedAddress = action.payload;
    },
    clearSelectedAddress: (state) => {
      state.selectedAddress = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Addresses
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses = action.payload;
        
        // Retain selected address if it still exists, otherwise auto-select default or first
        const currentSelectedId = state.selectedAddress?._id;
        const stillExists = action.payload.find((a: Address) => a._id === currentSelectedId);
        
        if (!stillExists && action.payload.length > 0) {
          const defaultAddr = action.payload.find((a: Address) => a.isDefault);
          state.selectedAddress = defaultAddr || action.payload[0];
        } else if (stillExists) {
          // Keep the reference updated with latest data
          state.selectedAddress = stillExists;
        }
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add Address
    builder
      .addCase(addAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses.push(action.payload);
        // If it's the first address or set as default, select it
        if (action.payload.isDefault || state.addresses.length === 1) {
          state.selectedAddress = action.payload;
        }
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Address
    builder
      .addCase(updateAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.addresses.findIndex((addr) => addr._id === action.payload._id);
        if (index !== -1) {
          state.addresses[index] = action.payload;
        }
        if (state.selectedAddress?._id === action.payload._id) {
          state.selectedAddress = action.payload;
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete Address
    builder
      .addCase(deleteAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses = state.addresses.filter((addr) => addr._id !== action.payload);
        if (state.selectedAddress?._id === action.payload) {
          state.selectedAddress = null;
        }
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Set Default Address
    builder
      .addCase(setDefaultAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update all addresses - set others to non-default
        state.addresses = state.addresses.map((addr) => ({
          ...addr,
          isDefault: addr._id === action.payload._id,
        }));
        state.selectedAddress = action.payload;
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectAddress, clearSelectedAddress, clearError } = addressSlice.actions;
export default addressSlice.reducer;
