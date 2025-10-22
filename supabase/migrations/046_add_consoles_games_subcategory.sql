-- Add Consoles & Games subcategory to Toys & Models
-- This migration is SAFE to run multiple times (idempotent)

-- Add Consoles & Games subcategory
INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Consoles & Games', 'consoles-games', id, 12 FROM categories WHERE slug = 'toys-and-models'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'consoles-games');

-- Initialize active_listing_count for the new subcategory
UPDATE categories
SET active_listing_count = (
  SELECT COUNT(*)
  FROM listings
  WHERE listings.category_id = categories.id
  AND listings.status = 'live'
)
WHERE slug = 'consoles-games';

