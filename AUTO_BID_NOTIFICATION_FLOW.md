# 🔄 Auto-Bid Email Notification Flow Diagram

## Decision Flow

```
┌─────────────────────────────────────┐
│   NEW BID PLACED ON LISTING         │
│   (Triggers notify_bid_placed)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Find Previous Highest Bidder       │
│  (Person who was just outbid)       │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ Found?       │
        └──┬────────┬──┘
           │ No     │ Yes
           │        │
           ▼        ▼
    ┌─────────┐  ┌──────────────────────────────────┐
    │  DONE   │  │ Check: Does previous bidder      │
    │ (EXIT)  │  │ have active auto-bid?            │
    └─────────┘  │ SELECT FROM auto_bids            │
                 │ WHERE enabled = true             │
                 └──────────────┬───────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Has Auto-Bid Enabled? │
                    └───┬──────────────┬────┘
                   NO   │              │ YES
                        │              │
                        ▼              ▼
            ┌────────────────────┐  ┌──────────────────────────────┐
            │ SEND EMAIL         │  │ Compare: New Bid Amount      │
            │ (Classic behavior) │  │    vs                         │
            │                    │  │ Auto-Bid Max Amount          │
            │ Notification:      │  └──────────────┬───────────────┘
            │ "You've been       │                 │
            │  outbid!"          │                 ▼
            └────────────────────┘     ┌────────────────────────────┐
                                      │ New Bid > Auto-Bid Max?    │
                                      └───┬──────────────┬─────────┘
                                     NO   │              │ YES
                                          │              │
                                          ▼              ▼
                            ┌──────────────────────┐  ┌─────────────────────┐
                            │ DON'T SEND EMAIL     │  │ SEND EMAIL          │
                            │ (Auto-bid protecting)│  │ (Limit exceeded)    │
                            │                      │  │                     │
                            │ Auto-bid can still   │  │ Notification:       │
                            │ counter-bid          │  │ "Your auto-bid max  │
                            │                      │  │  of $X has been     │
                            │ User still has       │  │  exceeded!"         │
                            │ protection           │  └─────────────────────┘
                            └──────────────────────┘
```

## Scenarios Illustrated

### Scenario A: Auto-Bid Protection (No Email)

```
State: User A has auto-bid max $50, currently at $35

User B bids $40
    │
    ▼
New bid ($40) < Auto-bid max ($50)?
    │
    ▼ YES
Auto-bid counters to $45
    │
    ▼
❌ NO EMAIL SENT
✅ User A still protected
```

### Scenario B: Auto-Bid Limit Exceeded (Email Sent)

```
State: User A has auto-bid max $50, currently at $45

User B bids $60
    │
    ▼
New bid ($60) > Auto-bid max ($50)?
    │
    ▼ YES
Auto-bid CANNOT counter
    │
    ▼
📧 EMAIL SENT
❌ User A limit exceeded
```

### Scenario C: No Auto-Bid (Classic Behavior)

```
State: User A does NOT have auto-bid

User B bids higher
    │
    ▼
User A has auto-bid enabled?
    │
    ▼ NO
Classic outbid scenario
    │
    ▼
📧 EMAIL SENT
```

## Code Flow

```sql
-- 1. Get previous highest bidder
SELECT b.bidder_id, b.amount INTO previous_highest_bid
FROM bids b
WHERE b.listing_id = NEW.listing_id 
    AND b.bidder_id != NEW.bidder_id
    AND b.id != NEW.id
ORDER BY b.amount DESC, b.created_at ASC
LIMIT 1;

-- 2. If previous bidder exists, check auto-bid
IF FOUND THEN
    
    -- 3. Check if they have active auto-bid
    SELECT ab.* INTO previous_bidder_auto_bid
    FROM auto_bids ab
    WHERE ab.user_id = previous_highest_bid.bidder_id
        AND ab.listing_id = NEW.listing_id
        AND ab.enabled = true;
    
    -- 4. Determine if notification should be sent
    IF FOUND THEN
        -- Has auto-bid: check if limit exceeded
        IF NEW.amount > previous_bidder_auto_bid.max_amount THEN
            should_notify_outbid := true;  -- 📧 SEND
        ELSE
            should_notify_outbid := false; -- ❌ DON'T SEND
        END IF;
    ELSE
        -- No auto-bid: always notify
        should_notify_outbid := true;      -- 📧 SEND
    END IF;
    
    -- 5. Send notification if conditions met
    IF should_notify_outbid THEN
        PERFORM create_notification(...);
    END IF;
END IF;
```

## Truth Table

| Previous Bidder Has Auto-Bid? | New Bid > Auto-Bid Max? | Send Email? |
|-------------------------------|-------------------------|-------------|
| ❌ No                         | N/A                     | ✅ Yes      |
| ✅ Yes                        | ❌ No                   | ❌ No       |
| ✅ Yes                        | ✅ Yes                  | ✅ Yes      |

## Examples with Numbers

### Example 1: Multiple Bids, One Email

```
Timeline:
─────────────────────────────────────────────────────────

User A sets auto-bid max: $200
Initial bid placed: $105
                                                    ❌ No email
─────────────────────────────────────────────────────────

User B bids: $150
Auto-bid counters: $155
New bid ($150) < Max ($200) ✓
                                                    ❌ No email
─────────────────────────────────────────────────────────

User B bids: $180
Auto-bid counters: $185
New bid ($180) < Max ($200) ✓
                                                    ❌ No email
─────────────────────────────────────────────────────────

User B bids: $250
Auto-bid CANNOT counter
New bid ($250) > Max ($200) ✗
                                                    📧 EMAIL!
─────────────────────────────────────────────────────────

Total emails sent to User A: 1
Emails prevented: 2
Email spam reduction: 67%
```

### Example 2: Auto-Bid vs Auto-Bid

```
User A: auto-bid max $300
User B: auto-bid max $500

Timeline:
─────────────────────────────────────────────────────────

User A sets auto-bid → Bids $105               ❌ No email to A

User B sets auto-bid → Counter-bids begin
Auto-bid loop executes:
  $110 (B)                                     ❌ No email to A
  $115 (A)                                     ❌ No email to B
  $120 (B)                                     ❌ No email to A
  ... continues ...
  $300 (A) ← User A max reached
  $305 (B) ← Exceeds User A max                📧 Email to A!
  
User B wins at $305
                                               
Total emails: 1 (only to User A when limit hit)
```

### Example 3: Manual Bidding (No Auto-Bid)

```
Timeline:
─────────────────────────────────────────────────────────

User A bids: $100 (manual, no auto-bid)        ❌ No email

User B bids: $150 (manual)                      📧 Email to A

User A bids: $200 (manual, no auto-bid)        📧 Email to B

User B bids: $250 (manual)                      📧 Email to A

Total emails: 3
Classic behavior maintained for non-auto-bid users
```

## Performance Considerations

```
┌──────────────────────────────┐
│  Bid Placed (Trigger fires)  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐     ⚡ Fast: Indexed query
│  Query: Get previous bidder  │     🕐 ~1ms
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐     ⚡ Fast: Indexed query
│  Query: Check auto-bid       │     🕐 ~1ms
└──────────────┬───────────────┘     📊 Small table
               │
               ▼
┌──────────────────────────────┐     ⚡ Fast: Simple comparison
│  Logic: Compare amounts      │     🕐 <1ms
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Create notification (maybe) │     
└──────────────────────────────┘

Total overhead: ~2-3ms per bid
Impact: Negligible
```

## Visual Summary

```
🎯 GOAL: Only notify when auto-bid can't protect user anymore

📊 BEFORE FIX:
   Every bid → Email
   Result: Email spam 📧📧📧

📊 AFTER FIX:
   Auto-bid protecting → No email ✅
   Auto-bid exceeded → Email 📧
   Result: Relevant emails only

✅ BENEFITS:
   • Users happy (no spam)
   • Lower costs (fewer emails)
   • Better engagement (relevant only)
```

---

**See Also:**
- `AUTO_BID_EMAIL_NOTIFICATIONS.md` - Complete documentation
- `AUTO_BID_EMAIL_FIX_SUMMARY.md` - Implementation summary
- `QUICK_DEPLOY_AUTO_BID_EMAIL_FIX.md` - Quick deploy guide

