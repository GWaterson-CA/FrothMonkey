# Listing View Count Feature

## Overview

This feature adds view count tracking and display to listing pages. Each time a listing is viewed, it's tracked in the `listing_views` table, and the total count is displayed at the bottom of the listing page alongside a secondary Share button.

## What's New

### 1. Database Function
- **File:** `supabase/migrations/043_add_listing_view_count_function.sql`
- **Function:** `get_listing_view_count(listing_uuid)`
- Returns the total number of views for a specific listing
- Optimized with an index on `listing_views.listing_id`

### 2. ViewsAndShare Component
- **File:** `components/views-and-share.tsx`
- Displays the view count with an eye icon
- Includes a duplicate Share button
- Styled with grey text for subtle presentation
- Responsive layout that works on mobile and desktop

### 3. Listing Page Integration
- **File:** `app/listing/[id]/page.tsx`
- Fetches view count using the new database function
- Displays `ViewsAndShare` component at the bottom of the listing
- Positioned below the Payment Options section
- Above the footer

## Features

### View Tracking
- Views are automatically tracked via the existing `AnalyticsTracker` component
- Tracks both authenticated and anonymous users
- Records IP address and user agent for analytics
- View data stored in `listing_views` table

### View Count Display
- Shows total views with formatted numbers (e.g., "1,234 views")
- Proper singular/plural handling ("1 view" vs "2 views")
- Eye icon for visual recognition
- Grey text color for subtle appearance

### Share Button
- Duplicate of the Share button found at the top of the listing
- Provides a Call to Action at the bottom of the page
- Same functionality as the original:
  - Copy link
  - Share to Facebook, Twitter, LinkedIn, WhatsApp
  - Native share API on mobile devices
  - Tracks share events for analytics

## Technical Details

### Database Schema
The feature uses the existing `listing_views` table created in migration `015_admin_analytics_system_safe.sql`:

```sql
CREATE TABLE listing_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### New Function
```sql
CREATE OR REPLACE FUNCTION get_listing_view_count(listing_uuid UUID)
RETURNS INTEGER
```

### API Endpoint
The existing `/api/analytics/listing-view` endpoint handles view tracking:
- Called automatically by `AnalyticsTracker` component
- Stores view data in `listing_views` table
- Uses `record_listing_view()` database function

## Deployment

### Steps
1. Apply the database migration:
   ```bash
   ./DEPLOY_VIEW_COUNT.sh
   ```
   Or manually:
   ```bash
   supabase db push
   ```

2. No environment variables needed
3. No additional setup required

### Testing
1. Visit any live listing page
2. View count should appear at the bottom, just above the footer
3. After the Payment Options section
4. Refresh the page to see the view count increment
5. Click the Share button to test sharing functionality

## User Experience

### Placement
The view count and Share button are strategically placed:
- **Bottom of listing content:** Provides engagement metrics after users have read the full listing
- **Above footer:** Easy to find without scrolling further
- **Below Payment Options:** Natural position in the content flow

### Visual Design
- **Grey text:** Subtle and not distracting from main content
- **Eye icon:** Universally recognized symbol for views
- **Share button:** Maintains consistent styling with top Share button
- **Border top:** Visual separation from Payment Options

### Mobile Responsive
- Flexbox layout adapts to screen size
- View count on the left, Share button on the right
- Maintains readability on small screens

## Analytics

View count data can be used for:
- **Seller insights:** See how much interest their listings generate
- **Trending listings:** Identify popular items
- **Performance metrics:** Track listing engagement over time
- **A/B testing:** Compare view counts with bid activity

## Future Enhancements

Possible improvements:
1. Add "unique views" vs "total views" distinction
2. Show view count trend (views in last 24 hours, etc.)
3. Compare views to bids ratio
4. Display view count in listing cards on browse pages
5. Add views to listing owner dashboard
6. Show geographical distribution of views

## Files Modified

1. **Database:**
   - `supabase/migrations/043_add_listing_view_count_function.sql` (new)

2. **Components:**
   - `components/views-and-share.tsx` (new)

3. **Pages:**
   - `app/listing/[id]/page.tsx` (modified)

4. **Documentation:**
   - `VIEW_COUNT_FEATURE.md` (new)
   - `DEPLOY_VIEW_COUNT.sh` (new)

## No Breaking Changes

- All changes are additive
- Existing functionality remains unchanged
- View tracking was already in place
- No database migrations affect existing data

