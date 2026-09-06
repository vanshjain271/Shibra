'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface WishlistState {
  items: string[]; // product IDs
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      fetchWishlist: async () => {
        set({ isLoading: true });
        try {
          const res = await api.get('/users/wishlist');
          const wishlistItems = res.data?.data?.wishlist || res.data?.wishlist || [];
          // Store just IDs for fast lookup
          const ids = wishlistItems.map((item: any) => item._id || item.id || item);
          set({ items: ids, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      toggleWishlist: async (productId: string) => {
        const current = get().items;
        const isIn = current.includes(productId);
        // Optimistic update
        set({ items: isIn ? current.filter(id => id !== productId) : [...current, productId] });
        try {
          await api.post('/users/wishlist', { productId });
        } catch {
          // Revert on error
          set({ items: current });
        }
      },

      isWishlisted: (productId: string) => get().items.includes(productId),
    }),
    {
      name: 'shibra-wishlist',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
