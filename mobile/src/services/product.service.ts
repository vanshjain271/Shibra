/**
 * Product Service
 * Fixed:
 * - getProductById: was accessing response.data?.product but backend may return
 *   product at top level — normalised
 * - getCategories / getBrands: normalised response shape
 * - getProducts: normalised to always return consistent PaginatedProductResponse
 */

import { apiClient } from './api.service';
import { Product, Category, Brand } from '../types/api.types';

export interface ProductFilters {
  categoryId?: string;
  brandId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'salePrice' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  homepageSection?: string;
}

export interface NormalisedProductResponse {
  success: boolean;
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ProductService {
  /**
   * Get products with filters and pagination
   */
  async getProducts(filters: ProductFilters = {}): Promise<NormalisedProductResponse> {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.brandId && { brandId: filters.brandId }),
      ...(filters.search && { search: filters.search }),
      ...(filters.sortBy && { sortBy: filters.sortBy }),
      ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      ...(filters.homepageSection && { homepageSection: filters.homepageSection }),
    };

    const response = await apiClient.get<any>('/products', { params });

    // Normalise — backend may wrap in data or return at top level
    const products: Product[] =
      response.products ?? response.data?.products ?? response.data ?? [];
    const pag = response.pagination ?? response.data?.pagination ?? {};

    return {
      success: true,
      products,
      pagination: {
        page: pag.page ?? params.page,
        limit: pag.limit ?? params.limit,
        total: pag.total ?? products.length,
        pages: pag.pages ?? 1,
        hasNext: pag.hasNext ?? false,
        hasPrev: pag.hasPrev ?? false,
      },
    };
  }

  /**
   * Get single product by ID
   * FIX: was throwing if response.data?.product missing — now handles top-level
   */
  async getProductById(productId: string): Promise<Product> {
    const response = await apiClient.get<any>(`/products/${productId}`);
    const product = response.product ?? response.data?.product ?? response.data ?? response;
    if (!product || !product._id) {
      throw new Error('Product not found');
    }
    return product as Product;
  }

  /**
   * Search products
   */
  async searchProducts(query: string, page: number = 1): Promise<NormalisedProductResponse> {
    return this.getProducts({ search: query, page });
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    categoryId: string,
    page: number = 1
  ): Promise<NormalisedProductResponse> {
    return this.getProducts({ categoryId, page });
  }

  /**
   * Get products by brand
   */
  async getProductsByBrand(
    brandId: string,
    page: number = 1
  ): Promise<NormalisedProductResponse> {
    return this.getProducts({ brandId, page });
  }

  /**
   * Get all categories
   * FIX: normalised response
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<any>('/categories');
    return (
      response.categories ??
      response.data?.categories ??
      (Array.isArray(response.data) ? response.data : [])
    );
  }

  /**
   * Get all brands
   * FIX: normalised response
   */
  async getBrands(): Promise<Brand[]> {
    const response = await apiClient.get<any>('/brands');
    return (
      response.brands ??
      response.data?.brands ??
      (Array.isArray(response.data) ? response.data : [])
    );
  }
}

export const productService = new ProductService();