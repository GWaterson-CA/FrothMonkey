# Fix Storage 404 Errors - Image URLs Not Working

## Problem

Getting **404 "Object not found"** when trying to access image URLs like:
```
https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/[uuid]/[uuid].jpg
```

## Root Cause

The bucket `listing-images` exists in your migrations, but there are several possible issues:

1. ❌ Bucket doesn't exist in production (migration not run)
2. ❌ Bucket is NOT marked as public
3. ❌ No actual images have been uploaded yet
4. ❌ Images stored with different path structure

---

## Step 1: Check If Bucket Exists & Is Public

### Via Supabase Dashboard

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/ysoxcftclnlmvxuopdun
2. **Navigate to**: Storage (left sidebar)
3. **Check for** `listing-images` bucket
4. **If exists**: Click on bucket → Settings → Check if "Public bucket" is enabled

### Via SQL Editor

Run this in Supabase SQL Editor:

```sql
-- Check if bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'listing-images';
```

**Expected Result**:
```
id    | name            | public | file_size_limit | allowed_mime_types
------|-----------------|--------|-----------------|--------------------
...   | listing-images  | true   | 52428800        | {image/jpeg,...}
```

**If no results**: Bucket doesn't exist - see Step 2  
**If public = false**: Bucket isn't public - see Step 3

---

## Step 2: Create & Configure Bucket (If Missing)

If the bucket doesn't exist, run the migration:

```sql
-- Create the listing-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'listing-images',
    'listing-images',
    true,  -- PUBLIC = true (important!)
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Allow public access
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'listing-images');

-- Allow authenticated users to upload
CREATE POLICY "Users can upload images to own listings" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'listing-images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM listings WHERE owner_id = auth.uid()
        )
    );
```

---

## Step 3: Make Bucket Public (If It Exists But Is Private)

### Via Dashboard
1. **Go to**: Storage → listing-images
2. **Click**: Configuration/Settings
3. **Enable**: "Public bucket" toggle
4. **Save** changes

### Via SQL
```sql
-- Make bucket public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'listing-images';
```

---

## Step 4: Check What's Actually in the Database

Run this SQL to see what image URLs are stored:

```sql
-- See actual URLs in database
SELECT 
  l.id,
  l.title,
  l.cover_image_url,
  CASE 
    WHEN l.cover_image_url IS NULL THEN '❌ NULL - No image'
    WHEN l.cover_image_url LIKE 'http%' THEN '✅ Full URL'
    WHEN l.cover_image_url LIKE '/_next%' THEN '⚠️ Next.js optimizer'
    WHEN l.cover_image_url LIKE '/storage%' THEN '⚠️ Relative storage path'
    ELSE '⚠️ Other format'
  END as url_type,
  LENGTH(l.cover_image_url) as url_length
FROM listings l
WHERE l.cover_image_url IS NOT NULL
ORDER BY l.created_at DESC
LIMIT 10;
```

### What to Look For:

**Good signs** ✅:
- URLs that start with `https://ysoxcftclnlmvxuopdun.supabase.co/storage/...`
- URLs in format: `[uuid]/[uuid].jpg`

**Problem signs** ⚠️:
- NULL values (no image uploaded)
- `/_next/image` URLs (these need to be converted)
- Relative paths like `/storage/...` (need full domain)

---

## Step 5: Check If Any Files Exist in Storage

### Via Dashboard
1. **Go to**: Storage → listing-images
2. **Browse** the files
3. **Look for**: folders with UUID names
4. **Click** on a file to get its public URL
5. **Test** that URL in browser

### Via SQL
```sql
-- Check how many objects are in the bucket
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(
    COALESCE(
      (metadata->>'size')::bigint, 
      0
    )
  )) as total_size
FROM storage.objects
WHERE bucket_id = 'listing-images'
GROUP BY bucket_id;
```

**Expected**: Should show file count > 0 if images have been uploaded

---

## Step 6: Test Upload Process

Try uploading an image to verify the bucket works:

### Via Dashboard
1. **Go to**: Storage → listing-images
2. **Click**: "Upload file"
3. **Select** an image
4. **Upload** it
5. **Click** on the uploaded file
6. **Copy** the public URL
7. **Test** URL in browser - should load ✅

### Expected URL Format
After upload, URL should be:
```
https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/[filename].jpg
```

If this works but listing images don't, the issue is with **how listing images are being uploaded**.

---

## Step 7: Check Image Upload Code

Your upload API is at: `app/api/upload/route.ts`

Let's verify it's using the correct bucket:

```typescript
// Should be:
const { data, error } = await supabase.storage
  .from('listing-images')  // ✅ Correct bucket name
  .createSignedUploadUrl(uniqueFileName, {
    upsert: true,
  })
```

---

## Step 8: Check Listing Creation/Edit Forms

Check how listings save the image URL:

```sql
-- See what's being saved in cover_image_url
SELECT 
  id,
  title,
  cover_image_url as stored_url,
  -- Try to construct what it should be:
  CASE 
    WHEN cover_image_url LIKE 'http%' THEN cover_image_url
    WHEN cover_image_url LIKE '/%' THEN 'https://ysoxcftclnlmvxuopdun.supabase.co' || cover_image_url
    ELSE 'https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/' || cover_image_url
  END as should_be_url
FROM listings
WHERE cover_image_url IS NOT NULL
LIMIT 5;
```

Copy the `should_be_url` values and test them in browser.

---

## Step 9: Common Fixes

### Fix 1: If Bucket Doesn't Exist
Run the migration file:
```bash
# In Supabase Dashboard → SQL Editor
# Copy and run: supabase/migrations/002_storage_setup.sql
```

### Fix 2: If Bucket Isn't Public
```sql
UPDATE storage.buckets 
SET public = true 
WHERE name = 'listing-images';
```

### Fix 3: If No Images Exist
- Create a test listing
- Upload an image through the UI
- Check if it appears in Storage → listing-images
- Test the public URL

### Fix 4: If URLs Are Wrong Format
Update the email function to handle your actual URL format. Share:
- What's in `cover_image_url` column
- What format you need in emails

---

## Step 10: Test the Email Function After Fixing

Once storage is working:

1. **Deploy** updated function:
```bash
supabase functions deploy send-notification-emails
```

2. **Send test email**: https://frothmonkey.com/admin/email-test

3. **Watch logs**:
```bash
# In Supabase Dashboard → Functions → send-notification-emails → Logs
```

4. **Check for**:
```
[IMAGE URL DEBUG] Original URL: [what's in DB]
✅ Final email image URL: [what goes in email]
```

5. **Copy final URL** and test in browser

---

## Quick Diagnostic Checklist

Run these in order and share the results:

### ✅ Checklist

```sql
-- 1. Does bucket exist?
SELECT name, public FROM storage.buckets WHERE name = 'listing-images';
-- Expected: 1 row with public = true

-- 2. How many files in bucket?
SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'listing-images';
-- Expected: > 0 if images uploaded

-- 3. What URLs are in database?
SELECT id, LEFT(cover_image_url, 100) as url_sample 
FROM listings 
WHERE cover_image_url IS NOT NULL 
LIMIT 3;
-- Expected: Valid URLs or paths

-- 4. Can we construct valid URLs?
SELECT 
  'https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/' || name as constructed_url
FROM storage.objects 
WHERE bucket_id = 'listing-images'
LIMIT 1;
-- Copy this URL and test in browser
```

---

## Most Likely Issues

Based on the 404 error, the most likely causes are:

### Issue #1: Bucket Not Public (Most Common)
**Symptom**: 404 on all storage URLs  
**Fix**: Make bucket public via Dashboard or SQL  
**Test**: Try accessing any file in the bucket

### Issue #2: No Files Uploaded Yet
**Symptom**: Bucket exists but empty  
**Fix**: Upload a test image  
**Test**: Browse bucket in Dashboard

### Issue #3: Wrong URL Format in Database
**Symptom**: Database has relative paths  
**Fix**: Helper function should convert them  
**Test**: Check logs to see conversion

### Issue #4: Images Stored in Different Bucket
**Symptom**: Files exist but in wrong bucket  
**Fix**: Check all buckets, update bucket name  
**Test**: List all buckets and check contents

---

## Share These Results

To help debug further, please share:

1. **Bucket status**:
```sql
SELECT * FROM storage.buckets;
```

2. **Sample URLs from database**:
```sql
SELECT id, cover_image_url FROM listings WHERE cover_image_url IS NOT NULL LIMIT 3;
```

3. **Files in bucket**:
```sql
SELECT name, bucket_id, created_at FROM storage.objects LIMIT 5;
```

4. **Screenshot of**: Storage section in Supabase Dashboard

---

## After Everything Works

Once you can access storage URLs directly in browser:

1. ✅ **Deploy** the email function
2. ✅ **Send test email**
3. ✅ **Verify** image loads in email
4. ✅ **Test** on mobile devices

---

## Quick Fix Commands

```sql
-- Quick fix: Make bucket public if it exists
UPDATE storage.buckets SET public = true WHERE name = 'listing-images';

-- Quick check: See what's in the bucket
SELECT bucket_id, name FROM storage.objects WHERE bucket_id = 'listing-images' LIMIT 5;

-- Quick test: Get a real URL to test
SELECT 'https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/' || name 
FROM storage.objects 
WHERE bucket_id = 'listing-images' 
LIMIT 1;
```

---

**Next Step**: Run the diagnostic checklist SQL queries and share the results!

