'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCategories } from '@/hooks/useApi';


export default function CategoryNav() {
  const { categories, isLoading } = useCategories();
  const [isOpen, setIsOpen] = useState(false);

  const getCategoryIcon = (cat: any) => {
    const name = (cat.name || '').toLowerCase();
    const slug = (cat.slug || '').toLowerCase();
    const combined = name + ' ' + slug;

    // Always match by name first — DB icons are often generic/same for all
    if (combined.includes('earphone') || combined.includes('earbud') || combined.includes('headphone') || combined.includes('neckband') || combined.includes('audio')) return 'headphones';
    if (combined.includes('cover') || combined.includes('case') || combined.includes('back')) return 'phone_iphone';
    if (combined.includes('battery') || combined.includes('power bank') || combined.includes('powerbank')) return 'battery_charging_full';
    if (combined.includes('cable') || combined.includes('charging') || combined.includes('charger') || combined.includes('adapter')) return 'cable';
    if (combined.includes('watch') || combined.includes('wearable') || combined.includes('band')) return 'watch';
    if (combined.includes('speaker') || combined.includes('bluetooth')) return 'speaker';
    if (combined.includes('mobile') || combined.includes('phone') || combined.includes('smartphone')) return 'smartphone';
    if (combined.includes('laptop') || combined.includes('computer')) return 'laptop';
    if (combined.includes('tablet') || combined.includes('ipad')) return 'tablet';
    if (combined.includes('deal') || combined.includes('offer') || combined.includes('sale')) return 'local_offer';
    if (combined.includes('screen') || combined.includes('glass') || combined.includes('protector')) return 'screen_lock_portrait';
    if (combined.includes('stand') || combined.includes('holder') || combined.includes('mount')) return 'phone_in_talk';
    if (combined.includes('accessory') || combined.includes('accessories')) return 'devices_other';
    
    // Add more common generic mappings based on user feedback
    if (combined.includes('light') || combined.includes('lamp') || combined.includes('bulb')) return 'lightbulb';
    if (combined.includes('umbrella') || combined.includes('rain')) return 'umbrella';
    if (combined.includes('bag') || combined.includes('backpack')) return 'backpack';
    if (combined.includes('shoe') || combined.includes('footwear')) return 'ice_skating'; // closest material icon
    if (combined.includes('cloth') || combined.includes('apparel') || combined.includes('fashion') || combined.includes('wear')) return 'checkroom';
    if (combined.includes('home') || combined.includes('decor')) return 'home';
    if (combined.includes('kitchen') || combined.includes('cook')) return 'kitchen';
    if (combined.includes('toy') || combined.includes('game') || combined.includes('kid')) return 'toys';
    if (combined.includes('sport') || combined.includes('fitness')) return 'fitness_center';
    if (combined.includes('beauty') || combined.includes('makeup') || combined.includes('cosmetic')) return 'health_and_beauty';
    if (combined.includes('book') || combined.includes('read') || combined.includes('stationery')) return 'menu_book';
    if (combined.includes('electronic') || combined.includes('device') || combined.includes('gadget')) return 'devices';
    if (combined.includes('pet')) return 'pets';

    // Fall back to DB icon only if it's a specific non-generic one
    if (cat.icon && cat.icon !== 'category' && cat.icon !== 'phone_iphone' && cat.icon !== 'smartphone') return cat.icon;

    return 'category'; // last resort default
  };

  if (isLoading) {
    return (
      <div className="bg-white border-b border-surface-border py-3">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-surface-border relative z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 py-3 text-text-primary hover:text-primary font-semibold text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">category</span>
          All Categories
          <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            arrow_drop_down
          </span>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-xl z-50">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="flex overflow-x-auto scrollbar-hide gap-8 py-4">
                {categories.map((cat: any) => {
                  const isDeal = cat.name?.toLowerCase().includes('deal') || cat.slug?.toLowerCase().includes('deal');
                  const displayIcon = getCategoryIcon(cat);
                  
                  return (
                    <Link href={`/category/${cat.slug}`} key={cat._id || cat.id} onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-2 cursor-pointer group shrink-0 w-[80px] relative">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 relative" style={{background: '#EDE9FE'}}>
                        {cat.image && (
                           <Image src={cat.image} alt={cat.name} fill sizes="80px" className="object-cover" />
                        )}
                        {isDeal && (
                          <span className="absolute top-0 right-0 bg-primary text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full z-10 leading-none tracking-wider shadow-sm">
                            NEW
                          </span>
                        )}
                        <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform duration-300" style={{color: '#7B2FF7'}}>
                          {displayIcon}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors duration-300 capitalize text-center w-full truncate">{cat.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
