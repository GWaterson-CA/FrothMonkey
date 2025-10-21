# Auto Bid Feature - Implementation Guide

## Overview

The Auto Bid feature allows users to set a maximum bid amount and the system will automatically place bids on their behalf when they are outbid, similar to TradeMe.co.nz's autobid functionality.

## How It Works

### User Experience

1. **Setting an Auto-Bid**:
   - User toggles the "Auto Bid" switch in the bidding card
   - The bid amount input changes to "Maximum Bid Amount"
   - User enters their maximum amount they're willing to pay
   - System immediately places a bid at the current minimum required
   - Auto-bid is saved for future automatic bidding

2. **Automatic Bidding**:
   - When another user places a bid that outbids the auto-bidder
   - System automatically places the next minimum bid for the auto-bidder
   - This continues until the auto-bidder's maximum is reached
   - If the auto-bidder is already winning, no additional bids are placed

3. **Auto-Bid Rules**:
   - You set your maximum bid amount
   - When someone bids higher than you, we'll place the next minimum bid for you
   - You'll stay in the lead – until you reach your maximum bid
   - No additional bids will be placed if you lead the bidding

### Technical Implementation

#### Database Schema

**New Table: `auto_bids`**
```sql
CREATE TABLE auto_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    max_amount NUMERIC(12,2) NOT NULL CHECK (max_amount > 0),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);
```

#### SQL Functions

1. **`set_auto_bid(p_user_id, p_listing_id, p_max_amount)`**
   - Creates or updates an auto-bid
   - Validates the listing is live and user isn't the owner
   - Immediately places an initial bid if user isn't winning
   - Triggers auto-bid processing for other users

2. **`cancel_auto_bid(p_user_id, p_listing_id)`**
   - Disables an auto-bid (doesn't delete it)
   - Stops automatic bidding for that user on that listing

3. **`get_auto_bid(p_user_id, p_listing_id)`**
   - Returns the user's auto-bid settings for a listing

4. **`process_auto_bids(p_listing_id, p_triggering_bidder_id)`**
   - Called after each manual bid
   - Finds eligible auto-bidders (not currently winning, max amount high enough)
   - Places bids in order of max amount (highest first)
   - Handles multiple auto-bidders competing
   - Prevents infinite loops with iteration limit

5. **Updated `place_bid(listing_id, bid_amount, bidder)`**
   - Now calls `process_auto_bids` after placing a manual bid
   - Handles buy-now scenarios (disables all auto-bids)
   - Returns final price after all auto-bids

#### API Endpoints

1. **POST `/api/auto-bid/set`**
   - Sets or updates a user's auto-bid
   - Requires authentication and bidding agreement
   - Parameters: `listingId`, `maxAmount`

2. **POST `/api/auto-bid/cancel`**
   - Cancels a user's auto-bid
   - Parameters: `listingId`

3. **POST `/api/auto-bid/get`**
   - Gets a user's current auto-bid for a listing
   - Parameters: `listingId`

#### UI Components

**Updated `combined-bidding-card.tsx`**:
- Added auto-bid toggle switch
- Added info tooltip explaining auto-bid functionality
- Changed label/placeholder text based on auto-bid state
- Split submission logic: auto-bid API vs manual bid API
- Loads existing auto-bid on mount

**New `tooltip.tsx`**:
- Radix UI tooltip component
- Used to display auto-bid information

## Deployment Instructions

### 1. Install Dependencies

```bash
npm install @radix-ui/react-tooltip
```

### 2. Apply Database Migration

```bash
# If using Supabase CLI locally
supabase migration up

# Or apply directly to your database
psql -h your-host -U your-user -d your-database -f supabase/migrations/038_auto_bid_feature.sql

# Or via Supabase dashboard: SQL Editor -> paste migration content -> Run
```

### 3. Update Database Types (Optional but Recommended)

```bash
# If using Supabase CLI
supabase gen types typescript --local > lib/database.types.ts

# Or manually update lib/database.types.ts with the new auto_bids table types
```

### 4. Deploy Application

```bash
# Build and test locally first
npm run build
npm run dev

# Then deploy to your hosting platform
# (Vercel, Netlify, etc.)
```

## Testing Checklist

- [ ] Create two test accounts (User A and User B)
- [ ] User A creates a listing
- [ ] User B sets an auto-bid with max $100
- [ ] Verify initial bid is placed at minimum required
- [ ] User A manually bids $50
- [ ] Verify User B's auto-bid automatically counter-bids
- [ ] Continue bidding until User B's max is reached
- [ ] Verify no more auto-bids are placed once max is reached
- [ ] Test with Buy Now (should disable auto-bids)
- [ ] Test canceling an auto-bid
- [ ] Test updating an auto-bid amount
- [ ] Test that owner cannot set auto-bid on own listing
- [ ] Test auto-bid with anti-sniping protection
- [ ] Test multiple users with auto-bids competing

## Security Considerations

1. **RLS Policies**: Auto-bids table has proper Row Level Security
   - Users can only view/modify their own auto-bids
   - Listing owner cannot see bidders' max amounts

2. **Rate Limiting**: Existing bid rate limiting applies to auto-bids

3. **Validation**: 
   - Max amount must be >= minimum required bid
   - User cannot auto-bid on their own listing
   - Listing must be live

4. **Infinite Loop Protection**: 
   - `process_auto_bids` has a max iteration limit (50)
   - Prevents runaway bidding scenarios

## Notifications

Auto-bids work with existing notification system:
- Users receive "outbid" notifications even with auto-bid
- This allows them to increase their max if desired
- "Winning bid" notifications when their auto-bid places a bid

## Future Enhancements

Potential improvements for future versions:

1. **Auto-Bid History**: Track when auto-bids were placed
2. **Auto-Bid Analytics**: Show users their auto-bid statistics
3. **Email Alerts**: Notify when auto-bid reaches 80% of max
4. **Bid Increments**: Allow users to set custom bid increments
5. **Multiple Auto-Bids**: Manage all auto-bids from one page
6. **Auto-Bid Limits**: Set daily/weekly spending limits

## Troubleshooting

### Auto-bids not processing
- Check that migration was applied successfully
- Verify `process_auto_bids` function exists
- Check for database errors in logs

### UI not loading auto-bid state
- Verify `/api/auto-bid/get` endpoint is working
- Check browser console for errors
- Ensure user is authenticated

### Auto-bid placing too many bids
- Check iteration limit in `process_auto_bids`
- Review logic for determining highest bidder
- Verify "enabled" flag is being checked

## Support

For issues or questions, check:
1. Database migration logs
2. Application error logs
3. Browser console errors
4. Supabase dashboard for RLS policy issues

