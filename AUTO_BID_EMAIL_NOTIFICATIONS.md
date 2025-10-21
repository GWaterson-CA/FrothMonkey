# 📧 Auto-Bid Email Notifications

## Overview

This document explains how email notifications work with the Auto-Bid feature, ensuring users only receive relevant outbid notifications.

## The Problem

**Before this fix:** Users would receive an email for EVERY bid placed, including auto-bid increments.

**Example of the problem:**
```
Listing at $20
User A sets auto-bid max at $50 → Current bid: $25
User B bids $30 → Auto-bid counters to $35 → User A gets email ❌
User B bids $40 → Auto-bid counters to $45 → User A gets email ❌
User B bids $60 → User A can't counter → User A gets email ✅
```

This would spam User A with emails even though their auto-bid was protecting them!

## The Solution

**After this fix:** Users only receive an email when their auto-bid limit has been exceeded.

**Example of the fix:**
```
Listing at $20
User A sets auto-bid max at $50 → Current bid: $25
User B bids $30 → Auto-bid counters to $35 → NO EMAIL ✅ (still protected)
User B bids $40 → Auto-bid counters to $45 → NO EMAIL ✅ (still protected)
User B bids $60 → User A can't counter → EMAIL SENT ✅ (limit exceeded)
```

User A only gets ONE email when they're truly outbid!

## How It Works

### Logic Flow

When a new bid is placed, the system:

1. **Finds the previous highest bidder** (the person who was just outbid)
2. **Checks if they have auto-bid enabled** for this listing
3. **Determines if notification should be sent:**
   - ✅ **Send notification if:**
     - They don't have auto-bid enabled, OR
     - The new bid exceeds their auto-bid max amount
   - ❌ **Don't send notification if:**
     - They have auto-bid enabled AND
     - The new bid is still within their auto-bid limit

### Code Implementation

The key logic in `notify_bid_placed()` function:

```sql
-- Check if the previous bidder has an active auto-bid
SELECT ab.* INTO previous_bidder_auto_bid
FROM auto_bids ab
WHERE ab.user_id = previous_highest_bid.bidder_id
    AND ab.listing_id = NEW.listing_id
    AND ab.enabled = true;

IF FOUND THEN
    -- Previous bidder has auto-bid enabled
    -- Only notify if the NEW bid meets or exceeds their max_amount
    IF NEW.amount >= previous_bidder_auto_bid.max_amount THEN
        should_notify_outbid := true;
    END IF;
ELSE
    -- Previous bidder does NOT have auto-bid enabled
    -- Notify them normally
    should_notify_outbid := true;
END IF;
```

## Scenarios

### Scenario 1: Manual Bidding (No Auto-Bid)

```
Listing: Classic Guitar
Starting price: $50

Timeline:
1. User A bids $100 → User A is highest bidder
2. User B bids $150 → User A gets email ✅ (no auto-bid protection)
3. User A bids $200 → User B gets email ✅ (no auto-bid protection)
```

**Result:** Both users get emails each time they're outbid (classic behavior)

### Scenario 2: One User Has Auto-Bid

```
Listing: Vintage Watch
Starting price: $100

Timeline:
1. User A sets auto-bid max $500 → Current bid: $105
2. User B bids $200 → Auto-bid counters to $205 → NO email to User A ✅
3. User B bids $300 → Auto-bid counters to $305 → NO email to User A ✅
4. User B bids $600 → User A can't counter → EMAIL to User A ✅
```

**Result:** User A only gets ONE email when their $500 limit is exceeded

### Scenario 3: Both Users Have Auto-Bid

```
Listing: Rare Coin
Starting price: $50

Timeline:
1. User A sets auto-bid max $300 → Current bid: $55
2. User B sets auto-bid max $500 → Auto-bid battle begins!
   - Auto-bid places $60 for User B
   - Auto-bid places $65 for User A
   - ... continues until ...
   - Auto-bid places $300 for User B (equals User A's $300 limit)
3. User A gets email ✅ (their $300 limit was reached/exhausted)
```

**Result:** User A gets ONE email when their limit is reached/exhausted in the auto-bid battle

**Note:** Email is sent when the bid **meets or exceeds** the auto-bid max (not just exceeds). This ensures users are notified when their auto-bid is maxed out, even if the winning bid equals their max.

### Scenario 4: Auto-Bid vs Manual Bid

```
Listing: Gaming Console
Starting price: $200

Timeline:
1. User A sets auto-bid max $400 → Current bid: $205
2. User B manually bids $250 → Auto-bid counters to $255 → NO email to User A ✅
3. User B manually bids $350 → Auto-bid counters to $355 → NO email to User A ✅
4. User C manually bids $450 → User A can't counter → EMAIL to User A ✅
```

**Result:** User A only gets notified when someone bids above their $400 limit

## User Experience

### What Users See

**User with Auto-Bid Enabled:**
- Sets max bid to $500
- Receives NO emails while auto-bid is protecting them (under $500)
- Receives ONE email when someone bids above $500
- Email clearly states they've been outbid and their auto-bid couldn't counter

**User without Auto-Bid:**
- Receives email every time they're outbid (classic behavior)
- Can enable auto-bid at any time to reduce notifications

## Email Content

When a user's auto-bid limit is exceeded, they receive:

**Subject:** You've Been Outbid!

**Body:**
```
Your bid of $XXX on "[Listing Title]" has been outbid.

Your auto-bid limit of $XXX has been exceeded.
Current highest bid: $XXX

Click here to view the auction and place a higher bid.
```

## Migration Files

### Primary Migration
`supabase/migrations/040_fix_outbid_notifications_for_auto_bid.sql`

This migration updates the `notify_bid_placed()` function to implement the smart notification logic.

### Standalone SQL File
`APPLY_AUTO_BID_NOTIFICATION_FIX.sql`

Can be run directly in Supabase Dashboard SQL Editor for quick deployment.

## Deployment

### Option 1: Via Supabase CLI (Recommended)

```bash
cd /Users/geoffreywaterson/Documents/Cursor\ -\ Auction\ Marketplace
npx supabase db push
```

### Option 2: Via Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open `APPLY_AUTO_BID_NOTIFICATION_FIX.sql`
4. Copy and paste the contents
5. Click **Run**

## Testing

### Test Plan

1. **Create a test listing** at $20
2. **User A:** Set auto-bid max at $50 (should place initial bid at $25)
3. **User B:** Manually bid $30
   - ✅ Auto-bid counters to $35 for User A
   - ✅ Check that User A did NOT receive an email
4. **User B:** Manually bid $40
   - ✅ Auto-bid counters to $45 for User A
   - ✅ Check that User A did NOT receive an email
5. **User B:** Manually bid $60
   - ✅ User A cannot counter (exceeds $50 limit)
   - ✅ Check that User A DID receive an email

### Verification Queries

**Check if user has auto-bid:**
```sql
SELECT * FROM auto_bids 
WHERE listing_id = '[LISTING_ID]' 
AND enabled = true;
```

**Check notifications sent:**
```sql
SELECT * FROM notifications 
WHERE listing_id = '[LISTING_ID]' 
AND type = 'bid_outbid'
ORDER BY created_at DESC;
```

**Check bid history:**
```sql
SELECT 
    b.amount,
    b.is_auto_bid,
    b.created_at,
    p.username
FROM bids b
JOIN profiles p ON p.id = b.bidder_id
WHERE b.listing_id = '[LISTING_ID]'
ORDER BY b.created_at DESC;
```

## Benefits

### For Users
- ✅ **Reduced email spam:** Only get emails when truly outbid
- ✅ **Better UX:** Auto-bid works silently in the background
- ✅ **Clear communication:** Only notified when action is needed

### For the Platform
- ✅ **Lower email costs:** Fewer unnecessary emails sent
- ✅ **Better engagement:** Users don't ignore/unsubscribe from notifications
- ✅ **Competitive feature:** Matches behavior of platforms like TradeMe and eBay

## Related Documentation

- `AUTO_BID_FEATURE.md` - Complete auto-bid feature documentation
- `AUTO_BID_IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `EMAIL_NOTIFICATIONS_SETUP.md` - Email notification system setup
- `OUTBID_NOTIFICATION_FIX_SUMMARY.md` - Previous outbid notification fixes

## Technical Notes

### Database Changes
- No new tables or columns required
- Only updates the `notify_bid_placed()` trigger function
- Backward compatible with existing data

### Performance
- Adds one additional query to check for auto-bid existence
- Minimal performance impact (indexed query on small table)
- No impact on bid placement speed

### Edge Cases Handled
- ✅ User has auto-bid but it's disabled
- ✅ User has auto-bid at exactly current price
- ✅ Multiple users with auto-bid competing
- ✅ Mix of manual and auto-bids
- ✅ User updates auto-bid max amount mid-auction

## Support

If you encounter issues:
1. Check that migration 040 is applied
2. Verify auto-bid table exists and has data
3. Check notification trigger exists
4. Review email webhook configuration
5. Test with the verification queries above

---

**Version:** 1.0  
**Last Updated:** October 2025  
**Status:** ✅ Production Ready

