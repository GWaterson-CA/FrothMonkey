import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.frothmonkey.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/*',
          '/account/*',
          '/admin/*',
          '/auth/*',
          '/sell/*',
        ],
      },
      // Allow AI crawlers (ChatGPT, Claude, etc.)
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'anthropic-ai'],
        allow: '/',
        disallow: [
          '/api/*',
          '/account/*',
          '/admin/*',
          '/auth/*',
          '/sell/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

