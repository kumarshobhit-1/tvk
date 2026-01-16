import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admintvk01/'],
      },
    ],
    sitemap: 'https://thevictorykey.com/sitemap.xml', // Update with your actual domain
  };
}
