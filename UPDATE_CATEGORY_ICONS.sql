-- Update Category Icons
-- Run this to update icons for existing categories
-- This can be run multiple times safely

-- Product-suitable icons for common categories
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

-- Display updated categories
SELECT name, slug, icon FROM categories WHERE icon IS NOT NULL ORDER BY name;

