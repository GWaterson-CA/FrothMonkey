/**
 * Image Optimization Utilities
 * 
 * Uses Supabase's built-in image transformation API for free, unlimited image optimization.
 * This replaces Vercel's image optimization which has limited free tier.
 * 
 * Supabase transformation docs: https://supabase.com/docs/guides/storage/serving/image-transformations
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export interface ImageTransformOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'origin'
  resize?: 'cover' | 'contain' | 'fill'
}

/**
 * Get Supabase Storage URL with image transformation
 * 
 * Uses Supabase's free image transformation API
 * 
 * @example
 * getOptimizedImageUrl('path/to/image.jpg', { width: 384, quality: 75 })
 * // Returns: https://[project].supabase.co/storage/v1/render/image/public/listing-images/path/to/image.jpg?width=384&quality=75&format=webp&resize=cover
 */
export function getOptimizedImageUrl(
  path: string,
  options: ImageTransformOptions = {}
): string {
  // If it's already a full URL, return as-is
  if (path.startsWith('http')) return path

  // Default options
  const {
    width,
    height,
    quality = 75,
    format = 'webp',
    resize = 'cover'
  } = options

  // Clean the path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Remove any existing storage prefix
  const imagePath = cleanPath.replace(/^storage\/v1\/object\/public\/listing-images\//, '')

  // Build Supabase transformation URL
  const baseUrl = `${SUPABASE_URL}/storage/v1/render/image/public/listing-images/${imagePath}`
  
  const params = new URLSearchParams()
  if (width) params.set('width', width.toString())
  if (height) params.set('height', height.toString())
  params.set('quality', quality.toString())
  params.set('format', format)
  params.set('resize', resize)

  return `${baseUrl}?${params.toString()}`
}

/**
 * Get direct image URL without optimization
 * 
 * @example
 * getDirectImageUrl('path/to/image.jpg')
 * // Returns: https://[project].supabase.co/storage/v1/object/public/listing-images/path/to/image.jpg
 */
export function getDirectImageUrl(path: string): string {
  if (path.startsWith('http')) return path
  
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const imagePath = cleanPath.replace(/^storage\/v1\/object\/public\/listing-images\//, '')
  
  return `${SUPABASE_URL}/storage/v1/object/public/listing-images/${imagePath}`
}

/**
 * Get responsive image URLs for different screen sizes
 * Perfect for srcset attribute
 * 
 * @example
 * const urls = getResponsiveImageUrls('image.jpg')
 * <img
 *   src={urls.medium}
 *   srcSet={`${urls.small} 384w, ${urls.medium} 768w, ${urls.large} 1280w`}
 * />
 */
export function getResponsiveImageUrls(path: string) {
  return {
    thumbnail: getOptimizedImageUrl(path, { width: 150, quality: 70 }),
    small: getOptimizedImageUrl(path, { width: 384, quality: 75 }),
    medium: getOptimizedImageUrl(path, { width: 768, quality: 80 }),
    large: getOptimizedImageUrl(path, { width: 1280, quality: 85 }),
    xlarge: getOptimizedImageUrl(path, { width: 1920, quality: 85 }),
    original: getDirectImageUrl(path),
  }
}

/**
 * Get optimized thumbnail URL
 * Useful for card grids, lists, etc.
 * 
 * @example
 * getThumbnailUrl('image.jpg') // 384x384 thumbnail
 */
export function getThumbnailUrl(path: string, size: number = 384): string {
  return getOptimizedImageUrl(path, {
    width: size,
    height: size,
    quality: 75,
    resize: 'cover'
  })
}

/**
 * Get optimized cover image URL
 * Maintains aspect ratio, fits within dimensions
 * 
 * @example
 * getCoverImageUrl('image.jpg', 1280, 720)
 */
export function getCoverImageUrl(path: string, width: number, height?: number): string {
  return getOptimizedImageUrl(path, {
    width,
    height,
    quality: 80,
    resize: 'contain'
  })
}

/**
 * Get image URL optimized for email
 * Email clients prefer JPEG over WebP for compatibility
 * 
 * @example
 * getEmailImageUrl('image.jpg')
 */
export function getEmailImageUrl(path: string, width: number = 600): string {
  // For emails, use origin format (JPEG) for maximum compatibility
  return getOptimizedImageUrl(path, {
    width,
    quality: 75,
    format: 'origin' // Don't convert to WebP for email compatibility
  })
}

