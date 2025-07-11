export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/my/',
        '/pro/',
        '/api/',
        '/_next/',
        '/private/',
      ],
    },
    sitemap: 'https://careservice.es/sitemap.xml',
  }
} 