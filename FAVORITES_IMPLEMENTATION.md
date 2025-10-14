# Favorites Feature Implementation

## Overview
This document describes the implementation of the favorites (watchlist) feature with notification capabilities.

## Features Implemented

### 1. Simplified Listing Card Design ✅
- **Removed**: User info, "Bid now" text, Category name
- **Kept**: Photo, Status tags (Live/Reserve Met), Title, Current bid price, Location, Time remaining
- **Improved**: Time display now shows human-readable format like "2h 19m" instead of countdown timer

### 2. Clickable Heart/Favorite Button ✅
- Heart icon is now fully functional
- Users can click to add/remove listings from favorites
- Heart fills with red color when favorited
- Redirects to sign-in page if user is not authenticated

### 3. Favorite Count Display ✅
- Small badge shows number of users who favorited each listing
- Updates in real-time when users add/remove favorites
- Positioned on top-right corner of heart icon

### 4. Favorites Page ✅
- Renamed "My Watchlist" to "My Favorites"
- Updated messaging to reflect new functionality
- Shows all listings the user has favorited
- Remove button to unfavorite listings

### 5. Notifications for Favorited Listings ✅
Two types of automatic notifications:
- **Reserve Met**: When a favorited listing's reserve price is met
- **Ending Soon**: When a favorited listing has less than 24 hours remaining

### 6. Email Notifications ✅
Beautiful, branded email templates for:
- Reserve price met on favorited listing
- Less than 24 hours remaining on favorited listing
- Respects user's email notification preferences

## Database Changes

### Migration File: `035_add_favorites_functionality.sql`

1. **Added `favorite_count` column to `listings` table**
   - Tracks how many users have favorited each listing
   - Updated automatically via triggers

2. **Created database function: `update_favorite_count()`**
   - Automatically increments/decrements favorite count
   - Triggered on INSERT/DELETE in watchlists table

3. **Created database function: `create_favorite_notifications()`**
   - Checks for favorited listings that met reserve price
   - Checks for favorited listings ending in < 24 hours
   - Creates notifications for all users who favorited those listings
   - Returns count of notifications created

4. **Added indexes for performance**
   - `idx_watchlists_listing_user` on watchlists(listing_id, user_id)

## Component Changes

### `listing-card.tsx`
- Added favorite state management
- Integrated favorite toggle functionality
- Added favorite count display with badge
- Removed unnecessary elements (category, user info, "Bid now" text)
- Improved time remaining display

### `listings-grid.tsx`
- Fetches user's favorites on load
- Passes favorite state to listing cards
- Passes current user ID for authentication

### `lib/utils.ts`
- Added `formatTimeRemaining()` function
- Returns human-readable time like "2h 19m" or "3d 12h"

## Email Templates

### `lib/email/templates.tsx`
Added two new email components:

1. **FavoriteReserveMetEmail**
   - Sent when reserve price is met
   - Shows current bid, time remaining, reserve met status
   - Call-to-action: "View Listing & Place Bid"

2. **FavoriteEndingSoonEmail**
   - Sent when < 24 hours remaining
   - Shows current bid, time remaining, reserve status
   - Call-to-action: "Place Your Bid Now"

### `lib/email/send-notification-email.ts`
- Added handlers for `favorite_reserve_met` and `favorite_ending_soon`
- Maps to `favorite_notifications` preference key

## Edge Function

### `check-favorite-notifications/index.ts`
New Supabase Edge Function that:
1. Calls `create_favorite_notifications()` database function
2. Fetches newly created notifications
3. Checks user email preferences
4. Sends email notifications via Resend API
5. Should be run on a schedule (recommended: hourly)

## Deployment Steps

### 1. Apply Database Migration
```bash
# From your Supabase dashboard or CLI
supabase db push

# Or manually run:
# supabase/migrations/035_add_favorites_functionality.sql
```

### 2. Deploy Edge Function
```bash
# Deploy the favorite notifications check function
supabase functions deploy check-favorite-notifications

# Set up secrets if not already done
supabase secrets set RESEND_API_KEY=your_api_key
```

### 3. Set Up Cron Job
In your Supabase dashboard:
1. Go to Database > Extensions
2. Enable `pg_cron` extension
3. Run this SQL to schedule hourly checks:

```sql
-- Schedule favorite notifications check every hour
SELECT cron.schedule(
  'check-favorite-notifications',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url:='YOUR_SUPABASE_URL/functions/v1/check-favorite-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

### 4. Update User Notification Preferences
Add to the notification preferences UI:
```json
{
  "email_notifications": true,
  "favorite_notifications": true  // New preference
}
```

## Testing

### Test Favorite Functionality
1. Visit any listing page
2. Click the heart icon
3. Verify it fills with red color
4. Check account/watchlist page to see the favorited listing
5. Check the favorite count updates

### Test Notifications
1. Favorite a listing that hasn't met reserve yet
2. Place bids until reserve is met
3. Wait for next hourly check (or trigger manually)
4. Verify notification appears in-app
5. Check email for notification

### Manual Trigger (for testing)
```bash
# Call the edge function directly
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/check-favorite-notifications' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## User Experience Flow

### Adding a Favorite
1. User browses listings
2. Sees heart icon on each listing with favorite count
3. Clicks heart to favorite
4. Heart fills with red, count increments
5. Listing appears in "My Favorites" page

### Receiving Notifications
1. User favorites a listing
2. When reserve is met → receives notification + email
3. When <24h remaining → receives notification + email
4. Notifications link directly to the listing
5. User can click to place bid

## Configuration

### Email Preferences
Users can control favorite notifications in their account settings:
- Master switch: `email_notifications`
- Favorite-specific: `favorite_notifications`

### Notification Timing
- Reserve met: Checks every hour, sends once when detected
- Ending soon: Sends once when listing enters 24h window
- Prevents duplicate notifications using database checks

## Performance Considerations

1. **Favorite Count**: Updated via triggers, no performance impact on reads
2. **User Favorites**: Indexed for fast lookups
3. **Notifications**: Batch created via single function call
4. **Email Sending**: Processed asynchronously in edge function

## Future Enhancements

Potential improvements:
- [ ] Add favorite filtering/sorting options
- [ ] Show favorite trends (popular items)
- [ ] Allow users to customize notification timing
- [ ] Add push notifications for mobile
- [ ] Analytics on favorite patterns

## Troubleshooting

### Favorites not saving
- Check user is authenticated
- Verify watchlists table permissions
- Check browser console for errors

### Notifications not sending
- Verify cron job is running: `SELECT * FROM cron.job;`
- Check edge function logs: `supabase functions logs check-favorite-notifications`
- Verify RESEND_API_KEY is set
- Check user email notification preferences

### Favorite count not updating
- Verify trigger is active: `\d+ watchlists` in psql
- Check for errors in database logs
- Manually recalculate: Run the UPDATE query from migration

## Support
For issues or questions, check:
- Database logs for SQL errors
- Edge function logs for notification errors
- Email service logs (Resend dashboard)
- Browser console for client-side errors

