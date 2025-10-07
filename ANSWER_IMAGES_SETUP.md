# Answer Images Feature - Setup Guide

This guide explains how to enable and use the new image upload functionality for Q&A answers.

## What's New

Sellers can now attach images when answering questions on their listings. Any images uploaded will:
1. Be displayed with the answer in the Q&A section
2. Automatically be added to the listing's image gallery

## Database Migration

Apply the migration to add the `answer_images` column to your database:

```sql
-- Migration: 027_add_answer_images.sql
-- Add answer_images column to auction_questions table

ALTER TABLE auction_questions 
ADD COLUMN answer_images TEXT[] DEFAULT NULL;

CREATE INDEX idx_auction_questions_with_images ON auction_questions(listing_id) 
WHERE answer_images IS NOT NULL;

COMMENT ON COLUMN auction_questions.answer_images IS 'Array of image paths stored in Supabase storage that are attached to the answer';
```

### How to Apply

**Option 1: Using Supabase CLI**
```bash
npx supabase db push
```

**Option 2: Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration SQL from `supabase/migrations/027_add_answer_images.sql`
4. Run the query

**Option 3: Direct SQL Execution**
```bash
psql -h your-db-host -U postgres -d your-db-name -f supabase/migrations/027_add_answer_images.sql
```

## Features

### For Sellers
- When answering a question, click "Answer" button
- Type your answer text
- Optionally upload up to 5 images
- Images are automatically compressed to 800px for optimal performance
- All uploaded images are added to the listing's image gallery

### For Buyers
- View answered questions with attached images
- Images are displayed in a responsive grid below the answer text
- Click images to view them in full size (via the listing gallery)

## Technical Details

### Files Modified
1. **Database Migration**: `supabase/migrations/027_add_answer_images.sql`
2. **Database Types**: `lib/database.types.ts` - Added `answer_images` field
3. **New Component**: `components/answer-image-upload.tsx` - Compact image uploader for answers
4. **Updated Component**: `components/auction-questions.tsx` - Integrated image upload and display
5. **API Endpoint**: `app/api/questions/[id]/answer/route.ts` - Handles image paths and adds to listing

### Image Storage
- Images are stored in the existing `listing-images` Supabase storage bucket
- Uses the same compression and optimization as listing images (800px max, JPEG format)
- Image paths are stored in the `answer_images` column as a PostgreSQL TEXT[] array
- Images are also inserted into the `listing_images` table for inclusion in the main gallery

### API Changes
The answer endpoint now accepts an optional `image_paths` parameter:

```typescript
// POST /api/questions/[id]/answer
{
  "answer": "Your answer text",
  "image_paths": ["path/to/image1.jpg", "path/to/image2.jpg"] // optional
}
```

## Usage Example

1. Navigate to a listing you own
2. Scroll to the Q&A section
3. Click "Answer" on any pending question
4. Type your answer
5. Click the image upload area or drag images to add them
6. Images will be compressed and uploaded automatically
7. Click "Post Answer" to publish

## Troubleshooting

### Images not uploading
- Ensure the listing owner has permission to upload to the `listing-images` bucket
- Check that the image files are valid (JPEG, PNG, WebP, or GIF)
- Verify the file size is under 5MB (will be compressed automatically)

### Images not appearing in listing gallery
- The API automatically adds images to `listing_images` table
- Check the `sort_order` is set correctly (continues from existing images)
- Verify no database errors in the server logs

### Database migration fails
- If you get permission errors, ensure you're connected as a superuser
- The migration is safe to run multiple times (it will fail if column already exists)

## Future Enhancements

Potential improvements for future releases:
- Allow image deletion/editing after posting
- Add lightbox/modal for full-size image viewing
- Support video attachments
- Image compression settings per user preference

