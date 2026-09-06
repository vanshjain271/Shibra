import Image from 'next/image';
import Link from 'next/link';

export type Product = {
  id: string;
  name: string;
  price: number;
  mrp: number;
  discount: number;
  image: string;
  rating: number;
  reviews: number;
  isAssured?: boolean;
};

interface ProductGridProps {
  title: string;
  products: Product[];
  subtitle?: string;
  timer?: boolean;
}

export default function ProductGrid({ title, products, subtitle, timer }: ProductGridProps) {
  return (
    <div className="py-8 max-w-7xl mx-auto px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary">{title}</h2>
            {timer && (
              <div className="flex items-center gap-1 bg-danger/10 text-danger px-2 py-1 rounded text-sm font-bold">
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span>12:45:00</span>
              </div>
            )}
          </div>
          {subtitle && <p className="text-text-secondary mt-1 text-sm">{subtitle}</p>}
        </div>
        <Link href="#" className="bg-primary text-white text-sm font-bold px-4 py-2 rounded shadow hover:bg-primary-dark transition-colors w-max">
          VIEW ALL
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white border border-surface-border hover:shadow-lg transition-shadow rounded-sm group relative flex flex-col h-full">
            <Link href={`/product/${product.id}`} className="block relative aspect-square p-4">
              <Image 
                src={product.image} 
                alt={product.name} 
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
            
            <div className="p-4 pt-0 flex flex-col flex-grow">
              <Link href={`/product/${product.id}`}>
                <h3 className="text-sm font-medium text-text-primary line-clamp-2 hover:text-primary transition-colors h-10">
                  {product.name}
                </h3>
              </Link>
              
              <div className="flex items-center gap-2 mt-2">
                <div className="bg-success text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  {product.rating} <span className="material-symbols-outlined text-[10px]">star</span>
                </div>
                <span className="text-xs text-text-muted">({product.reviews})</span>
                {product.isAssured && (
                  <span className="ml-auto flex items-center bg-primary text-white text-[9px] italic font-bold px-1 rounded-sm">
                    ✓ assured
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-bold text-text-primary">₹{(product.price || 0).toLocaleString('en-IN')}</span>
                <span className="text-xs text-text-muted line-through">₹{(product.mrp || 0).toLocaleString('en-IN')}</span>
                <span className="text-xs font-bold text-success">{product.discount || 0}% off</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
