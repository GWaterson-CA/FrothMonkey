-- Add icon and description fields to categories table for better browsing UX
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add a listing_count field that will be used for ordering (computed via triggers)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS active_listing_count INTEGER DEFAULT 0;

-- Create a function to update category listing counts
CREATE OR REPLACE FUNCTION update_category_listing_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update count for the category
  UPDATE categories
  SET active_listing_count = (
    SELECT COUNT(*)
    FROM listings
    WHERE listings.category_id = categories.id
    AND listings.status = 'live'
  )
  WHERE categories.id = COALESCE(NEW.category_id, OLD.category_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update counts when listings change
DROP TRIGGER IF EXISTS trigger_update_category_listing_count ON listings;
CREATE TRIGGER trigger_update_category_listing_count
AFTER INSERT OR UPDATE OR DELETE ON listings
FOR EACH ROW
EXECUTE FUNCTION update_category_listing_count();

-- Initialize counts for all categories
UPDATE categories
SET active_listing_count = (
  SELECT COUNT(*)
  FROM listings
  WHERE listings.category_id = categories.id
  AND listings.status = 'live'
);

-- Add product-suitable icons for common categories
-- These can be customized per your specific categories
UPDATE categories SET icon = '🚗' WHERE slug IN ('vehicles', 'automotive', 'cars');
UPDATE categories SET icon = '🚴' WHERE slug IN ('bikes', 'bicycles', 'cycling');
UPDATE categories SET icon = '🏠' WHERE slug IN ('real-estate', 'property');
UPDATE categories SET icon = '💻' WHERE slug IN ('electronics', 'computers', 'tech');
UPDATE categories SET icon = '📱' WHERE slug IN ('phones', 'mobile', 'smartphones');
UPDATE categories SET icon = '👕' WHERE slug IN ('fashion', 'clothing', 'apparel');
UPDATE categories SET icon = '🏡' WHERE slug IN ('home-garden', 'home', 'garden', 'home-&-garden');
UPDATE categories SET icon = '🎨' WHERE slug IN ('collectibles-art', 'art', 'collectibles');
UPDATE categories SET icon = '⚽' WHERE slug IN ('sports', 'sporting-goods', 'fitness');
UPDATE categories SET icon = '🧸' WHERE slug IN ('kids', 'toys', 'children');
UPDATE categories SET icon = '🎮' WHERE slug IN ('toys-games', 'games', 'gaming', 'video-games');
UPDATE categories SET icon = '📚' WHERE slug IN ('books', 'media', 'magazines');
UPDATE categories SET icon = '🎵' WHERE slug IN ('music', 'instruments', 'audio');
UPDATE categories SET icon = '🔧' WHERE slug IN ('tools', 'equipment', 'hardware');
UPDATE categories SET icon = '💼' WHERE slug IN ('business', 'office', 'industrial');
UPDATE categories SET icon = '🛋️' WHERE slug IN ('furniture', 'furnishings');
UPDATE categories SET icon = '💎' WHERE slug IN ('jewelry', 'watches', 'accessories');
UPDATE categories SET icon = '🐾' WHERE slug IN ('pets', 'pet-supplies', 'animals');
UPDATE categories SET icon = '🎭' WHERE slug IN ('entertainment', 'events', 'tickets');
UPDATE categories SET icon = '🏋️' WHERE slug IN ('exercise', 'gym', 'workout');
UPDATE categories SET icon = '👶' WHERE slug IN ('baby', 'nursery', 'maternity');
UPDATE categories SET icon = '🎬' WHERE slug IN ('movies', 'films', 'cinema');
UPDATE categories SET icon = '🏗️' WHERE slug IN ('building', 'construction', 'building-&-stem');
UPDATE categories SET icon = '🪆' WHERE slug IN ('dolls', 'dolls-&-figures', 'figures', 'action-figures');
UPDATE categories SET icon = '🎈' WHERE slug IN ('kids-other', 'party', 'celebration');

COMMENT ON COLUMN categories.icon IS 'Icon identifier (emoji or icon name) for category visualization';
COMMENT ON COLUMN categories.description IS 'Short description of the category for SEO and display';
COMMENT ON COLUMN categories.active_listing_count IS 'Cached count of active listings in this category';

