-- Verification script for Toys & Models category deployment
-- Run this after deploying to confirm everything is set up correctly

-- ============================================
-- 1. Check Main Category
-- ============================================
SELECT 
  '✅ Main Category' as check_type,
  id,
  name,
  slug,
  sort_order,
  icon,
  parent_id,
  active_listing_count
FROM categories 
WHERE slug = 'toys-and-models';

-- Should return 1 row with:
-- name = 'Toys & Models'
-- slug = 'toys-and-models'
-- sort_order = 6
-- icon = '🧸'
-- parent_id = NULL

-- ============================================
-- 2. Check All Subcategories
-- ============================================
SELECT 
  '✅ Subcategories' as check_type,
  name,
  slug,
  sort_order,
  active_listing_count
FROM categories 
WHERE parent_id = (SELECT id FROM categories WHERE slug = 'toys-and-models')
ORDER BY sort_order;

-- Should return 11 rows in this order:
-- 1. Radio Control & Robots
-- 2. Ride-On Toys
-- 3. Models
-- 4. Lego & Building Toys
-- 5. Games & Puzzles
-- 6. Outdoor Toys & Trampolines
-- 7. Wooden
-- 8. Vintage
-- 9. Dolls
-- 10. Bath Toys
-- 11. Musical Instruments

-- ============================================
-- 3. Count Check
-- ============================================
SELECT 
  'Total Categories' as metric,
  COUNT(*) as count
FROM categories
WHERE slug = 'toys-and-models' 
   OR parent_id = (SELECT id FROM categories WHERE slug = 'toys-and-models');

-- Should return: count = 12 (1 main + 11 subcategories)

-- ============================================
-- 4. Detailed Subcategory List
-- ============================================
SELECT 
  c.sort_order,
  c.name,
  c.slug,
  c.icon,
  c.active_listing_count,
  p.name as parent_category
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
WHERE c.parent_id = (SELECT id FROM categories WHERE slug = 'toys-and-models')
ORDER BY c.sort_order;

-- ============================================
-- 5. Check for Any Listings (Post-Deployment)
-- ============================================
SELECT 
  c.name as category_name,
  COUNT(l.id) as listing_count,
  COUNT(CASE WHEN l.status = 'live' THEN 1 END) as live_listings
FROM categories c
LEFT JOIN listings l ON l.category_id = c.id
WHERE c.slug = 'toys-and-models' 
   OR c.parent_id = (SELECT id FROM categories WHERE slug = 'toys-and-models')
GROUP BY c.name, c.sort_order
ORDER BY c.sort_order;

-- ============================================
-- 6. All Main Categories (to see sort order)
-- ============================================
SELECT 
  sort_order,
  name,
  slug,
  icon,
  active_listing_count
FROM categories
WHERE parent_id IS NULL
ORDER BY sort_order;

-- Should show:
-- 1. Kids
-- 2. Bikes
-- 3. Home & Garden
-- 4. Vehicles
-- 5. Sports
-- 6. Toys & Models (NEW!)

-- ============================================
-- 7. Check Migration Record
-- ============================================
SELECT 
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '%045%'
ORDER BY executed_at DESC
LIMIT 5;

-- Should show the migration was executed

-- ============================================
-- EXPECTED RESULTS SUMMARY
-- ============================================
-- ✅ Main category created: Toys & Models
-- ✅ 11 subcategories created
-- ✅ Sort order is 6 (after Sports)
-- ✅ Icon is 🧸
-- ✅ All slugs are unique
-- ✅ Migration record exists

