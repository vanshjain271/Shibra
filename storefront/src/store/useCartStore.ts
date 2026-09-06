import { create } from 'zustand';
import api from '@/lib/api';
import { event } from '@/components/MetaPixel';

export interface CartItem {
  id: string;        // item._id (subdoc id)
  productId: {
    _id: string;
    name: string;
    salePrice: number;   // mapped from item.price
    mrp: number;         // mapped from item.mrp
    images: { url: string }[];
    slug?: string;
    minOrderQty?: number;
    isLot?: boolean;
    lotDetails?: any;
  };
  variantId?: string;
  variantName?: string;
  selectedModel?: string;
  quantity: number;
  priceAtAddition: number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;

  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number, variantId?: string, selectedModel?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearLocalCart: () => void;
}

/** Normalize one raw cart item from the backend enriched format */
function normalizeItem(raw: any): CartItem {
  // Backend cart.service returns:
  // { _id, product: { _id, name, slug, image, isActive, taxRate, minOrderQty }, variant, quantity, price, mrp, subtotal }
  const image = raw.product?.image || raw.productId?.images?.[0]?.url || raw.productId?.images?.[0] || '';
  return {
    id: raw._id || raw.id,
    productId: {
      _id: raw.product?._id || raw.productId?._id,
      name: raw.product?.name || raw.productId?.name || '',
      salePrice: Number(raw.price ?? raw.productId?.salePrice ?? 0),
      mrp: Number(raw.mrp ?? raw.productId?.mrp ?? 0),
      images: image ? [{ url: image }] : [],
      slug: raw.product?.slug || raw.productId?.slug,
      minOrderQty: Number(raw.product?.minOrderQty ?? raw.productId?.minOrderQty ?? 1),
      isLot: raw.product?.isLot || raw.productId?.isLot,
      lotDetails: raw.product?.lotDetails || raw.productId?.lotDetails,
    },
    variantId: raw.variant?._id || raw.variantId,
    variantName: raw.variant?.name,
    selectedModel: raw.selectedModel,
    quantity: Number(raw.quantity),
    priceAtAddition: Number(raw.price ?? raw.priceAtAddition ?? 0),
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/cart');
      // Backend controller returns: { success, cart: { items: [...] } }
      const rawItems: any[] =
        res.data?.cart?.items ||
        res.data?.data?.cart?.items ||
        res.data?.items ||
        [];
      set({ items: rawItems.map(normalizeItem), isLoading: false });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      set({ isLoading: false });
    }
  },

  addToCart: async (productId: string, quantity = 1, variantId?: string, selectedModel?: string) => {
    try {
      await api.post('/cart/items', { productId, quantity, variantId: variantId || undefined, selectedModel: selectedModel || undefined });
      event('AddToCart');
      await get().fetchCart();
    } catch (error: any) {
      console.error('Failed to add to cart:', error?.response?.data?.message || error);
      throw error;
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await get().removeFromCart(itemId);
        return;
      }
      await api.put(`/cart/items/${itemId}`, { quantity });
      await get().fetchCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  },

  removeFromCart: async (itemId: string) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      await get().fetchCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  },

  clearLocalCart: () => set({ items: [] }),
}));
