'use client';

import { useState } from 'react';
import Link from 'next/link';
import HeroCarousel from '@/components/home/HeroCarousel';
import ProductCarousel from '@/components/home/ProductCarousel';
import { useProducts } from '@/hooks/useApi';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import HoverZoomImage from '@/components/product/HoverZoomImage';
import ProductCardCarousel from '@/components/ui/ProductCardCarousel';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=800&auto=format&fit=crop';

function formatProduct(p: any) {
  return {
    id: p._id,
    name: p.name,
    price: p.salePrice || 0,
    mrp: p.mrp || 0,
    discount: p.mrp > 0 ? Math.round(((p.mrp - p.salePrice) / p.mrp) * 100) : 0,
    image: p.images?.[0]?.url || p.images?.[0] || DEFAULT_IMAGE,
    images: p.images?.length > 0 ? p.images.map((img: any) => img.url || img) : [DEFAULT_IMAGE],
    rating: p.averageRating || 4.5,
    reviews: p.totalReviews || 0,
    homepageSections: p.homepageSections || [],
    isLot: p.isLot || false,
    lotDetails: p.lotDetails || null,
    categoryName: (Array.isArray(p.category) && p.category.length > 0) ? p.category[0].name : (p.category?.name || 'Uncategorized'),
  };
}

const features = [
  { icon: 'local_shipping', label: 'Free Delivery', sub: 'On orders above ₹499' },
  { icon: 'autorenew', label: 'Easy Returns', sub: '7-day return policy' },
  { icon: 'verified_user', label: '100% Authentic', sub: 'Genuine products' },
  { icon: 'support_agent', label: '24/7 Support', sub: 'Always here for you' },
];

function ProductCardGrid({ product }: { product: any }) {
  const { addToCart } = useCartStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.hasVariants || product.hasModels) {
      window.location.href = `/product/${product.id}`;
      return;
    }
    if (!isAuthenticated) { openLoginModal(); return; }
    setAdding(true);
    await addToCart(product.id, 1);
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { openLoginModal(); return; }
    await toggleWishlist(product.id);
  };

  return (
    <Link href={`/product/${product.id}`} className="group bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        <ProductCardCarousel 
          images={product.images || [product.image]} 
          alt={product.name} 
          useHoverZoom={true}
        />
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
            {product.discount}% OFF
          </span>
        )}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${wishlisted ? 'bg-red-50 text-red-500' : 'bg-white/90 text-gray-400 hover:text-red-400'}`}
        >
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        </button>
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug flex-grow">{product.name}</p>
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="text-base font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-gray-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
          )}
        </div>
        {product.discount > 0 && <span className="text-xs font-bold text-green-600">{product.discount}% off</span>}
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1
            ${added ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white active:scale-95'} disabled:opacity-70`}
        >
          {adding ? (
            <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : added ? (
            <><span className="material-symbols-outlined text-[14px]">check</span> Added!</>
          ) : (
            <><span className="material-symbols-outlined text-[14px]">add_shopping_cart</span> Add</>
          )}
        </button>
      </div>
    </Link>
  );
}

export default function Home() {
  const { products, isLoading } = useProducts();
  const formattedProducts = products.map(formatProduct);
  const lotProducts = formattedProducts.filter((p: any) => p.isLot);
  const normalProducts = formattedProducts.filter((p: any) => !p.isLot);
  const allCategories = Array.from(new Set(normalProducts.map((p: any) => p.categoryName)));

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeroCarousel />


      {!isLoading && lotProducts.length > 0 && (
        <ProductCarousel
          title="Premium Lots"
          subtitle="Buy in bulk and save more"
          products={lotProducts}
          viewAllLink="/search"
        />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
        </div>
      ) : formattedProducts.length > 0 ? (
        <>
          {allCategories.map((categoryName) => {
            const categoryProducts = normalProducts.filter((p: any) => p.categoryName === categoryName);
            if (categoryProducts.length === 0) return null;
            
            return (
              <ProductCarousel
                key={categoryName as string}
                title={categoryName as string}
                subtitle={`Explore our ${categoryName} collection`}
                products={categoryProducts}
                viewAllLink={`/category/${encodeURIComponent((categoryName as string).toLowerCase().replace(/\s+/g, '-'))}`}
              />
            );
          })}

        </>
      ) : (
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <span className="material-symbols-outlined text-[64px] text-purple-200">inventory_2</span>
          <h2 className="text-xl font-bold text-gray-700">No products yet</h2>
          <p className="text-sm text-gray-500">Check back soon for new arrivals!</p>
        </div>
      )}
    </div>
  );
}
