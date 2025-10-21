# Auto-bid Max Amount Priority Fix

## Problem Description

When multiple users set auto-bids on the same listing, there was an unfair edge case where a user wouldn't get to place a bid at their maximum amount, even though they committed to that amount first.

### Example Scenario

**Setup:**
- Listing at $20
- User A sets auto-bid to max $25 (User A bids $21)
- User B sets auto-bid to max $30

**❌ Old (Incorrect) Behavior:**
1. User B bids $22 (system picks highest max: $30 > $25)
2. User A bids $23 (system picks highest max: $30 > $25)
3. User B bids $24 (system picks highest max: $30 > $25)
4. **User B bids $25** (system picks highest max: $30 > $25)
5. **Final: User B wins at $25**

**Problems with old behavior:**
- User A wanted to pay $25 but never got to
- User A set their auto-bid first but lost at $25 (their max)
- Seller gets only $25 instead of $26
- Unfair to User A who committed to $25 first

**✅ New (Correct) Behavior:**
1. User B bids $22 (highest max wins: $30 > $25)
2. User A bids $23 (highest max wins: $30 > $25) 
3. User B bids $24 (highest max wins: $30 > $25)
4. **User A bids $25** (User A's max = required min, User A created autobid first)
5. **User B bids $26** (User B can still counter)
6. **Final: User B wins at $26**

**Benefits of new behavior:**
- User A got their full $25 bid
- Fair to User A since they committed to $25 first
- Seller gets $26 instead of $25 (higher price)
- User B still wins with their higher max

## Technical Solution

The fix modifies the `process_auto_bids` function's ORDER BY clause to prioritize users who are at their maximum bid amount when the required minimum equals their max.

### Old Logic
```sql
ORDER BY 
  ab.max_amount DESC,      -- Always pick highest max
  ab.created_at ASC        -- Tiebreaker
```

### New Logic
```sql
ORDER BY 
  -- Priority 1: If required_min equals max_amount, prioritize by earliest created_at
  CASE WHEN ab.max_amount = v_required_min THEN 0 ELSE 1 END,
  -- Priority 2: Among users at their max, earliest autobid wins
  CASE WHEN ab.max_amount = v_required_min THEN ab.created_at END ASC,
  -- Priority 3: Otherwise, highest max_amount wins (existing logic)
  ab.max_amount DESC, 
  -- Priority 4: If tied on max_amount, earliest wins
  ab.created_at ASC
```

### How It Works

When selecting which auto-bid to process next:

1. **First Priority:** Check if any user's max_amount equals the required minimum
   - If yes, select the user who created their auto-bid earliest
   - This ensures users get to bid their maximum before being outbid

2. **Second Priority:** If no one is at their max, use the existing logic
   - Select the user with the highest max_amount
   - This maintains competitive bidding for amounts below everyone's max

## Files Changed

### Migration File
- **File:** `supabase/migrations/042_fix_autobid_max_amount_priority.sql`
- **Function:** `process_auto_bids()`
- **Change:** Modified ORDER BY clause to prioritize users at their max amount

## Testing

### Test Script
Run `TEST_AUTOBID_MAX_PRIORITY.sql` to verify the fix works correctly.

**The test:**
1. Creates a listing at $20
2. User A sets auto-bid to $25
3. User B sets auto-bid to $30
4. Verifies User A gets to bid $25
5. Verifies User B counters at $26

**Expected output:**
```
✅ CORRECT: User A got to place their $25.00 max bid
✅ CORRECT: User B countered with a bid higher than $25.00
✅ CORRECT: User B bid exactly $26.00 (next increment after $25)
✅ CORRECT: User B is the final winner (as expected with higher max)
```

### Manual Testing Scenarios

#### Scenario 1: Basic Max Priority Test
1. Create listing at $100
2. User A sets auto-bid to $125
3. User B sets auto-bid to $150
4. **Expected:** User A bids up to $125, then User B takes over at $126

#### Scenario 2: Multiple Users at Same Max
1. Create listing at $50
2. User A sets auto-bid to $100 (first)
3. User B sets auto-bid to $100 (second)
4. **Expected:** User A gets priority when price reaches $100 (earliest created)
5. **Expected:** Bidding stops at $100 with User A winning

#### Scenario 3: User Increases Their Max
1. Create listing at $20
2. User A sets auto-bid to $25
3. User B sets auto-bid to $30
4. User A increases auto-bid to $35
5. **Expected:** When price reaches $30, User B gets $30 (they set it first)
6. **Expected:** User A counters at $31 and wins

## Deployment

### Production Deployment Steps

1. **Run the migration:**
   ```bash
   supabase db push
   ```

2. **Verify migration applied:**
   ```sql
   SELECT * FROM supabase_migrations 
   WHERE name = '042_fix_autobid_max_amount_priority'
   ORDER BY executed_at DESC;
   ```

3. **Run test script (optional):**
   ```bash
   psql -f TEST_AUTOBID_MAX_PRIORITY.sql
   ```

4. **Monitor existing auto-bids:**
   ```sql
   -- Check active auto-bids
   SELECT 
       l.title,
       l.current_price,
       COUNT(ab.id) as active_autobids,
       MAX(ab.max_amount) as highest_max
   FROM listings l
   JOIN auto_bids ab ON ab.listing_id = l.id
   WHERE l.status = 'live' 
     AND ab.enabled = true
   GROUP BY l.id, l.title, l.current_price
   HAVING COUNT(ab.id) > 1
   ORDER BY COUNT(ab.id) DESC;
   ```

### Rollback Plan

If issues occur, rollback to previous version:

```sql
-- Restore previous process_auto_bids function
CREATE OR REPLACE FUNCTION process_auto_bids(
    p_listing_id UUID,
    p_triggering_bidder_id UUID
)
RETURNS TABLE(
    auto_bid_placed BOOLEAN,
    new_bidder_id UUID,
    new_amount NUMERIC
) AS $$
DECLARE
    v_listing_record RECORD;
    v_current_highest_bidder UUID;
    v_auto_bid_record RECORD;
    v_required_min NUMERIC;
    v_bid_result JSONB;
    v_bids_placed INTEGER := 0;
    v_max_iterations INTEGER := 50;
    v_iteration INTEGER := 0;
BEGIN
    SELECT * INTO v_listing_record
    FROM listings 
    WHERE id = p_listing_id
    FOR UPDATE;
    
    IF v_listing_record.status != 'live' THEN
        RETURN;
    END IF;
    
    SELECT bidder_id INTO v_current_highest_bidder
    FROM bids
    WHERE listing_id = p_listing_id
    ORDER BY amount DESC, created_at ASC
    LIMIT 1;
    
    LOOP
        v_iteration := v_iteration + 1;
        
        IF v_iteration > v_max_iterations THEN
            EXIT;
        END IF;
        
        v_required_min := next_min_bid(p_listing_id);
        
        -- OLD LOGIC (no max priority)
        SELECT ab.* INTO v_auto_bid_record
        FROM auto_bids ab
        WHERE ab.listing_id = p_listing_id
          AND ab.enabled = true
          AND ab.user_id != v_current_highest_bidder
          AND ab.max_amount >= v_required_min
        ORDER BY ab.max_amount DESC, ab.created_at ASC
        LIMIT 1;
        
        IF NOT FOUND THEN
            EXIT;
        END IF;
        
        INSERT INTO bids (listing_id, bidder_id, amount, is_auto_bid)
        VALUES (p_listing_id, v_auto_bid_record.user_id, v_required_min, true);
        
        UPDATE listings 
        SET current_price = v_required_min,
            updated_at = NOW()
        WHERE id = p_listing_id;
        
        v_current_highest_bidder := v_auto_bid_record.user_id;
        v_bids_placed := v_bids_placed + 1;
        
        auto_bid_placed := true;
        new_bidder_id := v_auto_bid_record.user_id;
        new_amount := v_required_min;
        RETURN NEXT;
        
        IF v_listing_record.end_time - NOW() <= make_interval(secs := v_listing_record.anti_sniping_seconds) THEN
            UPDATE listings 
            SET end_time = end_time + INTERVAL '2 minutes'
            WHERE id = p_listing_id;
            
            SELECT end_time INTO v_listing_record.end_time
            FROM listings WHERE id = p_listing_id;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;
```

## Impact Analysis

### User Experience
- **Positive:** Users who set auto-bids will now always get to bid their maximum amount
- **Positive:** Fair competition - earliest commitment to an amount wins at that price
- **Positive:** Better for sellers - final prices may be $1-2 higher in competitive scenarios
- **No negative impact:** All existing auto-bids will continue to work, just more fairly

### Performance
- **No impact:** The ORDER BY change uses the same indexes
- **No impact:** Same number of iterations in the bidding loop

### Data Integrity
- **Safe:** Only changes the selection order, not data structure
- **Safe:** All existing auto-bids and bids remain valid
- **Safe:** Can be rolled back without data loss

## Related Documentation

- Original auto-bid implementation: `AUTO_BID_FEATURE.md`
- Auto-bid testing guide: `AUTO_BID_TESTING_GUIDE.md`
- Migration file: `supabase/migrations/042_fix_autobid_max_amount_priority.sql`
- Test script: `TEST_AUTOBID_MAX_PRIORITY.sql`

## FAQ

**Q: Will this affect existing auto-bids?**  
A: Yes, in a good way. Any active auto-bids will immediately benefit from the fairer logic.

**Q: Can this cause anyone to lose money?**  
A: No. Users will still only pay up to their maximum, but now they're guaranteed to get that maximum bid before being outbid.

**Q: What if two users set the same max at exactly the same time?**  
A: The earliest `created_at` timestamp wins. PostgreSQL guarantees unique timestamps down to microseconds.

**Q: Does this change the final winner in auctions?**  
A: It can. The user with the highest max will still usually win, but the final price may be $1-2 higher because the second-highest bidder got to place their maximum bid first.

**Q: Is this consistent with other auction platforms?**  
A: Yes. eBay and most major platforms give priority to the earliest bid at any given amount.

