'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import api from '@/lib/api';
import HoverZoomImage from '@/components/product/HoverZoomImage';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=400';

export default function WishlistPage() {
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const { addToCart } = useCartStore();
  const { items: wishlistIds, toggleWishlist, fetchWishlist } = useWishlistStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthenticated) { openLoginModal(); return; }
    loadWishlist();
  }, [isMounted, isAuthenticated, openLoginModal]);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/wishlist');
      const items = res.data?.data?.wishlist || res.data?.wishlist || [];
      setProducts(items);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    await toggleWishlist(productId);
    setProducts(prev => prev.filter(p => (p._id || p.id) !== productId));
  };

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) { openLoginModal(); return; }
    const product = products.find(p => (p._id || p.id) === productId);
    if (product && (product.hasVariants || product.hasModels)) {
      window.location.href = `/product/${productId}`;
      return;
    }
    setAddingId(productId);
    await addToCart(productId, 1);
    setAddingId(null);
    setAddedId(productId);
    setTimeout(() => setAddedId(null), 2000);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-500 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">My Wishlist</h1>
            <p className="text-sm text-gray-500">{products.length} {products.length === 1 ? 'item' : 'items'} saved</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="material-symbols-outlined text-[80px] text-purple-200" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            <h2 className="text-xl font-bold text-gray-700">Your wishlist is empty</h2>
            <p className="text-gray-500 text-sm text-center max-w-xs">Save items you love and come back to order them anytime.</p>
            <Link href="/" className="mt-4 bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md">
              Explore Products
            </Link>
          </div>
        ) : (
          <>
            {/* Move all to cart button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => products.forEach(p => handleAddToCart(p._id || p.id))}
                className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 shadow"
              >
                <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                Add All to Cart
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product: any) => {
                const id = product._id || product.id;
                const img = product.images?.[0]?.url || product.images?.[0] || DEFAULT_IMG;
                const price = product.salePrice || 0;
                const mrp = product.mrp || 0;
                const discount = mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
                const isAdding = addingId === id;
                const isAdded = addedId === id;

                return (
                  <div key={id} className="bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group">
                    <Link href={`/product/${id}`} className="block relative aspect-square p-4 bg-gray-50 border-b border-surface-border">
                      <HoverZoomImage 
                        src={img} 
                        alt={product.name} 
                        scale={2}
                        className="w-full h-full"
                        imageClassName="p-4" 
                      />
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {discount}% OFF
                        </span>
                      )}
                      {/* Remove from wishlist */}
                      <button
                        onClick={(e) => { e.preventDefault(); handleRemove(id); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-sm hover:bg-red-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      </button>
                    </Link>

                    <div className="p-4 flex flex-col flex-grow">
                      <Link href={`/product/${id}`} className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-purple-600 transition-colors flex-grow">
                        {product.name}
                      </Link>
                      <div className="flex items-baseline gap-2 mt-3">
                        <span className="text-lg font-extrabold text-gray-900">₹{price.toLocaleString('en-IN')}</span>
                        {mrp > price && <span className="text-sm text-gray-400 line-through">₹{mrp.toLocaleString('en-IN')}</span>}
                        {discount > 0 && <span className="text-sm font-bold text-green-600">{discount}% off</span>}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleAddToCart(id)}
                          disabled={isAdding}
                          className={`flex-grow py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5
                            ${isAdded ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white active:scale-95'} disabled:opacity-70`}
                        >
                          {isAdding ? (
                            <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : isAdded ? (
                            <><span className="material-symbols-outlined text-[16px]">check_circle</span> Added!</>
                          ) : (
                            <><span className="material-symbols-outlined text-[16px]">add_shopping_cart</span> Add to Cart</>
                          )}
                        </button>
                        <button
                          onClick={() => handleRemove(id)}
                          className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Remove from wishlist"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
