'use client';

import { useSettings } from '@/hooks/useApi';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PolicyPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { settings, isLoading } = useSettings();
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');

  useEffect(() => {
    if (isLoading) return;
    if (!settings) {
      router.push('/');
      return;
    }

    switch (slug) {
      case 'privacy-policy':
        setTitle('Privacy Policy');
        setContent(settings.privacyPolicy || '<p>Privacy Policy is not defined yet.</p>');
        break;
      case 'terms-and-conditions':
        setTitle('Terms & Conditions');
        setContent(settings.termsAndConditions || '<p>Terms and Conditions are not defined yet.</p>');
        break;
      case 'refund-policy':
        setTitle('Return & Refund Policy');
        setContent(settings.refundPolicy || '<p>Refund Policy is not defined yet.</p>');
        break;
      case 'shipping-policy':
        setTitle('Shipping Policy');
        setContent(settings.shippingPolicy || '<p>Shipping Policy is not defined yet.</p>');
        break;
      case 'return-policy':
        setTitle('Return Policy');
        setContent(settings.returnPolicy || '<p>Return Policy is not defined yet.</p>');
        break;
      default:
        router.push('/');
        break;
    }
  }, [slug, settings, isLoading, router]);

  if (isLoading || !content) {
    return (
      <div className="bg-background min-h-screen pb-12 flex justify-center items-center">
        <img src="/icon.png" alt="Loading" className="w-12 h-12 animate-pulse rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="bg-primary/5 border-b border-border p-6 md:p-8 text-center">
          <h1 className="text-3xl font-bold text-text-primary mb-2">{title}</h1>
          <div className="w-16 h-1 bg-accent mx-auto rounded-full"></div>
        </div>
        
        <div 
          className="p-6 md:p-10 text-text-secondary leading-relaxed prose prose-purple max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
