import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://care-collective-preview.vercel.app';

  // Public pages that should be indexed
  const publicRoutes = [
    '',           // Home page
    '/about',
    '/contact',
    '/resources',
    '/help',
    '/terms',
    '/privacy-policy',
    '/login',
    '/signup',
  ];

  const currentDate = new Date().toISOString();

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/about' ? 0.9 : 0.8,
  }));
}
