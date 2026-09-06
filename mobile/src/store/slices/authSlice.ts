/**
 * Auth Slice
 * Fixed:
 * - verifyOTP thunk parameter: screens pass {phone, otp} but thunk had
 *   {phoneNumber, otp} as destructured param name — unified to `phone`
 * - loadStoredAuth: handles JSON parse errors gracefully
 * - logout: clears additional cart/address related storage keys too
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../../services/auth.service';
import { User } from '../../types/api.types';
import { STORAGE_KEYS } from '../../constants';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  confirmationResult: boolean; // Firebase confirmation successful
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
  confirmationResult: false,
};

// ==================== ASYNC THUNKS ====================

/**
 * Initialize auth from AsyncStorage
 */
export const loadStoredAuth = createAsyncThunk('auth/initialize', async () => {
  try {
    const [tokenEntry, userEntry] = await AsyncStorage.multiGet([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER,
    ]);

    const authToken = tokenEntry[1];
    let userData: User | null = null;

    // Purge stale fake tokens from previous sessions
    if (authToken === 'mock_jwt_token_for_universal_bypass') {
      await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER]);
      return { token: null, user: null };
    }

    if (userEntry[1]) {
      try {
        userData = JSON.parse(userEntry[1]);
      } catch {
        // FIX: corrupt storage — clear and restart
        await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER]);
        return { token: null, user: null };
      }
    }

    if (authToken && userData) {
      return { token: authToken, user: userData };
    }

    return { token: null, user: null };
  } catch (error) {
    console.error('Initialize auth error:', error);
    return { token: null, user: null };
  }
});

/**
 * Send OTP
 */
export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async (phone: string, { rejectWithValue }) => {
    try {
      const response = await authService.sendOTP(phone);
      return response;
    } catch (error: any) {
      // Include native error details for diagnosis
      let detail = error?.nativeErrorMessage || error?.nativeErrorCode || '';
      
      // If Firebase gives the generic "print and inspect" message, force extract userInfo
      if (detail.includes('print and inspect') || !detail) {
        try {
          // NativeFirebaseError hides userInfo, we need to explicitly access it
          const userInfo = error?.userInfo;
          if (userInfo) {
            detail = `UserInfo: ${JSON.stringify(userInfo)}`;
          } else {
            detail = `Error Keys: ${Object.getOwnPropertyNames(error).join(', ')}`;
          }
        } catch (e) {
          detail = "Could not extract userInfo";
        }
      }
      
      const msg = error?.message || 'Failed to send OTP';
      return rejectWithValue(detail ? `${msg} | Native: ${detail}` : msg);
    }
  }
);

export const verifyFirebaseOTP = createAsyncThunk(
  'auth/verifyFirebaseOTP',
  async ({ otp }: { otp: string }, { rejectWithValue }) => {
    try {
      const response = await authService.verifyFirebaseOTP(otp);

      if (response.success && response.token && response.user) {
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.AUTH_TOKEN, response.token],
          [STORAGE_KEYS.USER, JSON.stringify(response.user)],
        ]);

        return {
          token: response.token,
          user: response.user,
        };
      }

      throw new Error(response.message || 'Verification failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to verify OTP');
    }
  }
);


/**
 * Logout

 */
export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.FCM_TOKEN,
      STORAGE_KEYS.CART,
    ]);
    return null;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
});

/**
 * Update profile
 */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    updates: { name?: string; addresses?: any[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await authService.updateProfile(updates);

      if (response.success && response.user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
        return response.user;
      }

      throw new Error(response.message || 'Update failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

// ==================== SLICE ====================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Initialize auth
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isInitializing = false;
        if (action.payload.token && action.payload.user) {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isInitializing = false;
      });

    // Send OTP
    builder
      .addCase(sendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.confirmationResult = true;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify Firebase OTP
    builder
      .addCase(verifyFirebaseOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyFirebaseOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.confirmationResult = false; // Clear search result
      })
      .addCase(verifyFirebaseOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });


    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;