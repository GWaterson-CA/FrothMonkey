-- Check what image URLs are actually stored in the database
-- Run this in Supabase SQL Editor to see actual URLs

-- 1. Check all listings with images
SELECT 
  id,
  title,
  cover_image_url,
  CASE 
    WHEN cover_image_url IS NULL THEN 'NULL - No image'
    WHEN cover_image_url LIKE 'http%' THEN 'Full URL'
    WHEN cover_image_url LIKE '/_next%' THEN 'Next.js optimizer'
    WHEN cover_image_url LIKE '/storage%' THEN 'Relative storage path'
    ELSE 'Other format'
  END as url_type
FROM listings 
WHERE cover_image_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 2. See a sample of actual URLs
SELECT 
  id,
  title,
  LEFT(cover_image_url, 100) as url_preview
FROM listings 
WHERE cover_image_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check storage bucket setup
-- In Supabase Dashboard:
-- Go to Storage → View all buckets
-- Check if "listing-images" bucket exists and is PUBLIC

