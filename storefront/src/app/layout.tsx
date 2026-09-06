import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthModal from "@/components/auth/AuthModal";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SWRProvider from "@/components/SWRProvider";
import MetaPixel from "@/components/MetaPixel";

import Script from 'next/script';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://13.201.30.242:5001/api/v1';
    const res = await fetch(`${apiUrl}/settings`, { 
      next: { revalidate: 60 } // cache for 60 seconds
    });
    
    if (res.ok) {
      const { data } = await res.json();
      return {
        title: data?.metaTitle || data?.storeName || "Shibra | Premium Mobile Accessories",
        description: data?.metaDescription || "Shop for the best quality chargers, cables, earbuds, and more.",
        keywords: data?.metaKeywords || "Shibra,  Mobile accessories, Premium cases, Chargers, Cables, Earbuds",
        openGraph: {
          title: data?.metaTitle || data?.storeName || "Shibra | Premium Mobile Accessories",
          description: data?.metaDescription || "Shop for the best quality chargers, cables, earbuds, and more.",
          url: 'https://www.shibrab2b.com',
          siteName: data?.storeName || 'Shibra',
          images: [
            {
              url: 'https://www.shibrab2b.com/icon.png',
              width: 512,
              height: 512,
              alt: 'Shibra Logo',
            },
          ],
          locale: 'en_IN',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: data?.metaTitle || data?.storeName || "Shibra | Premium Mobile Accessories",
          description: data?.metaDescription || "Shop for the best quality chargers, cables, earbuds, and more.",
          images: ['https://www.shibrab2b.com/icon.png'],
        },
      };
    }
  } catch (error) {
    console.error("Failed to fetch metadata", error);
  }

  // Fallback metadata
  return {
    title: "Shibra | Premium Mobile Accessories",
    description: "Shop for the best quality chargers, cables, earbuds, and more.",
    keywords: "Shibra,  Mobile accessories, Premium cases, Chargers, Cables, Earbuds",
    openGraph: {
      title: "Shibra | Premium Mobile Accessories",
      description: "Shop for the best quality chargers, cables, earbuds, and more.",
      url: 'https://www.shibrab2b.com',
      siteName: 'Shibra',
      images: [
        {
          url: 'https://www.shibrab2b.com/icon.png',
          width: 512,
          height: 512,
          alt: 'Shibra Logo',
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: "Shibra | Premium Mobile Accessories",
      description: "Shop for the best quality chargers, cables, earbuds, and more.",
      images: ['https://www.shibrab2b.com/icon.png'],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        {/* Structured Data (Schema.org) for Sitelinks & Brand Recognition */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://www.shibrab2b.com/#website",
                  "url": "https://www.shibrab2b.com",
                  "name": "Shibra",
                  "description": "Premium Mobile Accessories Store",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://www.shibrab2b.com/search?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "Organization",
                  "@id": "https://www.shibrab2b.com/#organization",
                  "name": "Shibra",
                  "url": "https://www.shibrab2b.com",
                  "logo": {
                    "@type": "ImageObject",
                    "@id": "https://www.shibrab2b.com/#logo",
                    "url": "https://www.shibrab2b.com/icon.png",
                    "caption": "Shibra"
                  },
                  "image": {
                    "@id": "https://www.shibrab2b.com/#logo"
                  }
                }
              ]
            })
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID || '1340208524952160'}');
              fbq('track', 'PageView');
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <SWRProvider>
          <Header />
          {children}
          <AuthModal />
          <Footer />
        </SWRProvider>
        <MetaPixel />
      </body>
    </html>
  );
}
