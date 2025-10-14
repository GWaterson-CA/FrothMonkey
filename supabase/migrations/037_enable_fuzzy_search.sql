-- Migration: Enable fuzzy search with trigram matching for better spelling tolerance
-- This allows searches like "Leg" to find "Lego" and handles minor spelling mistakes

-- Enable the pg_trgm extension for trigram matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index on listings.title for faster trigram searches
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON listings USING gin (title gin_trgm_ops);

-- Create GIN index on listings.description for faster trigram searches
CREATE INDEX IF NOT EXISTS idx_listings_description_trgm ON listings USING gin (description gin_trgm_ops);

-- Create a function to search listings with fuzzy matching
-- This function uses similarity scoring to find partial and misspelled matches
CREATE OR REPLACE FUNCTION search_listings_fuzzy(
    search_term TEXT,
    similarity_threshold REAL DEFAULT 0.3
)
RETURNS TABLE (
    listing_id UUID,
    title TEXT,
    description TEXT,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id as listing_id,
        l.title,
        l.description,
        GREATEST(
            similarity(l.title, search_term),
            similarity(COALESCE(l.description, ''), search_term)
        ) as similarity_score
    FROM listings l
    WHERE 
        -- Use both ILIKE for simple partial matches and similarity for fuzzy matches
        l.title ILIKE '%' || search_term || '%'
        OR l.description ILIKE '%' || search_term || '%'
        OR similarity(l.title, search_term) > similarity_threshold
        OR similarity(COALESCE(l.description, ''), search_term) > similarity_threshold
    ORDER BY similarity_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION search_listings_fuzzy(TEXT, REAL) TO authenticated;
GRANT EXECUTE ON FUNCTION search_listings_fuzzy(TEXT, REAL) TO anon;

-- Note: The application code can now use this function for fuzzy search,
-- or continue using ILIKE for simpler partial matching as implemented in the component

