'use client';

import { SWRConfig } from 'swr';

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Re-fetch when user focuses the window/tab (so storefront refreshes after admin changes)
        revalidateOnFocus: true,
        // Re-fetch when browser reconnects to internet
        revalidateOnReconnect: true,
        // Deduplicate identical requests within 3 seconds
        dedupingInterval: 3000,
        // Only throttle focus revalidation every 10 seconds
        focusThrottleInterval: 10000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
