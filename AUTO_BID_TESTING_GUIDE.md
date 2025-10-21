# Auto Bid Feature - Testing Guide

## Pre-Testing Checklist

Before testing, ensure:
- [ ] Migration `038_auto_bid_feature.sql` has been applied to your database
- [ ] Migration `039_add_auto_bid_tracking.sql` has been applied to your database
- [ ] Migration `040_fix_outbid_notifications_for_auto_bid.sql` has been applied to your database
- [ ] `@radix-ui/react-tooltip` package is installed (`npm install @radix-ui/react-tooltip`)
- [ ] Application builds successfully (`npm run build`)
- [ ] Development server is running (`npm run dev`)
- [ ] Email notifications are configured (webhook and edge function)

## Test Accounts Setup

You'll need at least 3 test accounts:
1. **Seller Account** - Creates listings
2. **Bidder A** - Uses auto-bid feature
3. **Bidder B** - Manual bidder to trigger auto-bids

## Test Scenarios

### 1. Basic Auto-Bid Setup

**Steps:**
1. Log in as **Seller**
2. Create a new listing with:
   - Start price: $50
   - Duration: 7 days
   - Publish the listing

3. Log in as **Bidder A**
4. Navigate to the listing
5. Toggle "Auto Bid" switch (should show info icon)
6. Hover over info icon - verify tooltip appears with instructions
7. Enter maximum bid: $200
8. Click "Set Auto-Bid"

**Expected Results:**
- ✓ Success toast: "Auto-bid enabled with maximum of $200"
- ✓ A bid is immediately placed at $51 (minimum required)
- ✓ Current price shows $51
- ✓ Bidder A is the highest bidder

### 2. Auto-Bid Counter-Bidding

**Continuing from Test 1:**

1. Log in as **Bidder B**
2. Navigate to the same listing
3. Place a manual bid: $60

**Expected Results:**
- ✓ Bidder B's bid of $60 is accepted
- ✓ Auto-bid immediately counter-bids for Bidder A at $61
- ✓ Current price shows $61
- ✓ Bidder A is back as the highest bidder
- ✓ Bidder B receives "outbid" notification
- ✓ Bidder A does NOT receive an email (auto-bid is protecting them)

3. Place another bid as Bidder B: $75

**Expected Results:**
- ✓ Auto-bid counter-bids at $76
- ✓ Bidder A remains highest bidder
- ✓ Bidder A does NOT receive an email (auto-bid still protecting them)

### 3. Auto-Bid Maximum Reached

**Continuing from Test 2:**

1. As **Bidder B**, place bids incrementally: $80, $90, $100, etc.
2. Continue until you bid over $200

**Expected Results:**
- ✓ Auto-bids continue until Bidder A's max ($200) is reached
- ✓ Bidder A does NOT receive emails during auto-bid increments
- ✓ Once Bidder B bids $201+, no more auto-bids for Bidder A
- ✓ Bidder B becomes the highest bidder
- ✓ Bidder A receives "outbid" notification (first and only email!)
- ✓ Bidder A receives outbid email because bid exceeded their $200 max

### 4. Already Winning - No Additional Bids

**Steps:**
1. Create a new listing (Start price: $30)
2. Bidder A sets auto-bid with max $150
3. Initial bid placed at $31
4. Log in as Bidder A again
5. Check the listing

**Expected Results:**
- ✓ Auto-bid toggle is ON
- ✓ Max amount shows $150
- ✓ No additional bids are placed (already winning)
- ✓ Can update max amount if desired

### 5. Updating Auto-Bid Amount

**Steps:**
1. While Bidder A is highest bidder with auto-bid at $150
2. Toggle Auto-Bid ON (should already be on)
3. Change max amount to $250
4. Click "Set Auto-Bid"

**Expected Results:**
- ✓ Success message: "Auto-bid enabled with maximum of $250"
- ✓ No new bid placed (already winning)
- ✓ Next time outbid, will auto-bid up to $250

### 6. Canceling Auto-Bid

**Steps:**
1. While auto-bid is active
2. Toggle Auto-Bid switch OFF
3. (Optional: submit or it auto-saves based on implementation)

**Expected Results:**
- ✓ Auto-bid is disabled
- ✓ Previous bids remain
- ✓ No more automatic counter-bids
- ✓ User still wins if they're the highest bidder

### 7. Multiple Auto-Bidders Competing

**Steps:**
1. Create a new listing (Start price: $100)
2. Bidder A sets auto-bid: max $300
3. Bidder B sets auto-bid: max $250
4. Log in as Seller or Bidder C (manual bidder)
5. Place a manual bid: $110

**Expected Results:**
- ✓ System processes both auto-bids
- ✓ Bidder A (higher max) ends up as winner
- ✓ Bids increment by minimum until Bidder B's max is exceeded
- ✓ Final bid should be around $251 (just over Bidder B's max)
- ✓ Bidder A is highest bidder

### 8. Buy Now Disables Auto-Bids

**Steps:**
1. Create listing with Buy Now price: $500, Start: $50
2. Bidder A sets auto-bid: max $300
3. Bidder B uses "Buy Now" for $500

**Expected Results:**
- ✓ Listing marked as "sold"
- ✓ All auto-bids for this listing are disabled
- ✓ No more bidding possible

### 9. Owner Cannot Auto-Bid Own Listing

**Steps:**
1. Log in as Seller
2. Navigate to your own live listing
3. Try to set auto-bid

**Expected Results:**
- ✓ Error: "You cannot bid on your own listing"
- ✓ Auto-bid not created

### 10. Anti-Sniping with Auto-Bid

**Steps:**
1. Create a listing ending in 2 minutes
2. Bidder A sets auto-bid
3. Wait until final 30 seconds
4. Bidder B places a manual bid

**Expected Results:**
- ✓ Auto-bid counter-bids for Bidder A
- ✓ End time extends by 2 minutes
- ✓ Process repeats if bids continue in final seconds

### 11. Bidding Agreement Required

**Steps:**
1. Create new account (hasn't accepted bidding agreement)
2. Try to set auto-bid

**Expected Results:**
- ✓ Bidding agreement modal appears
- ✓ Must accept before auto-bid can be set
- ✓ After accepting, auto-bid can be set

### 12. Minimum Bid Enforcement

**Steps:**
1. Current bid on listing: $100 (min next bid: $105)
2. Try to set auto-bid with max: $102

**Expected Results:**
- ✓ Error: "Maximum bid amount must be at least the minimum required bid"
- ✓ Shows minimum required: $105
- ✓ Auto-bid not created

## Database Verification

Use these SQL queries to verify auto-bids are working:

### Check Auto-Bids for a Listing
```sql
SELECT 
    ab.id,
    p.username,
    ab.max_amount,
    ab.enabled,
    ab.created_at
FROM auto_bids ab
JOIN profiles p ON p.id = ab.user_id
WHERE ab.listing_id = 'YOUR-LISTING-ID'
ORDER BY ab.max_amount DESC;
```

### Check if Auto-Bids Were Processed
```sql
SELECT 
    b.id,
    b.amount,
    b.created_at,
    p.username
FROM bids b
JOIN profiles p ON p.id = b.bidder_id
WHERE b.listing_id = 'YOUR-LISTING-ID'
ORDER BY b.created_at DESC
LIMIT 20;
```

### Verify Auto-Bid is Active
```sql
SELECT 
    ab.*,
    l.current_price,
    l.status
FROM auto_bids ab
JOIN listings l ON l.id = ab.listing_id
WHERE ab.user_id = 'YOUR-USER-ID'
  AND ab.listing_id = 'YOUR-LISTING-ID';
```

## UI Verification Checklist

On the bidding card, verify:
- [ ] Auto Bid toggle switch is visible
- [ ] Info icon (ⓘ) appears next to "Auto Bid" label
- [ ] Tooltip shows on hover with correct text
- [ ] Label changes from "Bid Amount" to "Maximum Bid Amount" when toggled
- [ ] Placeholder changes when toggled
- [ ] Button text changes to "Set Auto-Bid" when toggled
- [ ] Button shows max amount: "Set Auto-Bid (Max: $200)"
- [ ] Existing auto-bid loads correctly (toggle ON, amount shown)
- [ ] Success/error toasts appear appropriately

## Performance Testing

### Load Testing
1. Create 10 listings
2. Have 5 users set auto-bids on each listing
3. Place manual bids to trigger auto-bids
4. Verify:
   - [ ] Auto-bids process quickly (< 2 seconds)
   - [ ] No duplicate bids
   - [ ] Correct bidder ends up winning
   - [ ] Database locks work properly (no race conditions)

### Edge Case: Rapid Bidding
1. Set up auto-bids for multiple users
2. Have users place manual bids rapidly (multiple per second)
3. Verify:
   - [ ] Auto-bids process correctly
   - [ ] No errors in console/logs
   - [ ] Bid history is accurate
   - [ ] Final winner is correct

## Notification Testing

Verify these notifications work with auto-bids:

1. **Outbid Notification (UPDATED FOR AUTO-BID)**
   - ✅ **Sent:** When user's auto-bid max is exceeded by someone else
   - ❌ **NOT sent:** During auto-bid increments (while auto-bid is protecting them)
   - Example: User has auto-bid at $50, currently at $35
     - Someone bids $40 → Auto-bid counters to $45 → NO email sent ✅
     - Someone bids $60 → Auto-bid can't counter → EMAIL sent ✅
   - See `AUTO_BID_EMAIL_NOTIFICATIONS.md` for complete details

2. **Winning Bid Notification** 
   - Sent when auto-bid successfully counter-bids

3. **Auction Ending Soon**
   - Works normally for auto-bid users

### Email Notification Test Scenarios

**Test A: No Email During Auto-Bid Protection**
1. Bidder A sets auto-bid max at $100, currently at $55
2. Bidder B bids $70 → Auto-bid counters to $75
3. ✅ Verify: Bidder A receives NO email
4. Check: `SELECT * FROM notifications WHERE user_id = 'BIDDER_A' AND type = 'bid_outbid'`
5. Expected: NO new notifications

**Test B: Email Sent When Limit Exceeded**
1. Continuing from Test A (Bidder A auto-bid max $100, currently at $75)
2. Bidder B bids $120 → Exceeds Bidder A's $100 limit
3. ✅ Verify: Bidder A receives ONE email
4. Check: `SELECT * FROM notifications WHERE user_id = 'BIDDER_A' AND type = 'bid_outbid'`
5. Expected: ONE notification created
6. Check: Email should be sent (email_sent = true)

**Test C: Multiple Increments, One Email**
1. Bidder A sets auto-bid max at $200
2. Bidder B places 5 manual bids: $50, $75, $100, $125, $150
3. Auto-bid counters all 5 times
4. Bidder B then bids $250 (exceeds limit)
5. ✅ Verify: Bidder A receives exactly ONE email (not 6!)
6. This prevents email spam

See `TEST_AUTO_BID_EMAIL_NOTIFICATIONS.sql` for detailed SQL test script

## Common Issues & Solutions

### Issue: Auto-bid not processing
**Check:**
- Is migration applied? Run: `SELECT * FROM auto_bids LIMIT 1;`
- Check function exists: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'process_auto_bids';`
- Check application logs for errors

### Issue: UI not showing auto-bid state
**Check:**
- Browser console for errors
- Network tab: `/api/auto-bid/get` should return 200
- Check if user is authenticated

### Issue: Multiple auto-bids causing errors
**Check:**
- Database logs for lock timeouts
- Verify `process_auto_bids` iteration limit (should be 50)
- Check for infinite loop conditions

## Success Criteria

All tests pass if:
- ✅ Auto-bid can be set, updated, and canceled
- ✅ Auto-bids automatically counter-bid when outbid
- ✅ Auto-bid respects maximum amount
- ✅ No additional bids when already winning
- ✅ Multiple auto-bidders compete correctly
- ✅ Buy Now disables auto-bids
- ✅ Owner cannot auto-bid own listing
- ✅ Anti-sniping works with auto-bids
- ✅ Notifications work correctly
- ✅ No database errors or race conditions
- ✅ UI is clear and user-friendly

## Reporting Issues

If you find issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser console errors
5. Database query results (if applicable)
6. Screenshots/screen recording

---

**Testing Complete:** Once all scenarios pass, the Auto Bid feature is ready for production use!

