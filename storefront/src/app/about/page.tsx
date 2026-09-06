'use client';

import { useSettings } from '@/hooks/useApi';
import Link from 'next/link';

export default function AboutPage() {
  const { settings, isLoading } = useSettings();

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen pb-12 flex justify-center items-center">
        <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <div className="bg-primary/5 py-16 px-4 text-center border-b border-border">
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">About Shibra</h1>
        <p className="text-text-secondary max-w-2xl mx-auto text-lg">
          Your trusted destination for premium mobile accessories.
        </p>
      </div>

      {/* Content Section */}
      <div className="py-12 px-4 max-w-4xl mx-auto">
        <div className="bg-surface rounded-xl shadow-sm border border-border p-6 md:p-10">
          <div 
            className="prose prose-purple max-w-none text-text-secondary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: settings?.aboutUs || '<p>Welcome to Shibra! We provide top-quality chargers, cables, audio gear, and more at unbeatable prices.</p>' }}
          />
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dark transition-colors font-semibold">
            <span className="material-symbols-outlined">shopping_bag</span>
            Start Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
