-- Verification script to see alphabetical category sorting
-- Run this to confirm categories will appear in the correct order

-- ============================================
-- 1. Main Categories (Alphabetical Order)
-- ============================================
SELECT 
  '✅ Main Categories (A-Z)' as check_type,
  name,
  slug,
  icon,
  active_listing_count
FROM categories
WHERE parent_id IS NULL
ORDER BY name ASC;

-- Expected order:
-- Bikes
-- Home & Garden
-- Kids
-- Sports
-- Toys & Models
-- Vehicles

-- ============================================
-- 2. Toys & Models Subcategories (A-Z)
-- ============================================
SELECT 
  '✅ Toys & Models Subcategories (A-Z)' as check_type,
  name,
  slug,
  active_listing_count
FROM categories 
WHERE parent_id = (SELECT id FROM categories WHERE slug = 'toys-and-models')
ORDER BY name ASC;

-- Expected order:
-- 1. Bath Toys
-- 2. Dolls
-- 3. Games & Puzzles
-- 4. Lego & Building Toys
-- 5. Models
-- 6. Musical Instruments
-- 7. Outdoor Toys & Trampolines
-- 8. Radio Control & Robots
-- 9. Ride-On Toys
-- 10. Vintage
-- 11. Wooden

-- ============================================
-- 3. All Categories with Subcategories (A-Z)
-- ============================================
SELECT 
  CASE 
    WHEN c.parent_id IS NULL THEN '📁 ' || c.name
    ELSE '   └─ ' || c.name
  END as category_hierarchy,
  c.slug,
  c.active_listing_count,
  CASE 
    WHEN c.parent_id IS NULL THEN c.name
    ELSE p.name
  END as sort_by_parent
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
ORDER BY 
  CASE WHEN c.parent_id IS NULL THEN c.name ELSE p.name END,
  CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END,
  c.name;

-- ============================================
-- 4. Kids Subcategories (for comparison)
-- ============================================
SELECT 
  '✅ Kids Subcategories (A-Z)' as check_type,
  name,
  slug
FROM categories 
WHERE parent_id = (SELECT id FROM categories WHERE slug = 'kids')
ORDER BY name ASC;

-- ============================================
-- 5. Bikes Subcategories (for comparison)
-- ============================================
SELECT 
  '✅ Bikes Subcategories (A-Z)' as check_type,
  name,
  slug
FROM categories 
WHERE parent_id = (SELECT id FROM categories WHERE slug = 'bikes')
ORDER BY name ASC;

-- ============================================
-- 6. Count Check
-- ============================================
SELECT 
  'Total Main Categories' as metric,
  COUNT(*) as count
FROM categories
WHERE parent_id IS NULL;

SELECT 
  'Total Subcategories' as metric,
  COUNT(*) as count
FROM categories
WHERE parent_id IS NOT NULL;

-- ============================================
-- 7. Alphabetical Sort Test
-- ============================================
-- This shows which categories would come first/last
SELECT 
  '🔤 First and Last Categories' as info,
  'First Main Category' as position,
  name,
  slug
FROM categories
WHERE parent_id IS NULL
ORDER BY name ASC
LIMIT 1;

SELECT 
  '🔤 First and Last Categories' as info,
  'Last Main Category' as position,
  name,
  slug
FROM categories
WHERE parent_id IS NULL
ORDER BY name DESC
LIMIT 1;

-- ============================================
-- EXPECTED RESULTS SUMMARY
-- ============================================
-- ✅ Main categories sorted A-Z (Bikes → Vehicles)
-- ✅ All subcategories sorted A-Z within their parent
-- ✅ Toys & Models subcategories: Bath Toys first, Wooden last
-- ✅ Consistent alphabetical ordering across all categories

