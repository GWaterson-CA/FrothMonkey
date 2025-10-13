-- Check what URL is stored in the database for the test listing
-- This will show us what the email function receives

-- Check the specific listing (folder name from your screenshot)
SELECT 
  id,
  title,
  cover_image_url,
  LENGTH(cover_image_url) as url_length,
  CASE 
    WHEN cover_image_url IS NULL THEN '❌ NULL'
    WHEN cover_image_url LIKE 'http%' THEN '✅ Full URL (already correct!)'
    WHEN cover_image_url LIKE '/_next/image%' THEN '⚠️ Next.js optimizer (needs conversion)'
    WHEN cover_image_url LIKE '/storage%' THEN '⚠️ Relative path (needs domain)'
    WHEN cover_image_url LIKE '2fb6feb4%' OR cover_image_url LIKE '95970711%' THEN '⚠️ Just filename (needs full path)'
    ELSE '❓ Other format'
  END as url_format
FROM listings 
WHERE id = '2fb6feb4-5ae2-4644-89be-fe8493963ca1';

-- If that doesn't work, search by partial URL match:
SELECT 
  id,
  title,
  cover_image_url,
  created_at
FROM listings 
WHERE cover_image_url LIKE '%95970711%' 
   OR cover_image_url LIKE '%2fb6feb4%'
   OR id = '2fb6feb4-5ae2-4644-89be-fe8493963ca1'
LIMIT 5;

-- Also check all recent listings to see the pattern
SELECT 
  id,
  title,
  LEFT(cover_image_url, 150) as url_preview,
  CASE 
    WHEN cover_image_url LIKE 'http%' THEN '✅ Full URL'
    WHEN cover_image_url LIKE '/_next%' THEN '⚠️ Next.js'
    ELSE '❓ Other'
  END as format
FROM listings 
WHERE cover_image_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

