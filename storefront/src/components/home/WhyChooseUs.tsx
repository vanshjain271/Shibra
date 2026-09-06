'use client';

import { useSettings } from '@/hooks/useApi';

export default function WhyChooseUs() {
  const { settings } = useSettings();
  
  // Default features if settings API fails or hasn't loaded
  const defaultFeatures = [
    { title: '100% Genuine', subtitle: 'Original products only', iconName: 'verified' },
    { title: 'Free Delivery', subtitle: 'On all orders', iconName: 'local_shipping' },
    { title: 'Best Prices', subtitle: 'Lowest prices guaranteed', iconName: 'currency_rupee' },
    { title: '24/7 Support', subtitle: "We're here to help", iconName: 'support_agent' }
  ];

  const featuresToDisplay = settings?.storeFeatures?.length > 0 ? settings.storeFeatures : defaultFeatures;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
      <div className="bg-white border border-surface-border rounded-xl shadow-sm py-5 px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-2 divide-y sm:divide-y-0 sm:gap-y-6 lg:divide-x divide-gray-100">
        
        {featuresToDisplay.map((feature: any, idx: number) => {
          // Clean icon name (some might have -outline from old icon sets)
          const icon = (feature.iconName || 'verified').replace(/-outline/g, '').replace(/-/g, '_');
          
          return (
            <div key={feature._id || idx} className={`flex items-center gap-4 ${idx > 0 ? 'pt-4 sm:pt-0' : 'py-3 sm:py-0'} lg:px-6 justify-start sm:justify-center lg:justify-start`}>
              <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center shrink-0 border border-primary/5">
                <span className="material-symbols-outlined text-primary text-[24px]">{icon}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-text-primary text-sm leading-tight">{feature.title}</span>
                <span className="text-[11px] text-text-secondary mt-0.5 font-medium">{feature.subtitle}</span>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
