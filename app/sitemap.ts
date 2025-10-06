import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.frothmonkey.com'
  const supabase = createClient()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Fetch all active listings
  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at, status')
    .in('status', ['live', 'ended', 'sold'])
    .order('updated_at', { ascending: false })
    .limit(5000) // Limit to prevent huge sitemaps

  const listingPages: MetadataRoute.Sitemap = (listings || []).map((listing) => ({
    url: `${baseUrl}/listing/${listing.id}`,
    lastModified: new Date(listing.updated_at || new Date()),
    changeFrequency: listing.status === 'live' ? 'hourly' : 'weekly',
    priority: listing.status === 'live' ? 0.9 : 0.6,
  }))

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .order('name')

  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(category.updated_at || new Date()),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  return [...staticPages, ...listingPages, ...categoryPages]
}

// Revalidate the sitemap every hour
export const revalidate = 3600

