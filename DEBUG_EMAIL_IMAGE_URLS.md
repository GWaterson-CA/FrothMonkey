# Debugging Email Image URLs - v2.8.3

## Issue Fixed

**Problem**: Image URLs were pointing to `frothmonkey.com/storage/...` which resulted in 404 errors.

**Root Cause**: The helper function was using `appUrl` (frothmonkey.com) instead of `supabaseUrl` for Supabase Storage paths.

**Solution**: Updated to use correct Supabase Storage URL format:
```
https://[project].supabase.co/storage/v1/object/public/listing-images/[path]
```

---

## Enhanced Debugging

### New Debug Logging
The function now logs **every step** of URL transformation with `[IMAGE URL DEBUG]` prefix:

```typescript
[IMAGE URL DEBUG] Original URL: [what's in the database]
[IMAGE URL DEBUG] Decoded from Next.js optimizer: [after decoding]
[IMAGE URL DEBUG] Constructed Supabase URL: [final URL]
✅ Final email image URL: [what goes in the email]
```

---

## How to Test & Debug

### Step 1: Deploy the Updated Function
```bash
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"
supabase functions deploy send-notification-emails
```

### Step 2: Send a Test Email
Either:
- **Admin interface**: https://frothmonkey.com/admin/email-test
- **Real trigger**: Place a bid and get outbid

### Step 3: Watch the Logs
```bash
supabase functions logs send-notification-emails --tail
```

You'll see output like:
```
[IMAGE URL DEBUG] Original URL: /_next/image?url=%2F[encoded-path]&w=384&q=75
[IMAGE URL DEBUG] Decoded from Next.js optimizer: /storage/v1/object/public/listing-images/[uuid].jpg
[IMAGE URL DEBUG] Constructed Supabase URL: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/[uuid].jpg
✅ Final email image URL: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/[uuid].jpg
```

### Step 4: Test the URLs
1. **Copy the final URL** from the logs
2. **Paste in browser** to verify it loads
3. **Check your email** - image should display

---

## URL Format Reference

### Correct Supabase Storage URL
```
https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/[listing-uuid]/[image-uuid].jpg
```

**Example**:
```
https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43f1-89ab-123456789abc.jpg
```

### Wrong URLs (What We Fixed)
❌ `https://frothmonkey.com/storage/v1/object/public/listings/...`  
❌ `https://frothmonkey.com/storage/v1/object/public/listing-images/...`  
❌ `/_next/image?url=%2F...` (can't use in emails)

---

## Testing Checklist

After deploying, verify:

### ✅ URL Construction
- [ ] Logs show original URL from database
- [ ] Logs show decoded URL (if Next.js optimizer)
- [ ] Logs show final Supabase URL
- [ ] Final URL uses `ysoxcftclnlmvxuopdun.supabase.co`
- [ ] Final URL includes `/storage/v1/object/public/listing-images/`

### ✅ URL Accessibility
- [ ] Copy final URL from logs
- [ ] Paste in browser - image loads ✅
- [ ] No 404 error
- [ ] Image is the correct listing image

### ✅ Email Display
- [ ] Receive test email
- [ ] Image displays (no broken icon)
- [ ] Image is correct listing image
- [ ] Image scales properly on mobile

---

## Debug Commands

### View Recent Logs
```bash
# Last 100 lines
supabase functions logs send-notification-emails --limit 100

# Real-time tail
supabase functions logs send-notification-emails --tail

# Filter for image debug logs only
supabase functions logs send-notification-emails --tail | grep "IMAGE URL DEBUG"
```

### Check Specific Listing
```sql
-- See what's stored in database
SELECT id, title, cover_image_url 
FROM listings 
WHERE id = '[listing-id]';
```

### Test Storage Bucket Access
```bash
# Replace with actual path from database
curl -I "https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/[uuid]/[uuid].jpg"

# Should return:
# HTTP/2 200 OK
# content-type: image/jpeg
```

---

## Common Scenarios & Expected Logs

### Scenario 1: Next.js Optimizer URL in Database

**Database**:
```
/_next/image?url=%2Fstorage%2Fv1%2Fobject%2Fpublic%2Flisting-images%2F123%2F456.jpg&w=384&q=75
```

**Logs**:
```
[IMAGE URL DEBUG] Original URL: /_next/image?url=%2Fstorage%2Fv1%2Fobject%2Fpublic%2Flisting-images%2F123%2F456.jpg&w=384&q=75
[IMAGE URL DEBUG] Decoded from Next.js optimizer: /storage/v1/object/public/listing-images/123/456.jpg
[IMAGE URL DEBUG] Constructed Supabase URL: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/123/456.jpg
✅ Final email image URL: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/123/456.jpg
```

**Result**: ✅ Image loads

---

### Scenario 2: Direct Supabase URL in Database

**Database**:
```
https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/123/456.jpg
```

**Logs**:
```
[IMAGE URL DEBUG] Original URL: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/123/456.jpg
[IMAGE URL DEBUG] Full URL: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/123/456.jpg
✅ Final email image URL: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/123/456.jpg
```

**Result**: ✅ Image loads

---

### Scenario 3: Relative Storage Path in Database

**Database**:
```
/storage/v1/object/public/listing-images/123/456.jpg
```

**Logs**:
```
[IMAGE URL DEBUG] Original URL: /storage/v1/object/public/listing-images/123/456.jpg
[IMAGE URL DEBUG] Supabase storage path: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/123/456.jpg
✅ Final email image URL: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/123/456.jpg
```

**Result**: ✅ Image loads

---

### Scenario 4: Simple Relative Path (Just UUID)

**Database**:
```
123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43f1-89ab-123456789abc.jpg
```

**Logs**:
```
[IMAGE URL DEBUG] Original URL: 123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43f1-89ab-123456789abc.jpg
[IMAGE URL DEBUG] Relative path converted: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43f1-89ab-123456789abc.jpg
✅ Final email image URL: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43f1-89ab-123456789abc.jpg
```

**Result**: ✅ Image loads

---

### Scenario 5: Null or Missing Image

**Database**:
```
null
```

**Logs**:
```
[IMAGE URL DEBUG] Original URL: null
[IMAGE URL DEBUG] No URL provided, using placeholder
✅ Final email image URL: https://frothmonkey.com/placeholder-image.jpg
```

**Result**: ✅ Placeholder image loads

---

## Troubleshooting

### Images Still Don't Load

#### 1. Check the Final URL in Logs
```bash
supabase functions logs send-notification-emails --tail | grep "✅ Final"
```

Copy the URL and test in browser. Does it load?

#### 2. Check Storage Bucket Permissions
```bash
# In Supabase Dashboard:
# Storage → listing-images → Settings → Public bucket: ON
```

Or via CLI:
```bash
supabase storage ls listing-images --limit 5
```

#### 3. Verify Supabase URL
Check that `SUPABASE_URL` is correct:
```bash
# In Supabase Dashboard:
# Settings → API → Project URL
# Should be: https://ysoxcftclnlmvxuopdun.supabase.co
```

#### 4. Test Direct Storage Access
```bash
# Try accessing a known image
curl -I "https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/[your-listing-id]/[your-image-id].jpg"
```

Expected response:
```
HTTP/2 200
content-type: image/jpeg
```

#### 5. Check Database Values
```sql
SELECT 
  id,
  title,
  cover_image_url,
  LENGTH(cover_image_url) as url_length
FROM listings 
WHERE cover_image_url IS NOT NULL
LIMIT 5;
```

---

## Quick Test Script

Create a test to verify URL transformation:

```bash
#!/bin/bash
# test-image-urls.sh

echo "Testing image URL transformation..."
echo ""

# Test Next.js optimizer URL
echo "Test 1: Next.js optimizer URL"
TEST_URL="/_next/image?url=%2Fstorage%2Fv1%2Fobject%2Fpublic%2Flisting-images%2Ftest.jpg"
echo "Input: $TEST_URL"
echo "Expected output: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/test.jpg"
echo ""

# Send test notification and watch logs
supabase functions logs send-notification-emails --limit 50 | grep "IMAGE URL DEBUG"
```

---

## What to Look For

### ✅ Good Signs
- Logs show all debug steps
- Final URL uses `ysoxcftclnlmvxuopdun.supabase.co`
- URL includes `/storage/v1/object/public/listing-images/`
- URL loads in browser
- Image displays in email

### ❌ Bad Signs
- Final URL still uses `frothmonkey.com/storage/...`
- URL returns 404 in browser
- Logs show errors during URL parsing
- Image shows as broken in email

---

## Performance Impact

- **Minimal**: Only runs once per email
- **Logging**: Can be removed after debugging
- **Caching**: URLs are constructed on-demand

### Remove Debug Logs (Optional)
Once everything works, you can remove the debug logs:
```typescript
// Comment out or remove these lines:
console.log(`[IMAGE URL DEBUG] ...`)
```

Keep this one:
```typescript
console.log(`✅ Final email image URL: ${listingImage}`)
```

---

## Expected Results After Fix

### Before (v2.8.2)
```
URL in email: https://frothmonkey.com/storage/v1/object/public/listings/...
Result: 404 error ❌
```

### After (v2.8.3)
```
URL in email: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/...
Result: Image loads ✅
```

---

## Next Steps

1. **Deploy** the updated function
2. **Send test email** (admin interface or real trigger)
3. **Watch logs** for debug output
4. **Copy final URL** from logs
5. **Test in browser** to verify it loads
6. **Check email** to confirm image displays

---

## Support

If images still don't load after following these steps:

1. **Share the logs**: Copy the `[IMAGE URL DEBUG]` output
2. **Test the URL**: Try accessing it directly in browser
3. **Check database**: Share what's stored in `cover_image_url`
4. **Verify bucket**: Confirm `listing-images` bucket is public

---

**Status**: ✅ Fixed & Pushed to GitHub  
**Version**: 2.8.3  
**Commit**: `f30ea54`  
**Ready to Deploy**: Yes

---

## Deploy Command
```bash
supabase functions deploy send-notification-emails
```

## Monitor Command
```bash
supabase functions logs send-notification-emails --tail | grep -E "(IMAGE URL DEBUG|Final email)"
```

---

Now you can see exactly what URLs are being generated and test them! 🔍

