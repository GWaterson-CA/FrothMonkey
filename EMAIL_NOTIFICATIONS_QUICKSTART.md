# Email Notifications - Quick Start

## 🚀 Get Started in 5 Minutes

### Step 1: Add Environment Variable

Add this to your `.env.local` file (create it if it doesn't exist):

```bash
RESEND_API_KEY=re_9YeYT3LL_74CABnXyXYraSQThQvjya8Qt
```

### Step 2: Apply Database Migration

Run this command in your terminal:

```bash
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"
npx supabase db push
```

Or apply the migration manually in Supabase Dashboard:
- Go to SQL Editor
- Paste the contents of `supabase/migrations/029_email_notifications.sql`
- Click Run

### Step 3: Test It!

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to the admin email test page:
   ```
   http://localhost:3000/admin/email-test
   ```

3. Enter your email address and click "Send Test Email"

4. Check your inbox! 📧

---

## 📋 What's Included

✅ **Outbid Notifications** - Users get emailed when outbid  
✅ **Time Warnings** - Customizable (1h to 48h) before auction ends  
✅ **Auction Ended** - Seller notified when listing ends  
✅ **Auction Won** - Winner notified when they win  
✅ **Beautiful Email Templates** - Responsive with FrothMonkey branding  
✅ **User Preferences** - Users control what emails they receive  
✅ **Admin Test Interface** - Test emails anytime at `/admin/email-test`

---

## 🎯 Email Triggers

| Event | Who Gets Notified | When |
|-------|------------------|------|
| User outbid | Previous highest bidder | Immediately |
| Auction ending soon | All bidders | Based on user preference (1-48h) |
| Auction ends | Seller | When listing ends |
| Auction won | Winner | When reserve met or Buy Now |

---

## 🔧 User Notification Settings

Users can customize their preferences at: `/account/settings`

- Master email on/off switch
- Individual notification type toggles
- Choose warning timeframe (1h, 2h, 3h, 6h, 12h, 24h, 48h)

---

## 📊 Current Configuration

```
Email Provider: Resend
Sender: FrothMonkey <updates@frothmonkey.com>
SMTP: smtp.resend.com:587
Status: ✅ Ready to use
```

---

## 🔍 How It Works

1. **User Action** → Bid placed, auction ends, etc.
2. **Database Trigger** → Creates notification in database
3. **Webhook Fires** → Supabase webhook detects new notification
4. **Email Sent** → Resend API sends email to user

All automatic! 🎉

---

## 🧪 Testing Scenarios

Test all notification types in the admin panel:

1. **Simple Test Email** - Basic test to verify system works
2. **Outbid Notification** - See what users see when outbid
3. **24 Hour Warning** - Preview time warning emails
4. **2 Hour Warning** - Preview urgent time warning
5. **Auction Ended (Seller)** - What sellers see when listing ends
6. **Auction Won (Buyer)** - What winners see

---

## 💡 Pro Tips

- Set up the webhook in Supabase Dashboard for automatic emails
- Set up the cron job for time warnings (runs every hour)
- Monitor email delivery in Resend Dashboard
- Test with your real email first!

---

## 🆘 Quick Troubleshooting

**Emails not sending?**
1. Check RESEND_API_KEY is in .env.local
2. Restart your dev server
3. Check browser console for errors

**Emails going to spam?**
1. Verify domain in Resend Dashboard
2. Set up SPF/DKIM records
3. Ask users to whitelist updates@frothmonkey.com

---

## 📚 Full Documentation

For detailed setup and configuration, see: `EMAIL_NOTIFICATIONS_SETUP.md`

---

## ✨ You're All Set!

The email notification system is now integrated and ready to use. Visit `/admin/email-test` to send your first test email! 🎉

