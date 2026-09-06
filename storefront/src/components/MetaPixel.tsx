'use client';

import { useEffect, Suspense, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Define the global fbq function for TypeScript
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1340208524952160';

export const pageview = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

// Generic event tracking function to be used across the app
export const event = (name: string, options = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', name, options);
  }
};

function PixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasFiredInitial = useRef(false);

  useEffect(() => {
    // The initial PageView is fired synchronously in the <head> of layout.tsx
    // so we skip the first render to avoid duplicates.
    if (!hasFiredInitial.current) {
      hasFiredInitial.current = true;
      return;
    }
    
    // This effect runs on subsequent route changes to trigger a new PageView
    if (FB_PIXEL_ID) {
      pageview();
    }
  }, [pathname, searchParams]);

  return null;
}

export default function MetaPixel() {
  if (!FB_PIXEL_ID) return null;

  return (
    <>
      <Suspense fallback={null}>
        <PixelTracker />
      </Suspense>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
