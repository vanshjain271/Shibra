'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProducts } from '@/hooks/useApi';
import ImageZoom from '@/components/ui/ImageZoom';
import ProductCardCarousel from '@/components/ui/ProductCardCarousel';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=400';

function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCartStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const id = product._id || product.id;
  const wishlisted = isWishlisted(id);
  const img = product.images?.[0]?.url || product.images?.[0] || DEFAULT_IMG;
  const price = product.salePrice || 0;
  const mrp = product.mrp || 0;
  const discount = mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.hasVariants || product.hasModels) {
      window.location.href = `/product/${id}`;
      return;
    }
    if (!isAuthenticated) { openLoginModal(); return; }
    setAdding(true);
    await addToCart(id, 1);
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link href={`/product/${id}`} className="group bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        <ProductCardCarousel 
          images={product.images || [product.image]} 
          alt={product.name} 
          useHoverZoom={false}
        />
        {discount > 0 && <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">{discount}% OFF</span>}
        <button
          onClick={async (e) => { e.preventDefault(); if (!isAuthenticated) { openLoginModal(); return; } await toggleWishlist(id); }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${wishlisted ? 'bg-red-50 text-red-500' : 'bg-white/90 text-gray-400 hover:text-red-400'}`}
        >
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        </button>
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug flex-grow">{product.name}</p>
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="text-base font-bold text-gray-900">₹{price.toLocaleString('en-IN')}</span>
          {mrp > price && <span className="text-xs text-gray-400 line-through">₹{mrp.toLocaleString('en-IN')}</span>}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button onClick={handleCart} disabled={adding}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${added ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'} disabled:opacity-70`}>
            {adding ? <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              : added ? <><span className="material-symbols-outlined text-[14px]">check</span> Added!</>
              : <><span className="material-symbols-outlined text-[14px]">add_shopping_cart</span> Add</>}
          </button>
          <a 
            href={`https://wa.me/917428143728?text=Hi, I want to inquire about ${product.name}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 shrink-0 flex items-center justify-center border border-[#25D366] text-[#25D366] rounded-xl hover:bg-[#25D366] hover:text-white transition-colors" 
            title="Inquire on WhatsApp"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
          </a>
        </div>
      </div>
    </Link>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { products, isLoading } = useProducts(undefined, query);

  const formattedProducts = products.map((p: any) => ({
    ...p,
    brandName: p.brand?.name || p.brand || 'Generic',
    discount: p.mrp > 0 && p.salePrice < p.mrp ? Math.round(((p.mrp - p.salePrice) / p.mrp) * 100) : 0,
  }));

  const [minDiscount, setMinDiscount] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<{min: number, max: number} | null>(null);

  const displayProducts = formattedProducts.filter((p: any) => {
    if (minDiscount && p.discount < minDiscount) return false;
    if (priceRange) {
      if ((p.salePrice || 0) < priceRange.min || (p.salePrice || 0) > priceRange.max) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setMinDiscount(null);
    setPriceRange(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">
            {query ? `Results for "${query}"` : 'All Products'}
          </h1>
          {!isLoading && (
            <p className="text-sm text-gray-500 mt-1">{displayProducts.length} products found</p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl sticky top-24 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="font-bold text-lg text-gray-800">Filters</h2>
                <button onClick={clearFilters} className="text-xs text-purple-600 font-bold hover:underline">CLEAR ALL</button>
              </div>
              
              {/* Brand Filter removed */}
              {/* Price Filter */}
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-sm mb-3 uppercase text-gray-700 tracking-wider">Price</h3>
                <div className="space-y-2.5">
                  {[
                    { label: 'Under ₹1,000', min: 0, max: 1000 },
                    { label: '₹1,000 - ₹5,000', min: 1000, max: 5000 },
                    { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
                    { label: 'Over ₹10,000', min: 10000, max: 10000000 }
                  ].map(range => (
                    <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="priceRange"
                        checked={priceRange?.min === range.min && priceRange?.max === range.max}
                        onChange={() => setPriceRange({ min: range.min, max: range.max })}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500" 
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Discount Filter */}
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-3 uppercase text-gray-700 tracking-wider">Discount</h3>
                <div className="space-y-2.5">
                  {[
                    { label: '10% or more', value: 10 },
                    { label: '30% or more', value: 30 },
                    { label: '50% or more', value: 50 }
                  ].map(discount => (
                    <label key={discount.label} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="discount"
                        checked={minDiscount === discount.value}
                        onChange={() => setMinDiscount(discount.value)}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500" 
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium">{discount.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product List */}
          <main className="flex-grow">


        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-xl border border-gray-200">
            <span className="material-symbols-outlined text-[64px] text-purple-200">search_off</span>
            <h2 className="text-xl font-bold text-gray-700">No results found</h2>
            <p className="text-gray-500 text-sm">Try different filters or keywords.</p>
            <button onClick={clearFilters} className="mt-4 bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {displayProducts.map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
