# Answer Images Troubleshooting Guide

## Issue: Images uploaded but not visible

### Quick Diagnosis

Run these checks to find the problem:

## Step 1: Check if Migration Was Applied

**In Supabase SQL Editor, run:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'auction_questions' AND column_name = 'answer_images';
```

**Expected Result:**
- Shows `answer_images` → Migration applied ✅
- Shows nothing → **Migration NOT applied** ❌ (most likely issue)

**If migration not applied:**
1. Open `APPLY_ANSWER_IMAGES_MIGRATION.sql`
2. Copy all the SQL
3. Run it in Supabase SQL Editor
4. Try answering with images again

---

## Step 2: Check Browser Console for Errors

1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Look for errors when you submitted the answer

**Common errors:**

### Error: "column answer_images does not exist"
**Solution:** Migration wasn't applied. See Step 1 above.

### Error: "Failed to upload file" 
**Solution:** Check:
- Image file size < 5MB
- Valid image format (JPEG, PNG, WebP, GIF)
- Supabase storage bucket is accessible

### No errors, but images not showing
**Solution:** Images uploaded but may not be passed to API. Continue to Step 3.

---

## Step 3: Check Network Tab

1. Open DevTools → Network tab
2. Answer a question with images
3. Look for request to `/api/questions/[id]/answer`
4. Click on the request
5. Check the **Payload** or **Request** tab

**What to look for:**

Should see:
```json
{
  "answer": "Your answer text",
  "image_paths": ["listing-id/image1.jpg", "listing-id/image2.jpg"]
}
```

**If `image_paths` is missing or empty:**
- The upload component bug (now fixed) prevented paths from being sent
- Refresh the page and try again with the fixed code

**If `image_paths` is present:**
- Check the **Response** tab for errors
- Continue to Step 4

---

## Step 4: Check Database Directly

**In Supabase SQL Editor, run:**
```sql
SELECT 
    id,
    answer,
    answer_images,
    answered_at
FROM auction_questions
WHERE answer IS NOT NULL
ORDER BY answered_at DESC
LIMIT 5;
```

**What to check:**

1. **answer_images column shows error:**
   - Migration not applied (go to Step 1)

2. **answer_images is NULL for your answer:**
   - API didn't receive image_paths
   - Or API failed to save them
   - Check server logs for errors

3. **answer_images has paths:**
   - ✅ Data saved correctly!
   - Problem is in the display logic
   - Continue to Step 5

---

## Step 5: Check Image Display

If data is in database but not showing:

1. **Check the component is fetching answer_images:**
   ```typescript
   // In auction-questions.tsx, the Question interface should have:
   answer_images: string[] | null
   ```

2. **Check image paths are valid:**
   - Paths should look like: `listing-id/filename.jpg`
   - Not full URLs

3. **Check getImageUrl function:**
   ```typescript
   // Should return full Supabase URL
   getImageUrl(path) 
   // → https://[project].supabase.co/storage/v1/object/public/listing-images/[path]
   ```

---

## Quick Fixes

### Fix 1: Bug in Upload Component (Already Fixed)
The upload component had a bug where paths weren't properly tracked. This is now fixed. **Refresh the page** to get the new code.

### Fix 2: Apply Migration
If migration wasn't applied:
1. Open `APPLY_ANSWER_IMAGES_MIGRATION.sql`
2. Run in Supabase SQL Editor
3. Try again

### Fix 3: Check Existing Answer
If you already answered, the images might not have been saved. To add images to an existing answer:
```sql
-- Update an existing answer with test image paths
UPDATE auction_questions
SET answer_images = ARRAY['test-listing-id/image1.jpg']
WHERE id = 'your-question-id';
```

---

## Verification Steps

After applying fixes:

1. **Refresh the browser page** (to get updated component code)
2. **Answer a new question** (don't reuse the old one)
3. **Upload 1-2 test images**
4. **Submit the answer**
5. **Check that images appear** below the answer text

---

## What I Fixed

### Bug in answer-image-upload.tsx
**Problem:** The component wasn't properly tracking uploaded image paths due to async state updates.

**Fix Applied:**
- Changed to track paths synchronously in `uploadedPaths` array
- Properly filter paths when images are removed
- Only send successfully uploaded, non-error images

**What this means for you:**
- **Refresh your browser** to get the fixed component
- Try uploading images again

---

## Most Likely Cause

Based on typical issues:

1. **90% chance:** Migration wasn't applied (no `answer_images` column)
2. **10% chance:** Upload component bug (now fixed)

**Solution:**
1. Run `CHECK_ANSWER_IMAGES_MIGRATION.sql` to verify
2. If column missing, run `APPLY_ANSWER_IMAGES_MIGRATION.sql`
3. Refresh browser
4. Try again

---

## Need More Help?

Share these details:
1. Result from CHECK_ANSWER_IMAGES_MIGRATION.sql
2. Browser console errors (if any)
3. Network tab request payload for the answer API call
4. Whether you can see the `answer_images` column in database

