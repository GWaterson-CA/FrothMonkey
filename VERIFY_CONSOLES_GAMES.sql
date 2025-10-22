-- Verification script for Consoles & Games subcategory
-- Run this to verify the subcategory was added correctly

-- 1. Check if Consoles & Games subcategory exists
SELECT 
  'Consoles & Games Subcategory Check' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ NOT FOUND'
  END as status,
  COUNT(*) as count
FROM categories
WHERE slug = 'consoles-games';

-- 2. Verify parent relationship and sort order
SELECT 
  'Parent & Sort Order Check' as test_name,
  c.name,
  c.slug,
  p.name as parent_name,
  p.slug as parent_slug,
  c.sort_order,
  c.active_listing_count
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
WHERE c.slug = 'consoles-games';

-- 3. View all Toys & Models subcategories in order
SELECT 
  'All Toys & Models Subcategories' as section,
  c.sort_order,
  c.name,
  c.slug,
  c.active_listing_count
FROM categories c
WHERE c.parent_id = (SELECT id FROM categories WHERE slug = 'toys-and-models')
ORDER BY c.sort_order;

-- 4. Count total subcategories
SELECT 
  'Total Subcategories Count' as test_name,
  COUNT(*) as total_subcategories,
  CASE 
    WHEN COUNT(*) = 12 THEN '✅ CORRECT (12 subcategories including Consoles & Games)'
    ELSE '⚠️ UNEXPECTED COUNT'
  END as status
FROM categories
WHERE parent_id = (SELECT id FROM categories WHERE slug = 'toys-and-models');

-- 5. Check if there are any listings in this category yet
SELECT 
  'Listings in Consoles & Games' as section,
  COUNT(*) as listing_count,
  COUNT(CASE WHEN status = 'live' THEN 1 END) as live_listings,
  COUNT(CASE WHEN status = 'ended' THEN 1 END) as ended_listings,
  COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_listings
FROM listings
WHERE category_id = (SELECT id FROM categories WHERE slug = 'consoles-games');

