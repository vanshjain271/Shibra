'use client';

import Image from 'next/image';
import Link from 'next/link';
import { use, useState } from 'react';
import { useCategories, useProducts } from '@/hooks/useApi';
import HoverZoomImage from '@/components/product/HoverZoomImage';
import ProductCardCarousel from '@/components/ui/ProductCardCarousel';

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  
  // Convert slug to readable title
  const title = resolvedParams.slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const { categories, isLoading: isCategoriesLoading } = useCategories();
  const category = categories.find((c: any) => c.slug === resolvedParams.slug);
  
  // Pass null while loading categories to prevent eagerly fetching all products
  const categoryId = isCategoriesLoading ? null : (category ? category._id : undefined);
  
  const { products, isLoading: isProductsLoading } = useProducts(categoryId);
  const isLoading = isCategoriesLoading || isProductsLoading;

  // Transform backend products
  const formattedProducts = products.map((p: any) => ({
    id: p._id,
    name: p.name,
    price: p.salePrice,
    mrp: p.mrp,
    discount: Math.round(((p.mrp - p.salePrice) / p.mrp) * 100),
    image: p.images && p.images.length > 0 ? (p.images[0].url || p.images[0]) : 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=800&auto=format&fit=crop',
    images: p.images?.length > 0 ? p.images.map((img: any) => img.url || img) : ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=800&auto=format&fit=crop'],
    rating: p.averageRating || 4.5,
    reviews: p.totalReviews || 0,
    brand: p.brand?.name || p.brand || 'Generic',
    isAssured: true,
  }));


  const [minDiscount, setMinDiscount] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<{min: number, max: number} | null>(null);

  // Brand filtering removed as per user request
  const displayProducts = formattedProducts.filter((p: any) => {
    if (minDiscount && p.discount < minDiscount) return false;
    if (priceRange) {
      if (p.price < priceRange.min || p.price > priceRange.max) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setMinDiscount(null);
    setPriceRange(null);
  };

  return (
    <div className="bg-background min-h-screen pb-12">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-surface-border py-3">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-xs text-text-secondary flex items-center gap-2">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Categories</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-medium text-text-primary">{title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white border border-surface-border rounded-sm sticky top-24">
            <div className="p-4 border-b border-surface-border flex justify-between items-center">
              <h2 className="font-bold text-lg">Filters</h2>
              <button onClick={clearFilters} className="text-xs text-primary font-medium hover:underline">CLEAR ALL</button>
            </div>
            
            {/* Brand Filter removed */}

            {/* Price Filter */}
            <div className="p-4 border-b border-surface-border">
              <h3 className="font-medium text-sm mb-3 uppercase text-text-primary">Price</h3>
              <div className="space-y-2">
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
                      className="w-4 h-4 text-primary border-surface-border focus:ring-primary accent-primary" 
                    />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary">{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Discount Filter */}
            <div className="p-4 border-b border-surface-border">
              <h3 className="font-medium text-sm mb-3 uppercase text-text-primary">Discount</h3>
              <div className="space-y-2">
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
                      className="w-4 h-4 text-primary border-surface-border focus:ring-primary accent-primary" 
                    />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary">{discount.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
          </div>
        </aside>

        {/* Product List */}
        <main className="flex-grow">
          <div className="bg-white border border-surface-border rounded-sm p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-text-primary">{title}</h1>
              <p className="text-xs text-text-secondary mt-1">(Showing {displayProducts.length > 0 ? `1 – ${displayProducts.length}` : '0'} products)</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm border-t sm:border-t-0 pt-3 sm:pt-0">
              <span className="font-medium text-text-primary">Sort By</span>
              <button className="text-primary font-medium border-b-2 border-primary pb-1">Relevance</button>
              <button className="text-text-secondary hover:text-text-primary pb-1 transition-colors border-b-2 border-transparent hover:border-surface-border">Popularity</button>
              <button className="text-text-secondary hover:text-text-primary pb-1 transition-colors border-b-2 border-transparent hover:border-surface-border hidden md:block">Price -- Low to High</button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64 w-full">
              <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
            </div>
          ) : displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayProducts.map((product: any) => (
                <div key={product.id} className="bg-white border border-surface-border hover:shadow-lg transition-shadow rounded-sm group relative flex flex-col h-full">
                  <Link href={`/product/${product.id}`} className="block relative aspect-square p-4">
                    <ProductCardCarousel 
                      images={product.images || [product.image]}
                      alt={product.name}
                      useHoverZoom={true}
                    />
                    <button className="absolute top-3 right-3 text-text-muted hover:text-primary transition-colors z-10 bg-white/50 rounded-full w-8 h-8 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">favorite</span>
                    </button>
                  </Link>
                  
                  <div className="p-4 flex flex-col flex-grow border-t border-surface-border">
                    {product.isAssured && (
                      <div className="mb-2 w-16 h-4 bg-primary rounded flex items-center justify-center">
                         <span className="text-[9px] text-white font-bold italic">✓ assured</span>
                      </div>
                    )}
                    <Link href={`/product/${product.id}`} className="flex-grow">
                      <h3 className="text-sm font-medium text-text-primary line-clamp-2 hover:text-primary transition-colors">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="bg-success text-white text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          {product.rating} <span className="material-symbols-outlined text-[12px]">star</span>
                        </div>
                        <span className="text-xs text-text-secondary">({product.reviews})</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-text-primary">₹{(product.price || 0).toLocaleString('en-IN')}</span>
                        <span className="text-xs text-text-secondary line-through">₹{(product.mrp || 0).toLocaleString('en-IN')}</span>
                        <span className="text-xs font-bold text-success">{product.discount || 0}% off</span>
                      </div>
                    </Link>
                    
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-border">
                      <Link 
                        href={`/product/${product.id}`}
                        className="flex-1 bg-primary text-white text-center py-2 rounded-sm text-sm font-bold hover:bg-primary-dark transition-colors"
                      >
                        Add to Cart
                      </Link>
                      <a 
                        href={`https://wa.me/917428143728?text=Hi, I want to inquire about ${product.name}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-9 h-9 shrink-0 flex items-center justify-center border border-[#25D366] text-[#25D366] rounded-sm hover:bg-[#25D366] hover:text-white transition-colors"
                        title="Inquire on WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[20px] h-[20px]">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-64 bg-white border border-surface-border text-text-secondary">
              <span className="material-symbols-outlined text-[48px] mb-4">inventory_2</span>
              <h2 className="text-xl font-bold text-text-primary">No products available</h2>
              <p>Try clearing filters or check back later.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
