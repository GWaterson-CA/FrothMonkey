# Q&A Email Notifications Implementation Guide

## 🎉 Overview

This feature adds email notifications for the Questions & Answers functionality on listings. Users will now receive beautiful, branded emails when:

1. **Seller receives a question** - When a user asks a question on their listing
2. **User's question is answered** - When the seller answers their question

---

## 📦 What Was Implemented

### 1. Email Templates (`lib/email/templates.tsx`)

**New Templates Added:**
- ✉️ **QuestionReceivedEmail** - Notifies seller when someone asks a question
- ✉️ **QuestionAnsweredEmail** - Notifies user when their question is answered

Both templates feature:
- FrothMonkey logo and branding
- Listing image preview
- Question text displayed prominently
- Answer text (for answered notifications)
- Responsive design (mobile & desktop)
- Clear call-to-action buttons
- Direct links to listings

### 2. Email Service (`lib/email/send-notification-email.ts`)

**Updates:**
- Added imports for new email templates
- Added cases for `question_received` and `question_answered` notification types
- Updated preference mapping to include new notification types

### 3. Database Migration (`supabase/migrations/041_question_email_notifications.sql`)

**What it does:**
- Adds `question_answered` to the notification types constraint
- Creates `notify_question_answered()` function
- Creates trigger to automatically send notifications when questions are answered
- Updates `notify_question_received()` function to include asker name in metadata
- Updates notification preferences for all existing users
- Sets default preferences for new users

**Functions:**
- `notify_question_received()` - Triggers when a question is created (updated)
- `notify_question_answered()` - Triggers when a question is answered (new)

**Triggers:**
- `trigger_notify_question_received` - Already exists, updated metadata
- `trigger_notify_question_answered` - New trigger on `auction_questions` UPDATE

### 4. Edge Function (`supabase/functions/send-notification-emails/index.ts`)

**Updates:**
- Added `question_received` and `question_answered` to `emailableTypes` array
- Added preference checks for new notification types
- Added HTML email templates for both notification types
- Metadata handling for question text, answer text, and user names

---

## 🔔 Notification Flow

### When a User Asks a Question:

```
User submits question via POST /api/questions
    ↓
Database INSERT on auction_questions table
    ↓
trigger_notify_question_received fires
    ↓
notify_question_received() function runs
    ↓
Creates notification in notifications table
    ↓
Database webhook triggers edge function
    ↓
send-notification-emails edge function
    ↓
Checks seller's notification preferences
    ↓
Sends email via Resend to seller
    ↓
Seller receives "New Question" email
```

### When a Seller Answers a Question:

```
Seller submits answer via PATCH /api/questions/[id]/answer
    ↓
Database UPDATE on auction_questions table
    ↓
trigger_notify_question_answered fires
    ↓
notify_question_answered() function runs
    ↓
Creates notification in notifications table
    ↓
Database webhook triggers edge function
    ↓
send-notification-emails edge function
    ↓
Checks user's notification preferences
    ↓
Sends email via Resend to questioner
    ↓
User receives "Question Answered" email
```

---

## 📧 Email Content

### Question Received Email (Seller)

**Subject:** "New question on '{listing title}'"

**Content:**
- Greeting with seller's name
- Who asked the question
- Listing preview with image
- Question text in highlighted box
- "Answer Question" button linking to listing
- Tip about building trust with buyers

### Question Answered Email (Questioner)

**Subject:** "Your question about '{listing title}' was answered"

**Content:**
- Greeting with user's name
- Who answered the question
- Listing preview with image
- Original question (grayed out)
- Answer text (prominent)
- "View Listing" button
- Encouragement to place a bid

---

## ⚙️ Notification Preferences

Users can control these notifications in **Account Settings > Notifications**:

### New Preference Keys:
- `question_received` (boolean) - For sellers receiving questions
- `question_answered` (boolean) - For users getting answers

### Default Settings:
Both are enabled by default (`true`)

### How to Disable:
Users can disable in their account settings:
1. Go to `/account/settings`
2. Navigate to Notifications tab
3. Toggle "Question Received" or "Question Answered"

---

## 🚀 Deployment

### Prerequisites:
- Supabase CLI installed
- Connected to your Supabase project
- Resend API key configured

### Quick Deploy:

```bash
# Run the deployment script
chmod +x DEPLOY_QUESTION_NOTIFICATIONS.sh
./DEPLOY_QUESTION_NOTIFICATIONS.sh
```

### Manual Deploy:

```bash
# 1. Apply database migration
supabase db push

# 2. Deploy edge function
supabase functions deploy send-notification-emails

# 3. Verify deployment
supabase db execute < CHECK_QUESTION_NOTIFICATIONS.sql
```

---

## 🧪 Testing

### Manual Testing:

1. **Test Question Received:**
   - Log in as User A
   - Create a listing as User A
   - Log in as User B
   - Ask a question on User A's listing
   - Check User A's email for "New question" notification

2. **Test Question Answered:**
   - Log in as User A (listing owner)
   - Go to the listing with the question
   - Answer the question
   - Check User B's email for "Question answered" notification

### SQL Testing Script:

```sql
-- Check notifications were created
SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.created_at,
    n.read_at,
    p.username as recipient,
    l.title as listing_title
FROM notifications n
JOIN profiles p ON p.id = n.user_id
LEFT JOIN listings l ON l.id = n.listing_id
WHERE n.type IN ('question_received', 'question_answered')
ORDER BY n.created_at DESC
LIMIT 10;

-- Check question records
SELECT 
    aq.id,
    aq.question,
    aq.answer,
    aq.created_at,
    aq.answered_at,
    p.username as questioner,
    l.title as listing_title
FROM auction_questions aq
JOIN profiles p ON p.id = aq.questioner_id
JOIN listings l ON l.id = aq.listing_id
ORDER BY aq.created_at DESC
LIMIT 10;
```

---

## 🔍 Troubleshooting

### Issue: Emails not being sent

**Possible causes:**
1. User has disabled email notifications
2. User has disabled specific notification type
3. Resend API key not configured
4. Edge function not deployed

**Solutions:**
```sql
-- Check user preferences
SELECT 
    username,
    notification_preferences->>'email_notifications' as email_enabled,
    notification_preferences->>'question_received' as question_received,
    notification_preferences->>'question_answered' as question_answered
FROM profiles
WHERE username = 'username_here';

-- Check edge function logs
-- Go to Supabase Dashboard > Edge Functions > send-notification-emails > Logs
```

### Issue: Notifications created but no emails

**Check:**
1. Edge function webhook is configured
2. Edge function has RESEND_API_KEY set
3. Check edge function logs for errors

### Issue: Wrong user receiving notification

**Check:**
1. Verify listing ownership
2. Check questioner_id in auction_questions
3. Review notification user_id

---

## 📊 Database Schema

### Notifications Table:
```sql
type TEXT CHECK (type IN (
    'question_received',      -- NEW
    'question_answered',      -- NEW
    'first_bid_received',
    'reserve_met',
    'listing_ended',
    'bid_outbid',
    'auction_won',
    -- ... other types
))

metadata JSONB:
  For question_received:
    - question_id (UUID)
    - question (TEXT)
    - asker_name (TEXT)
  
  For question_answered:
    - question_id (UUID)
    - question (TEXT)
    - answer (TEXT)
    - seller_name (TEXT)
```

### Profiles Table (notification_preferences):
```json
{
  "email_notifications": true,
  "question_received": true,
  "question_answered": true,
  "bid_outbid": true,
  "auction_won": true,
  // ... other preferences
}
```

---

## 📝 Files Modified/Created

### Created:
- ✅ `supabase/migrations/041_question_email_notifications.sql`
- ✅ `DEPLOY_QUESTION_NOTIFICATIONS.sh`
- ✅ `QUESTION_NOTIFICATIONS_GUIDE.md` (this file)
- ✅ `TEST_QUESTION_NOTIFICATIONS.sql`

### Modified:
- ✅ `lib/email/templates.tsx` - Added QuestionReceivedEmail and QuestionAnsweredEmail
- ✅ `lib/email/send-notification-email.ts` - Added handlers for new notification types
- ✅ `supabase/functions/send-notification-emails/index.ts` - Added email templates and logic

---

## 🎯 Success Criteria

✅ Sellers receive email when users ask questions
✅ Users receive email when sellers answer questions
✅ Emails include all relevant information (question, answer, listing details)
✅ Emails are branded and responsive
✅ Users can disable notifications in settings
✅ Notification preferences are respected
✅ Database triggers fire correctly
✅ Edge function processes notifications

---

## 🔗 Related Documentation

- [Email Notifications Implementation](EMAIL_NOTIFICATIONS_IMPLEMENTATION.md)
- [Email Notifications Setup](EMAIL_NOTIFICATIONS_SETUP.md)
- [Notifications System Setup](NOTIFICATIONS_SETUP.md)
- [Q&A Feature Documentation](ANSWER_IMAGES_IMPLEMENTATION.md)

---

## 💡 Future Enhancements

Potential improvements for future versions:

1. **Batch Notifications** - Group multiple questions from same listing
2. **Reply Threading** - Email threads for follow-up questions
3. **Question Reminders** - Remind seller to answer unanswered questions
4. **Smart Timing** - Send digest emails instead of instant for frequent questions
5. **Question Previews** - Show other Q&As in the email for context

---

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review edge function logs in Supabase Dashboard
3. Check database triggers are active
4. Verify notification records are being created
5. Test with admin test page at `/admin/email-test`

---

**Last Updated:** October 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

