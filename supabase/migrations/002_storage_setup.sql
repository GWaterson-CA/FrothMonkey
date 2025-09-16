-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'listing-images',
    'listing-images',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Storage policies for listing images
-- Public read access
CREATE POLICY "Public read access for listing images" ON storage.objects
    FOR SELECT USING (bucket_id = 'listing-images');

-- Authenticated users can upload images to their own listing folders
CREATE POLICY "Users can upload images to own listings" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'listing-images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM listings WHERE owner_id = auth.uid()
        )
    );

-- Users can update/delete images in their own listing folders
CREATE POLICY "Users can update own listing images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'listing-images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM listings WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own listing images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'listing-images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM listings WHERE owner_id = auth.uid()
        )
    );
