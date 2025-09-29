# Facebook Sharing Guide

This guide explains how Facebook sharing works for FrothMonkey listings and how to test/troubleshoot it.

## How It Works

When you share a listing URL on Facebook:

1. **Facebook's crawler** visits your listing page
2. It reads the **Open Graph meta tags** from the page
3. It downloads the **og:image** to display in the preview
4. It caches this data for several hours

## Image Configuration

- **Primary source**: Direct listing cover image from Supabase Storage
- **Fallback**: FrothMonkey logo if no cover image exists
- **Format**: JPEG/PNG, 1200x630px (Facebook recommended size)
- **URL**: Fully qualified absolute URL to public storage

## Testing Your Changes

### 1. Clear Facebook's Cache

Before testing, you MUST clear Facebook's cache:

1. Visit [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. Enter your listing URL: `https://frothmonkey.com/listing/[YOUR-LISTING-ID]`
3. Click **"Debug"** to see what Facebook sees
4. Click **"Scrape Again"** to force Facebook to re-fetch the metadata
5. Check for any errors or warnings

### 2. Verify the Image

In the debugger, you should see:
- ✅ Image preview displays correctly
- ✅ Title and description are present
- ✅ No errors or warnings
- ✅ Image dimensions are 1200x630 (or actual image size)

### 3. Test Sharing

After clearing the cache:
1. Copy your listing URL
2. Go to Facebook and create a new post
3. Paste the URL
4. Wait 2-3 seconds for the preview to load
5. Verify the image displays correctly

## Mobile App Integration

### Facebook App Links

The listing pages include App Links meta tags to help mobile devices:
- Open shared links in the Facebook app (when installed)
- Provide better integration between web and native apps

### Share Button Enhancements

The Share button uses:
- **Facebook Share Dialog**: `facebook.com/dialog/share` (official method)
- **WhatsApp deep links**: Opens WhatsApp app on mobile
- **Native share API**: Falls back to system share sheet on mobile

## Common Issues & Solutions

### Issue: Image Not Displaying

**Causes:**
- Facebook hasn't scraped the page yet
- Image URL is not accessible
- Image is too small (< 200x200px)
- CORS or authentication blocking Facebook's crawler

**Solutions:**
1. Use the Sharing Debugger to scrape again
2. Verify the image URL is publicly accessible
3. Check that Supabase storage bucket is public
4. Ensure image meets minimum size requirements

### Issue: Old Image Showing

**Cause:** Facebook's cache hasn't updated

**Solution:** Use the Sharing Debugger to "Scrape Again"

### Issue: Opens in Browser Instead of App

**Causes:**
- Facebook app not installed
- App Links not configured correctly
- Device doesn't support app deep linking

**Solutions:**
1. Ensure Facebook app is installed on device
2. Check that App Links meta tags are present
3. Consider implementing Facebook SDK for better app integration

## Facebook App Configuration

### Getting a Facebook App ID (Optional but Recommended)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing one
3. Copy your App ID
4. Update `fb:app_id` in `app/listing/[id]/page.tsx`
5. Update `app_id` in `components/share-button.tsx`

**Benefits:**
- Better analytics
- Improved mobile app integration
- Access to Facebook Insights
- Required for some advanced features

## Monitoring

You can track shares through:
- Google Analytics (if configured)
- Your analytics API endpoint: `/api/analytics/share-event`
- Facebook Insights (if App ID configured)

## Technical Details

### Meta Tags Generated

```html
<!-- Open Graph -->
<meta property="og:title" content="[Listing Title] | FrothMonkey" />
<meta property="og:description" content="[Description with CTA]" />
<meta property="og:image" content="[Supabase Storage URL]" />
<meta property="og:url" content="https://frothmonkey.com/listing/[id]" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="FrothMonkey" />

<!-- Facebook Specific -->
<meta property="fb:app_id" content="[Your App ID]" />

<!-- App Links -->
<meta property="al:web:url" content="[Listing URL]" />
<meta property="al:ios:url" content="[Listing URL]" />
<meta property="al:android:url" content="[Listing URL]" />
```

### Image URL Structure

```
https://[supabase-url]/storage/v1/object/public/listing-images/[listing-id]/[image-file]
```

## Best Practices

1. **Always use high-quality images** for listings (min 1200x630px)
2. **Test on multiple devices** (desktop, iOS, Android)
3. **Clear cache after updates** using the Debugging tool
4. **Monitor share events** to track engagement
5. **Keep descriptions concise** (120 chars for optimal display)

## Need Help?

If you're still experiencing issues:
1. Check the console for errors
2. Verify Supabase storage permissions
3. Test the image URL directly in a browser
4. Contact support with the Sharing Debugger results
