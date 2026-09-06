import useSWR from 'swr';
import api from '@/lib/api';

const fetcher = (url: string) => api.get(url).then(res => res.data?.data || res.data);

export function useCategories() {
  const { data, error, isLoading } = useSWR('/categories', fetcher);
  return { categories: data?.categories || [], error, isLoading };
}

export function useCart() {
  const { data, error, isLoading, mutate } = useSWR('/cart', fetcher);

  return {
    cart: data?.data?.cart || null,
    isLoading,
    isError: error,
    mutate
  };
}

export function useAddresses() {
  const { data, error, isLoading, mutate } = useSWR('/addresses', fetcher);
  // Backend: { success, count, data: [...addresses] }
  // fetcher strips outer to data = { count, data: [...] } — but wait:
  // fetcher does res.data?.data || res.data
  // res.data = { success, count, data: [...] }, so res.data?.data = [...addresses]
  return {
    addresses: Array.isArray(data) ? data : (data?.data || []),
    isLoading,
    isError: error,
    mutate
  };
}

export function useOrders() {
  const { data, error, isLoading, mutate } = useSWR('/orders/my', fetcher);
  // Backend: { success, orders: [...], total, page }
  // fetcher does res.data?.data || res.data — res.data has no .data field, so it returns the whole object
  return {
    orders: data?.orders || [],
    isLoading,
    isError: error,
    mutate
  };
}

export function useReviews(productId: string) {
  const { data, error, isLoading, mutate } = useSWR(`/reviews/product/${productId}?page=1&limit=50`, fetcher);
  return {
    reviews: data?.reviews || [],
    stats: {
      averageRating: data?.averageRating || 0,
      totalReviews: data?.totalReviews || 0,
    },
    isLoading,
    isError: error,
    mutate
  };
}

export function useMyReviews() {
  const { data, error, isLoading, mutate } = useSWR('/reviews/me', fetcher);
  return {
    reviews: data?.reviews || [],
    isLoading,
    isError: error,
    mutate
  };
}

export function useWishlist() {
  const { data, error, isLoading, mutate } = useSWR('/users/wishlist', fetcher);

  return {
    wishlist: data?.data?.wishlist || [],
    isLoading,
    isError: error,
    mutate
  };
}

export function useBanners() {
  const { data, error, isLoading } = useSWR('/banners', fetcher);
  return { banners: data?.banners || [], error, isLoading };
}

export function useProducts(categoryId?: string | null, search?: string, limit: number = 100) {
  const queryParams = new URLSearchParams();
  if (categoryId) queryParams.append('categoryId', categoryId);
  if (search) queryParams.append('search', search);
  queryParams.append('limit', limit.toString());
  const queryString = queryParams.toString();
  const url = queryString ? `/products?${queryString}` : '/products';

  // If categoryId is explicitly null, we are still waiting for it to resolve, so we pass null to SWR to prevent fetching
  const shouldFetch = categoryId !== null;

  const { data, error, isLoading } = useSWR(shouldFetch ? url : null, fetcher);

  return { products: data?.products || [], error, isLoading };
}

export function useProductDetail(productId: string) {
  const { data, error, isLoading } = useSWR(
    productId ? `/products/${productId}` : null,
    fetcher
  );

  return { product: data?.product || null, error, isLoading };
}

export function useSettings() {
  const { data, error, isLoading } = useSWR('/settings', fetcher);
  // Backend sends { success, data: settings }, fetcher strips to `data` = settings object
  const settings = data || {};
  return { settings, error, isLoading };
}

export function useBrands() {
  const { data, error, isLoading } = useSWR('/brands', fetcher);
  return { brands: data?.brands || [], error, isLoading };
}

export function useProductsByBrand(brandId?: string) {
  const url = brandId ? `/products?brandId=${brandId}` : null;
  const { data, error, isLoading } = useSWR(url, fetcher);
  return { products: data?.products || [], error, isLoading };
}
