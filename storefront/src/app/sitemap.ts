import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.shibra.in';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://13.201.30.242:5001/api/v1';

  // Fetch all active products
  let products: any[] = [];
  try {
    const res = await fetch(`${apiUrl}/products?limit=250`);
    if (res.ok) {
      const result = await res.json();
      const rawProducts = result.data?.products || result.products || result.data || [];
      products = Array.isArray(rawProducts) ? rawProducts : [];
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch products', e);
  }

  // Fetch all active categories
  let categories: any[] = [];
  try {
    const res = await fetch(`${apiUrl}/categories`);
    if (res.ok) {
      const result = await res.json();
      const rawCategories = result.data || result.categories || [];
      categories = Array.isArray(rawCategories) ? rawCategories : [];
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch categories', e);
  }

  const productUrls = products.map((product) => ({
    url: `${baseUrl}/product/${product._id}`,
    lastModified: new Date(product.updatedAt || Date.now()),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug || cat._id}`,
    lastModified: new Date(cat.updatedAt || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/wishlist`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ];

  return [...staticUrls, ...productUrls, ...categoryUrls];
}
