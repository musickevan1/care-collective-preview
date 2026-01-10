import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://care-collective-preview.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/messages/',
          '/requests/new',
          '/requests/*/edit',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
