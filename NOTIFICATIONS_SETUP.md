# Notification System Setup Guide

This document provides comprehensive instructions for setting up and using the notification system in the Auction Marketplace application.

## Overview

The notification system provides real-time, in-app notifications for users about important auction events. It includes:

- ✅ Database-driven notifications with PostgreSQL triggers
- ✅ Real-time updates using Supabase Realtime
- ✅ Notification bell dropdown in the header
- ✅ Dedicated notifications page
- ✅ User notification preferences
- ✅ Scheduled time-based notifications

## Notification Types

### For Sellers:
1. **Question Received** - When someone asks a question about your listing
2. **First Bid Received** - When the first bid is placed on your listing
3. **Reserve Price Met** - When the reserve price is reached
4. **Listing Ended** - When your listing ends with detailed outcome:
   - No bids
   - Bids but reserve not met
   - Sold (reserve met)
   - Sold via Buy Now
5. **Listing Reported** - When someone reports your listing

### For Buyers:
1. **Bid Outbid** - When someone outbids you (notification sent only once per listing)
2. **Auction Won** - When you win an auction
3. **Reserve Met** - When reserve is met on:
   - A listing you're bidding on
   - A listing in your watchlist
4. **Time Warnings**:
   - 24 hours before auction ends
   - 2 hours before auction ends

## Setup Instructions

### 1. Database Migration

Run the notification system migration:

```bash
# Make sure you're in your Supabase project directory
supabase db push

# Or apply the specific migration files:
supabase migration up 023_notifications_system
supabase migration up 024_schedule_time_notifications
```

The migrations will:
- Create the `notifications` table
- Add `notification_preferences` column to `profiles` table
- Set up database triggers for automatic notification creation
- Create helper functions for notification management

### 2. Configure Real-time Subscriptions

The notification system uses Supabase Realtime for instant updates. Make sure Realtime is enabled for the `notifications` table in your Supabase Dashboard:

1. Go to **Database > Replication**
2. Enable replication for the `notifications` table
3. Choose "Enable Insert, Update, Delete"

### 3. Set Up Scheduled Functions

For time-based notifications (24h and 2h warnings), you need to schedule the notification function:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to **Database > Cron Jobs** in Supabase Dashboard
2. Create a new cron job:
   - **Name**: `time_warning_notifications`
   - **Schedule**: `0 * * * *` (runs every hour)
   - **SQL**: `SELECT schedule_time_notifications();`

#### Option B: Using pg_cron (Advanced)

If you have direct database access:

```sql
SELECT cron.schedule(
  'time_warning_notifications',
  '0 * * * *',  -- Every hour
  'SELECT schedule_time_notifications();'
);
```

### 4. Deploy Edge Function (Optional)

The `send-time-notifications` Edge Function can be used as an alternative to cron jobs:

```bash
# Deploy the function
supabase functions deploy send-time-notifications

# Set up environment variables
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Then configure a webhook or external cron service (like Vercel Cron or GitHub Actions) to call this function every hour.

## Usage

### Accessing Notifications

Users can access notifications in two ways:

1. **Bell Icon in Header** - Shows unread count badge and dropdown with recent notifications
2. **Full Notifications Page** - `/account/notifications` - Shows all notifications with tabs for "All" and "Unread"

### Managing Notifications

Users can:
- Click a notification to navigate to the related listing
- Mark individual notifications as read
- Mark all notifications as read
- Delete individual notifications
- Filter between all and unread notifications

### Notification Preferences

Users can customize their notification settings at `/account/settings`:

- **Master Switch** - Enable/disable all notifications
- **Individual Toggles** - Control each notification type separately
- Organized by role (Seller Notifications vs Buyer Notifications)

## API Endpoints

The notification system provides the following API endpoints:

### GET `/api/notifications`
Fetch user's notifications with optional filters:
- `?limit=20` - Limit number of results (default: 20)
- `?unread=true` - Fetch only unread notifications

**Response:**
```json
{
  "notifications": [...],
  "unreadCount": 5
}
```

### PATCH `/api/notifications/[id]`
Mark a specific notification as read

### DELETE `/api/notifications/[id]`
Delete a specific notification

### POST `/api/notifications/mark-all-read`
Mark all user's notifications as read

## Database Schema

### notifications table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User who receives the notification |
| type | TEXT | Notification type (enum) |
| title | TEXT | Notification title |
| message | TEXT | Notification message |
| listing_id | UUID | Related listing (nullable) |
| related_user_id | UUID | Related user (nullable) |
| metadata | JSONB | Additional data |
| read_at | TIMESTAMPTZ | When notification was read (nullable) |
| created_at | TIMESTAMPTZ | When notification was created |

### profiles.notification_preferences

JSONB column with structure:
```json
{
  "email_notifications": true,
  "question_received": true,
  "first_bid_received": true,
  "reserve_met": true,
  "listing_ended": true,
  "listing_reported": true,
  "bid_outbid": true,
  "auction_won": true,
  "time_warning_24h": true,
  "time_warning_2h": true
}
```

## Testing the System

### Manual Testing

1. **Create a test listing** as User A
2. **Ask a question** as User B - User A should receive a notification
3. **Place a bid** as User B - User A should receive "First Bid" notification
4. **Place a higher bid** as User C - User B should receive "Outbid" notification
5. **Wait for listing to end** - Appropriate notifications should be sent

### Trigger Testing

You can manually trigger notifications for testing:

```sql
-- Test question received notification
SELECT create_notification(
  'user_id_here',
  'question_received',
  'New Question on Your Listing',
  'Someone asked about your listing',
  'listing_id_here'
);
```

## Troubleshooting

### Notifications Not Appearing

1. **Check Realtime subscription**:
   - Verify Realtime is enabled for `notifications` table
   - Check browser console for subscription errors

2. **Check database triggers**:
   ```sql
   -- List all triggers on relevant tables
   SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';
   ```

3. **Check notification preferences**:
   - User may have disabled notifications
   - Check `profiles.notification_preferences`

### Time Warnings Not Sending

1. **Verify cron job is running**:
   ```sql
   -- Check cron job status
   SELECT * FROM cron.job WHERE jobname = 'time_warning_notifications';
   ```

2. **Manual test**:
   ```sql
   -- Run the function manually
   SELECT create_time_warning_notifications();
   ```

3. **Check for existing notifications**:
   - The function prevents duplicate notifications
   - Users only get one 24h warning and one 2h warning per listing

## Future Enhancements

Potential improvements to consider:

- [ ] Email notifications integration (Resend, SendGrid, etc.)
- [ ] Push notifications (web push, mobile)
- [ ] Notification grouping/bundling
- [ ] Notification sound effects
- [ ] Notification delivery history/analytics
- [ ] Batch notification digest (daily/weekly summaries)
- [ ] SMS notifications for critical events

## Security Considerations

- Row Level Security (RLS) is enabled on the `notifications` table
- Users can only view/update their own notifications
- Notification creation is handled by database triggers (secure)
- API endpoints verify user authentication before operations

## Performance Considerations

- Indexes are created on frequently queried columns:
  - `user_id` + `created_at` for listing notifications
  - `user_id` + `read_at` for unread count
  - `listing_id` for listing-specific queries

- The notification system uses:
  - Database triggers (minimal overhead)
  - Indexed queries (fast lookups)
  - Realtime subscriptions (efficient updates)

## Support

For issues or questions about the notification system:
1. Check this documentation
2. Review the migration files for implementation details
3. Check the console for error messages
4. Review the Supabase logs for trigger/function errors

