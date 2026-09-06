'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

import ImageZoom from '@/components/ui/ImageZoom';
import ProductCardCarousel from '@/components/ui/ProductCardCarousel';

interface Product {
  id: string;
  name: string;
  price: number;
  mrp: number;
  discount: number;
  image: string;
  rating: number;
  isLot?: boolean;
  lotDetails?: any;
  hasVariants?: boolean;
  hasModels?: boolean;
  minOrderQty?: number;
}

interface Props {
  title: string;
  subtitle?: string;
  products: Product[];
  badgeColor?: string;
  viewAllLink?: string;
}

function ProductCard({ product }: { product: Product }) {
  const { addToCart, items, updateQuantity } = useCartStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const wishlisted = isWishlisted(product.id);
  const router = useRouter();

  const cartItem = items.find(i => i.productId?._id === product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.hasVariants || product.hasModels) {
      router.push(`/product/${product.id}`);
      return;
    }
    if (!isAuthenticated) { openLoginModal(); return; }
    setAdding(true);
    try {
      const qty = product.isLot && product.lotDetails ? product.lotDetails.fullLotQuantity : (product.minOrderQty || 1);
      await addToCart(product.id, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Add to cart failed', err);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.hasVariants || product.hasModels) {
      router.push(`/product/${product.id}`);
      return;
    }
    if (!isAuthenticated) { openLoginModal(); return; }
    if (!cartItem) {
      setAdding(true);
      try {
        const qty = product.isLot && product.lotDetails ? product.lotDetails.fullLotQuantity : 1;
        await addToCart(product.id, qty);
        router.push('/checkout');
      } catch (err) {
        console.error('Buy lot failed', err);
      } finally {
        setAdding(false);
      }
    } else {
      router.push('/checkout');
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { openLoginModal(); return; }
    await toggleWishlist(product.id);
  };

  return (
    <Link href={`/product/${product.id}`} className="group shrink-0 w-44 md:w-52 bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        <ProductCardCarousel 
          images={product.images || [product.image]} 
          alt={product.name} 
          useHoverZoom={false}
        />
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {product.discount}% OFF
          </span>
        )}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${wishlisted ? 'bg-red-50 text-red-500' : 'bg-white text-gray-400 hover:text-red-400'}`}
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}>
            favorite
          </span>
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
        <div className="flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-amber-400 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-xs text-gray-500 font-medium">{product.rating.toFixed(1)}</span>
        </div>
        <div className="mt-3 h-10 w-full">
          {product.isLot ? (
            <button
              onClick={handleBuyNow}
              disabled={adding}
              className={`w-full h-full rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white hover:shadow-md active:scale-95 disabled:opacity-70`}
            >
              {adding ? (
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <><span className="material-symbols-outlined text-[16px]">bolt</span> Buy Lot</>
              )}
            </button>
          ) : cartItem ? (
            <div className="flex items-center justify-between w-full h-full border border-purple-600 rounded-xl overflow-hidden">
              <button 
                onClick={(e) => { e.preventDefault(); updateQuantity(cartItem.id!, cartItem.quantity - 1); }}
                className="w-1/3 h-full flex items-center justify-center bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-lg"
              >-</button>
              <span className="w-1/3 h-full flex items-center justify-center font-bold text-gray-800 text-sm">
                {cartItem.quantity}
              </span>
              <button 
                onClick={(e) => { e.preventDefault(); updateQuantity(cartItem.id!, cartItem.quantity + 1); }}
                className="w-1/3 h-full flex items-center justify-center bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-lg"
              >+</button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`w-full h-full rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5
                ${added
                  ? 'bg-green-500 text-white scale-95'
                  : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-md active:scale-95'
                } disabled:opacity-70`}
            >
              {adding ? (
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : added ? (
                <><span className="material-symbols-outlined text-[16px]">check_circle</span> Added!</>
              ) : (
                <><span className="material-symbols-outlined text-[16px]">add_shopping_cart</span> Add to Cart</>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ProductCarousel({ title, subtitle, products, viewAllLink }: Props) {
  if (!products || products.length === 0) return null;

  return (
    <section className="bg-white py-6 border-b border-purple-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold text-gray-900 truncate" title={title}>{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5 truncate" title={subtitle}>{subtitle}</p>}
          </div>
          {viewAllLink && (
            <Link href={viewAllLink} className="shrink-0 text-sm text-purple-600 font-bold hover:underline flex items-center gap-1">
              View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          )}
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export { ProductCard };
