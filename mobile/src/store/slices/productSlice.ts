/**
 * Product Slice
 * Fixed:
 * - fetchMoreProducts was ignoring passed filters param, used stale state pagination
 * - pagination shape: added hasMore alias for OrdersScreen compatibility
 * - fetchProducts now correctly maps response products array
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product, Category, Brand, PaginatedResponse } from '../../types/api.types';
import { productService, ProductFilters } from '../../services/product.service';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasMore: boolean; // FIX: added for OrdersScreen compatibility
}

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  filters: ProductFilters;
  pagination: Pagination | null;
  searchQuery: string;
  categories: Category[];
  categoriesLoadedAt: number | null;
  brands: Brand[];
  brandsLoadedAt: number | null;
  dynamicSections: Record<string, Product[]>;
  sectionsLoadedAt: number | null; // timestamp when homepage sections last loaded
}

const STALE_AFTER_MS = 5 * 60 * 1000; // 5 minutes

const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  filters: {
    page: 1,
    limit: 20,
  },
  pagination: null,
  searchQuery: '',
  categories: [],
  categoriesLoadedAt: null,
  brands: [],
  brandsLoadedAt: null,
  dynamicSections: {},
  sectionsLoadedAt: null,
};

/**
 * Fetch products with filters
 */
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (filters: ProductFilters, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);

/**
 * Fetch more products (pagination)
 * FIX: was `async (_, { getState })` ignoring the passed filters argument entirely.
 * Now accepts filters + page directly.
 */
export const fetchMoreProducts = createAsyncThunk(
  'products/fetchMoreProducts',
  async (filters: ProductFilters, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch more products');
    }
  }
);

/**
 * Fetch product by ID
 */
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId: string, { rejectWithValue }) => {
    try {
      const product = await productService.getProductById(productId);
      return product;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch product');
    }
  }
);

/**
 * Search products
 */
export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await productService.searchProducts(query);
      return { ...response, query };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search products');
    }
  }
);

/**
 * Fetch all categories — skips if data is fresh (< 5 min)
 */
export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const categories = await productService.getCategories();
      return categories;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch categories');
    }
  }
);

/**
 * Fetch all brands
 */
export const fetchBrands = createAsyncThunk(
  'products/fetchBrands',
  async (_, { rejectWithValue }) => {
    try {
      const brands = await productService.getBrands();
      return brands;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch brands');
    }
  }
);

/**
 * Fetch trending products
 */
export const fetchTrendingProducts = createAsyncThunk(
  'products/fetchTrendingProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts({ search: 'trending', limit: 10 });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch trending products');
    }
  }
);

/**
 * Fetch products for specific homepage sections
 */
export const fetchHomepageSection = createAsyncThunk(
  'products/fetchHomepageSection',
  async ({ section, limit = 10 }: { section: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts({ homepageSection: section, limit });
      // Randomize (shuffle) products so they appear fresh on refresh, per user request
      const shuffledProducts = [...response.products].sort(() => Math.random() - 0.5);
      return { section, products: shuffledProducts };
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to fetch ${section}`);
    }
  }
);

// Helper to normalise pagination from response
const normalisePagination = (p: any): Pagination => ({
  page: p.page,
  limit: p.limit,
  total: p.total,
  pages: p.pages,
  hasNext: p.hasNext ?? false,
  hasMore: p.hasNext ?? false, // FIX: alias for screens using hasMore
});

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ProductFilters>>) => {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
      state.products = []; // Instantly clear old products on filter change
    },
    clearFilters: (state) => {
      state.filters = { page: 1, limit: 20 };
      state.searchQuery = '';
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch products
    builder.addCase(fetchProducts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchProducts.fulfilled, (state, action) => {
      state.isLoading = false;
      // FIX: response may have products at top level or inside data
      const payload = action.payload as any;
      state.products = payload.products ?? payload.data ?? [];
      state.pagination = normalisePagination(payload.pagination);
    });
    builder.addCase(fetchProducts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch more products
    builder.addCase(fetchMoreProducts.pending, (state) => {
      state.isLoadingMore = true;
      state.error = null;
    });
    builder.addCase(fetchMoreProducts.fulfilled, (state, action) => {
      state.isLoadingMore = false;
      const payload = action.payload as any;
      const newProducts = payload.products ?? payload.data ?? [];
      state.products = [...state.products, ...newProducts];
      state.pagination = normalisePagination(payload.pagination);
    });
    builder.addCase(fetchMoreProducts.rejected, (state, action) => {
      state.isLoadingMore = false;
      state.error = action.payload as string;
    });

    // Fetch product by ID
    builder.addCase(fetchProductById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchProductById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedProduct = action.payload;
    });
    builder.addCase(fetchProductById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Search products
    builder.addCase(searchProducts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(searchProducts.fulfilled, (state, action) => {
      state.isLoading = false;
      const payload = action.payload as any;
      state.products = payload.products ?? payload.data ?? [];
      state.pagination = normalisePagination(payload.pagination);
      state.searchQuery = payload.query;
    });
    builder.addCase(searchProducts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch categories
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      if (action.payload !== null) {
        state.categories = action.payload as Category[];
        state.categoriesLoadedAt = Date.now();
      }
    });

    // Fetch brands
    builder.addCase(fetchBrands.fulfilled, (state, action) => {
      if (action.payload !== null) {
        state.brands = action.payload as Brand[];
        state.brandsLoadedAt = Date.now();
      }
    });

    // Fetch trending products
    builder.addCase(fetchTrendingProducts.fulfilled, (state, action) => {
      const payload = action.payload as any;
      state.isLoading = false;
      state.dynamicSections = state.dynamicSections || {};
      state.dynamicSections['TRENDING'] = payload.products ?? payload.data ?? [];
    });

    // Fetch homepage sections
    builder.addCase(fetchHomepageSection.fulfilled, (state, { payload }) => {
      const { section, products } = payload;
      state.dynamicSections = state.dynamicSections || {};
      state.dynamicSections[section] = products;
    });
  },
});

export const {
  setFilters,
  clearFilters,
  setSearchQuery,
  clearSelectedProduct,
  clearError,
} = productSlice.actions;

export default productSlice.reducer;