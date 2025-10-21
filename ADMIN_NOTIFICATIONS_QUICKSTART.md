# Admin Notifications - Quick Start

Get admin email notifications for new users and listings in 5 minutes.

---

## What You'll Get

✉️ **Email to frothmonkey@myyahoo.com when:**
- New user registers (with username, name, email)
- New listing is created (with title, description, photo, link)

---

## Quick Deploy (5 steps)

### 1. Deploy the Edge Function
```bash
supabase functions deploy send-admin-notifications --no-verify-jwt
```

### 2. Set Secrets
```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
supabase secrets set APP_URL=https://frothmonkey.com
```

### 3. Apply Migration
```bash
supabase db push
```

### 4. Create Webhooks in Supabase Dashboard

Go to: **Database → Webhooks**

#### Webhook 1: New Users
- **Name:** Admin Notification - New User
- **Table:** `admin_notification_log`
- **Events:** INSERT
- **Type:** Edge Function
- **Function:** `send-admin-notifications`
- **Condition:** `notification_type eq new_user`
- **Payload:**
```json
{
  "type": "new_user",
  "record": {
    "id": "{{ record.record_id }}",
    "username": "{{ record.metadata.username }}",
    "full_name": "{{ record.metadata.full_name }}",
    "created_at": "{{ record.metadata.created_at }}"
  }
}
```

#### Webhook 2: New Listings
- **Name:** Admin Notification - New Listing
- **Table:** `admin_notification_log`
- **Events:** INSERT
- **Type:** Edge Function
- **Function:** `send-admin-notifications`
- **Condition:** `notification_type eq new_listing`
- **Payload:**
```json
{
  "type": "new_listing",
  "record": {
    "id": "{{ record.record_id }}",
    "title": "{{ record.metadata.title }}",
    "description": "{{ record.metadata.description }}",
    "owner_id": "{{ record.metadata.owner_id }}",
    "start_price": "{{ record.metadata.start_price }}",
    "cover_image_url": "{{ record.metadata.cover_image_url }}",
    "status": "{{ record.metadata.status }}",
    "created_at": "{{ record.metadata.created_at }}"
  }
}
```

### 5. Test It
```sql
-- Test new user notification
INSERT INTO admin_notification_log (notification_type, record_id, metadata)
VALUES ('new_user', gen_random_uuid(), '{"username": "testuser", "full_name": "Test User", "created_at": "2025-10-21T12:00:00Z"}'::jsonb);
```

Check **frothmonkey@myyahoo.com** for the email! 📧

---

## Troubleshooting

**No emails?** Check:
1. Edge function logs: `supabase functions logs send-admin-notifications`
2. Webhook status in Supabase Dashboard
3. Resend dashboard: https://resend.com/emails
4. Run `TEST_ADMIN_NOTIFICATIONS.sql` for diagnostics

**Need help?** See `ADMIN_NOTIFICATIONS_GUIDE.md` for detailed instructions.

---

## Files Created

- `supabase/functions/send-admin-notifications/index.ts` - Edge function
- `supabase/migrations/044_admin_notifications_system.sql` - Database setup
- `ADMIN_NOTIFICATIONS_GUIDE.md` - Full documentation
- `TEST_ADMIN_NOTIFICATIONS.sql` - Testing queries
- `DEPLOY_ADMIN_NOTIFICATIONS.sh` - Deployment script

---

**Ready to deploy?** Run: `./DEPLOY_ADMIN_NOTIFICATIONS.sh`

