# Production Deployment Checklist - Email Notifications

Use this checklist when deploying the email notification system to production.

## Pre-Deployment

- [ ] **Environment Variables Set**
  - [ ] `RESEND_API_KEY` added to production environment
  - [ ] `NEXT_PUBLIC_SITE_URL` set to production URL
  - [ ] Verified in deployment platform (Vercel/other)

- [ ] **Resend Configuration**
  - [ ] Domain verified in Resend Dashboard
  - [ ] SPF record added to DNS
  - [ ] DKIM record added to DNS
  - [ ] DMARC record added to DNS (optional but recommended)
  - [ ] Test email sent from updates@frothmonkey.com

## Database Setup

- [ ] **Apply Migration**
  ```bash
  supabase db push --project-ref YOUR_PROJECT_REF
  ```
  Or apply manually in Supabase Dashboard SQL Editor

- [ ] **Verify Migration Applied**
  ```sql
  -- Check if functions exist
  SELECT routine_name 
  FROM information_schema.routines 
  WHERE routine_name IN (
    'create_time_warning_notifications',
    'notify_auction_ended',
    'trigger_send_notification_email'
  );
  ```

- [ ] **Test Database Functions**
  ```sql
  -- Test notification creation
  SELECT create_notification(
    'YOUR_USER_ID'::uuid,
    'test_email',
    'Test',
    'Test message',
    NULL,
    NULL,
    '{}'::jsonb
  );
  ```

## Supabase Edge Functions

- [ ] **Deploy Edge Function**
  ```bash
  supabase functions deploy send-notification-emails --project-ref YOUR_PROJECT_REF
  ```

- [ ] **Set Environment Variables for Edge Function**
  ```bash
  supabase secrets set APP_URL=https://frothmonkey.com --project-ref YOUR_PROJECT_REF
  ```

- [ ] **Test Edge Function**
  ```bash
  supabase functions invoke send-notification-emails \
    --data '{"record":{"id":"test-id","type":"test_email","user_id":"YOUR_USER_ID"}}' \
    --project-ref YOUR_PROJECT_REF
  ```

## Webhook Configuration

- [ ] **Create Database Webhook**
  1. Go to Supabase Dashboard → Database → Webhooks
  2. Click "Create a new hook"
  3. Configure:
     - Name: `send-notification-emails`
     - Table: `notifications`
     - Events: `INSERT`
     - Type: `Edge Function`
     - Edge Function: `send-notification-emails`
  4. Click "Create webhook"

- [ ] **Test Webhook**
  - Create a test notification in database
  - Check edge function logs
  - Verify email was sent

## Cron Jobs Setup

- [ ] **Create Time Warning Cron Job**
  1. Go to Supabase Dashboard → Database → Cron Jobs
  2. Click "Create a new cron job"
  3. Configure:
     - Name: `schedule-time-notifications`
     - Schedule: `0 * * * *` (every hour)
     - SQL: `SELECT schedule_time_notifications();`
  4. Click "Create cron job"

- [ ] **Create Auction Finalization Cron Job** (if not already set up)
  1. Name: `finalize-auctions`
  2. Schedule: `*/5 * * * *` (every 5 minutes)
  3. SQL: `SELECT finalize_auctions();`

## Application Deployment

- [ ] **Deploy to Production**
  - [ ] Code pushed to main branch
  - [ ] Build successful
  - [ ] Deployment completed

- [ ] **Verify Routes**
  - [ ] `/api/email/send-notification` returns 401 for unauthorized
  - [ ] `/api/email/send-test` requires admin auth
  - [ ] `/admin/email-test` accessible to admins only

## Testing in Production

- [ ] **Send Test Email (Admin Panel)**
  1. Log in as admin
  2. Go to `/admin/email-test`
  3. Send test email to your address
  4. Verify receipt

- [ ] **Test Each Notification Type**
  - [ ] Test Email (Simple)
  - [ ] Outbid Notification
  - [ ] Time Warning (24h)
  - [ ] Time Warning (2h)
  - [ ] Auction Ended (Seller)
  - [ ] Auction Won (Buyer)

- [ ] **Test Real Workflow**
  - [ ] Create test listing
  - [ ] Place bids from different accounts
  - [ ] Verify outbid email sent
  - [ ] Wait for auction to end
  - [ ] Verify auction ended emails sent

## Monitoring Setup

- [ ] **Set Up Email Monitoring**
  - [ ] Check Resend Dashboard for delivery stats
  - [ ] Set up alerts for high bounce rates
  - [ ] Monitor spam complaints

- [ ] **Set Up Application Monitoring**
  - [ ] Monitor edge function logs
  - [ ] Set up alerts for failed email sends
  - [ ] Track notification creation rate

- [ ] **Create Monitoring Dashboard** (optional)
  ```sql
  -- Query for monitoring
  SELECT 
    type,
    COUNT(*) as total,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h
  FROM notifications
  GROUP BY type;
  ```

## User Communication

- [ ] **Update Help Docs**
  - [ ] Document email notification features
  - [ ] Explain notification preferences
  - [ ] Add FAQ about emails

- [ ] **Notify Users** (optional)
  - [ ] Send announcement about new feature
  - [ ] Highlight customizable preferences
  - [ ] Provide link to settings

## Rollback Plan

In case of issues:

- [ ] **Disable Webhook**
  - Go to Supabase Dashboard → Webhooks
  - Disable `send-notification-emails` webhook

- [ ] **Disable Cron Job**
  - Go to Supabase Dashboard → Cron Jobs
  - Disable `schedule-time-notifications`

- [ ] **Emergency Email Disable**
  ```sql
  -- Disable email sending in trigger (emergency only)
  DROP TRIGGER IF EXISTS trigger_send_email_on_notification ON notifications;
  ```

## Post-Deployment Verification

After 24 hours, verify:

- [ ] **Email Delivery Rate**
  - Check Resend Dashboard
  - Delivery rate > 95%
  - Bounce rate < 5%
  - No spam complaints

- [ ] **User Feedback**
  - No complaints about spam
  - Positive feedback about emails
  - Check support tickets

- [ ] **System Performance**
  - No increase in response times
  - Edge function executing successfully
  - Database performance normal

- [ ] **Notification Stats**
  ```sql
  -- Check notification creation (last 24h)
  SELECT 
    type,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age_seconds
  FROM notifications
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY type;
  ```

## Success Criteria

✅ All test emails received  
✅ Real workflow emails working  
✅ No errors in logs  
✅ Delivery rate > 95%  
✅ User preferences respected  
✅ Admin test page functional  

## Support Contacts

- **Resend Support:** support@resend.com
- **Supabase Support:** Via dashboard support chat
- **DNS/Domain:** Your domain registrar

## Notes

- Keep Resend API key secure
- Monitor email deliverability daily for first week
- Adjust cron job frequency if needed
- Document any issues for troubleshooting

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Notes:** _____________________________________________

________________________________________________________

________________________________________________________

