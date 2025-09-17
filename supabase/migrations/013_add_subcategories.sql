-- Add subcategory support to categories table
-- This migration adds parent_id to allow for hierarchical categories
-- This migration is SAFE to run multiple times (idempotent)

-- Add parent_id column to categories table for subcategory support
ALTER TABLE categories ADD COLUMN parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;

-- Create index for parent_id lookups
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Update RLS policy for categories to include subcategories
DROP POLICY IF EXISTS "categories_public_read" ON categories;
CREATE POLICY "categories_public_read" ON categories
    FOR SELECT USING (true);

-- Update existing categories: rename 'Kids Toys' to 'Kids' (if it still exists)
UPDATE categories SET name = 'Kids', slug = 'kids' WHERE name = 'Kids Toys';

-- Add Sports category only if it doesn't exist
INSERT INTO categories (name, slug, sort_order) 
SELECT 'Sports', 'sports', 5
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'sports');

-- Now add subcategories for each main category (only if they don't exist)
-- Kids subcategories
INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Clothes', 'clothes', id, 1 FROM categories WHERE slug = 'kids'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'clothes');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Outdoor & Sports Toys', 'outdoor-sports-toys', id, 2 FROM categories WHERE slug = 'kids'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'outdoor-sports-toys');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Building & STEM', 'building-stem', id, 3 FROM categories WHERE slug = 'kids'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'building-stem');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Games & Puzzles', 'games-puzzles', id, 4 FROM categories WHERE slug = 'kids'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'games-puzzles');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Arts & Crafts', 'arts-crafts', id, 5 FROM categories WHERE slug = 'kids'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'arts-crafts');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Dolls & Figures', 'dolls-figures', id, 6 FROM categories WHERE slug = 'kids'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'dolls-figures');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Books for Kids', 'books-for-kids', id, 7 FROM categories WHERE slug = 'kids'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'books-for-kids');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Kids Other', 'kids-other', id, 8 FROM categories WHERE slug = 'kids'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'kids-other');

-- Bikes subcategories
INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Mountain Bikes', 'mountain-bikes', id, 1 FROM categories WHERE slug = 'bikes'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'mountain-bikes');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'E-Bikes', 'e-bikes', id, 2 FROM categories WHERE slug = 'bikes'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'e-bikes');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Gravel/CX', 'gravel-cx', id, 3 FROM categories WHERE slug = 'bikes'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'gravel-cx');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Road', 'road', id, 4 FROM categories WHERE slug = 'bikes'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'road');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Commuter/Hybrid', 'commuter-hybrid', id, 5 FROM categories WHERE slug = 'bikes'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'commuter-hybrid');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Dirt Jump', 'dirt-jump', id, 6 FROM categories WHERE slug = 'bikes'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'dirt-jump');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Kids Bikes', 'kids-bikes', id, 7 FROM categories WHERE slug = 'bikes'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'kids-bikes');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Frames & Parts', 'frames-parts', id, 8 FROM categories WHERE slug = 'bikes'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'frames-parts');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Bike Wheels & Tires', 'bikes-wheels-tires', id, 9 FROM categories WHERE slug = 'bikes'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'bikes-wheels-tires');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Helmets & Protective Gear', 'helmets-protective-gear', id, 10 FROM categories WHERE slug = 'bikes'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'helmets-protective-gear');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Bikes Other', 'bikes-other', id, 11 FROM categories WHERE slug = 'bikes'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'bikes-other');

-- Home & Garden subcategories
INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Outdoor Furniture', 'outdoor-furniture', id, 1 FROM categories WHERE slug = 'home-and-garden'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'outdoor-furniture');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'BBQs & Outdoor Cooking', 'bbqs-outdoor-cooking', id, 2 FROM categories WHERE slug = 'home-and-garden'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'bbqs-outdoor-cooking');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Tools', 'tools', id, 3 FROM categories WHERE slug = 'home-and-garden'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'tools');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Materials', 'materials', id, 4 FROM categories WHERE slug = 'home-and-garden'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'materials');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Appliances', 'appliances', id, 5 FROM categories WHERE slug = 'home-and-garden'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'appliances');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Home Improvement', 'home-improvement', id, 6 FROM categories WHERE slug = 'home-and-garden'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'home-improvement');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Decor & Lighting', 'decor-lighting', id, 7 FROM categories WHERE slug = 'home-and-garden'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'decor-lighting');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Free/Salvage', 'free-salvage', id, 8 FROM categories WHERE slug = 'home-and-garden'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'free-salvage');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Home & Garden Other', 'home-garden-other', id, 9 FROM categories WHERE slug = 'home-and-garden'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'home-garden-other');

-- Vehicles subcategories
INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Cars', 'cars', id, 1 FROM categories WHERE slug = 'vehicles'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'cars');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'SUVs & Trucks', 'suvs-trucks', id, 2 FROM categories WHERE slug = 'vehicles'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'suvs-trucks');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Commercial Vehicles', 'commercial-vehicles', id, 3 FROM categories WHERE slug = 'vehicles'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'commercial-vehicles');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Motorcycles & Dirtbikes', 'motorcycles-dirtbikes', id, 4 FROM categories WHERE slug = 'vehicles'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'motorcycles-dirtbikes');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'ATVs', 'atvs', id, 5 FROM categories WHERE slug = 'vehicles'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'atvs');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'UTVs', 'utvs', id, 6 FROM categories WHERE slug = 'vehicles'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'utvs');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Snowmobiles', 'snowmobiles', id, 7 FROM categories WHERE slug = 'vehicles'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'snowmobiles');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'RVs & Campers', 'rvs-campers', id, 8 FROM categories WHERE slug = 'vehicles'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'rvs-campers');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Trailers', 'trailers', id, 9 FROM categories WHERE slug = 'vehicles'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'trailers');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Boats & Watercraft', 'boats-watercraft', id, 10 FROM categories WHERE slug = 'vehicles'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'boats-watercraft');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Vehicle Wheels & Tires', 'vehicles-wheels-tires', id, 11 FROM categories WHERE slug = 'vehicles'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'vehicles-wheels-tires');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Parts & Accessories', 'parts-accessories', id, 12 FROM categories WHERE slug = 'vehicles'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'parts-accessories');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Vehicles Other', 'vehicles-other', id, 13 FROM categories WHERE slug = 'vehicles'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'vehicles-other');

-- Sports subcategories
INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Kiteboarding Wings & Windsurf', 'kiteboarding-windsurf', id, 1 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'kiteboarding-windsurf');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Rockclimbing', 'rockclimbing', id, 2 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'rockclimbing');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Snowboard & Ski', 'snowboard-ski', id, 3 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'snowboard-ski');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Camping', 'camping', id, 4 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'camping');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Hiking', 'hiking', id, 5 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'hiking');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Paragliding', 'paragliding', id, 6 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'paragliding');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'SUP & Kayak', 'sup-kayak', id, 7 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'sup-kayak');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Fishing', 'fishing', id, 8 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'fishing');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Golf', 'golf', id, 9 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'golf');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Ice Hockey', 'ice-hockey', id, 10 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'ice-hockey');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Running', 'running', id, 11 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'running');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Swimming', 'swimming', id, 12 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'swimming');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Soccer', 'soccer', id, 13 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'soccer');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Baseball', 'baseball', id, 14 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'baseball');

INSERT INTO categories (name, slug, parent_id, sort_order) 
SELECT 'Sports Other', 'sports-other', id, 15 FROM categories WHERE slug = 'sports'
AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'sports-other');
