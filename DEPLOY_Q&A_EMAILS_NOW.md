# 🚨 Deploy Q&A Email Notifications - URGENT

## Issue
Someone asked a question on your listing but no email was sent because **the migration hasn't been deployed yet**.

---

## Quick Fix - Deploy in 3 Steps

### Step 1: Apply the Database Migration

**Option A - Via Supabase Dashboard (EASIEST):**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/041_question_email_notifications.sql`
4. Copy ALL the contents
5. Paste into SQL Editor
6. Click **Run**

**Option B - Via Supabase CLI:**
```bash
# If you have Supabase linked to your project
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"
supabase db push
```

**Option C - Manually via SQL:**
If the above don't work, run this SQL directly in your Supabase SQL Editor:

```sql
-- Copy the entire contents of:
supabase/migrations/041_question_email_notifications.sql
```

---

### Step 2: Deploy the Updated Edge Function

**Via Supabase Dashboard:**
1. Go to **Edge Functions** in your Supabase Dashboard
2. Click on `send-notification-emails`
3. Click **Deploy New Version**
4. Upload or paste the contents from:
   `supabase/functions/send-notification-emails/index.ts`

**Via Supabase CLI:**
```bash
supabase functions deploy send-notification-emails
```

---

### Step 3: Test It Works

**Option A - Via Admin Test Page (Easiest):**
1. Go to `https://your-domain.com/admin/email-test`
2. Select notification type: **"Question Received (Seller)"**
3. Enter your email address
4. Click **Send Test Email**
5. Check your email (and spam folder)

**Option B - Via SQL Test Script:**
1. Go to Supabase SQL Editor
2. Run the file: `TEST_QUESTION_NOTIFICATIONS.sql`
3. Check your email inbox

---

## ⚠️ IMPORTANT: Why the Email Wasn't Sent

The question that was just asked **before the migration was deployed** won't trigger an email because:

1. ✅ The question was saved in the database
2. ❌ But the trigger `trigger_notify_question_received` doesn't exist yet
3. ❌ So no notification was created
4. ❌ So no email was sent

**Solution:** Once deployed, all **NEW questions** will trigger emails automatically.

---

## 📧 Manually Send Email for Existing Question (Optional)

If you want to send an email for the question that was already asked, run this SQL after deploying:

```sql
-- Replace with actual values from your listing
DO $$
DECLARE
    the_listing_id UUID := '3ba8cbf9-70ea-4adc-981d-758a8082cd42';
    the_question_id UUID; -- Will be found
BEGIN
    -- Find the most recent unanswered question on this listing
    SELECT id INTO the_question_id
    FROM auction_questions
    WHERE listing_id = the_listing_id
      AND answer IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Manually trigger the notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        listing_id,
        related_user_id,
        metadata
    )
    SELECT 
        l.owner_id,
        'question_received',
        'New Question on Your Listing',
        COALESCE(p.full_name, p.username, 'Someone') || ' asked a question about "' || l.title || '"',
        aq.listing_id,
        aq.questioner_id,
        jsonb_build_object(
            'question_id', aq.id,
            'question', aq.question,
            'asker_name', COALESCE(p.full_name, p.username, 'Someone')
        )
    FROM auction_questions aq
    JOIN listings l ON l.id = aq.listing_id
    JOIN profiles p ON p.id = aq.questioner_id
    WHERE aq.id = the_question_id;
    
    RAISE NOTICE 'Notification created! Email should be sent shortly.';
END $$;
```

---

## ✅ Verify Deployment Worked

Run this to verify everything is set up:

```sql
-- Check the trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_notify_question_received';

-- Should return 1 row
```

---

## 🎯 After Deployment

Once deployed:
- ✅ All new questions will automatically trigger emails to sellers
- ✅ All new answers will automatically trigger emails to questioners
- ✅ Users can test via Admin > Email Test page
- ✅ Users can disable in Account Settings if desired

---

## 🆘 Troubleshooting

**Still no emails after deployment?**

1. Check user notification preferences:
```sql
SELECT 
    username, 
    notification_preferences->>'email_notifications' as email_enabled,
    notification_preferences->>'question_received' as question_received_enabled
FROM profiles 
WHERE id = (SELECT owner_id FROM listings WHERE id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42');
```

2. Check if notifications are being created:
```sql
SELECT * FROM notifications 
WHERE type = 'question_received' 
ORDER BY created_at DESC 
LIMIT 5;
```

3. Check edge function logs in Supabase Dashboard:
   - Go to **Edge Functions** > `send-notification-emails` > **Logs**
   - Look for errors or "skipped" messages

---

## Need Help?

See the full guide: `QUESTION_NOTIFICATIONS_GUIDE.md`

