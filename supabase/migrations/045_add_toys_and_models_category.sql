-- Add Toys & Models category with subcategories
-- This migration is SAFE to run multiple times (idempotent)

-- Add main Toys & Models category (sort_order 6 - after Sports which is 5)
INSERT INTO categories (name, slug, sort_order, icon, description) 
SELECT 'Toys & Models', 'toys-and-models', 6, '🧸', 'Everything from radio control to vintage toys and models'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'toys-and-models');

-- Add subcategories for Toys & Models
INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Radio Control & Robots', 'radio-control-robots', id, 1 FROM categories WHERE slug = 'toys-and-models'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'radio-control-robots');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Ride-On Toys', 'ride-on-toys', id, 2 FROM categories WHERE slug = 'toys-and-models'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'ride-on-toys');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Models', 'models', id, 3 FROM categories WHERE slug = 'toys-and-models'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'models');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Lego & Building Toys', 'lego-building-toys', id, 4 FROM categories WHERE slug = 'toys-and-models'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'lego-building-toys');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Games & Puzzles', 'games-puzzles-toys', id, 5 FROM categories WHERE slug = 'toys-and-models'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'games-puzzles-toys');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Outdoor Toys & Trampolines', 'outdoor-toys-trampolines', id, 6 FROM categories WHERE slug = 'toys-and-models'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'outdoor-toys-trampolines');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Wooden', 'wooden-toys', id, 7 FROM categories WHERE slug = 'toys-and-models'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'wooden-toys');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Vintage', 'vintage-toys', id, 8 FROM categories WHERE slug = 'toys-and-models'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'vintage-toys');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Dolls', 'dolls-toys', id, 9 FROM categories WHERE slug = 'toys-and-models'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'dolls-toys');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Bath Toys', 'bath-toys', id, 10 FROM categories WHERE slug = 'toys-and-models'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'bath-toys');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Musical Instruments', 'musical-instruments-toys', id, 11 FROM categories WHERE slug = 'toys-and-models'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'musical-instruments-toys');

-- Initialize active_listing_count for the new category and subcategories
UPDATE categories
SET active_listing_count = (
  SELECT COUNT(*)
  FROM listings
  WHERE listings.category_id = categories.id
  AND listings.status = 'live'
)
WHERE slug IN (
  'toys-and-models',
  'radio-control-robots',
  'ride-on-toys',
  'models',
  'lego-building-toys',
  'games-puzzles-toys',
  'outdoor-toys-trampolines',
  'wooden-toys',
  'vintage-toys',
  'dolls-toys',
  'bath-toys',
  'musical-instruments-toys'
);

