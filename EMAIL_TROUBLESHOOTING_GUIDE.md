# Email Notifications Troubleshooting Guide

## Problem: Test emails show "Success" but don't arrive

If you're seeing a success message but emails aren't arriving, follow these steps:

### Step 1: Check the Console Logs

The improved logging will now show detailed information. Check your terminal where Next.js is running for logs prefixed with `[API]` and `[Email]`:

```
[API] /api/email/send-test - Request received
[API] User authenticated: user-id
[API] Admin access verified
[API] RESEND_API_KEY is configured
[Email] Preparing to send test_email email to test@example.com
[Email] Rendering email template...
[Email] Sending email via Resend...
[Email] From: FrothMonkey <updates@frothmonkey.com>
[Email] To: test@example.com
[Email] Subject: Test Email from FrothMonkey
[Email] ✅ Email sent successfully to test@example.com
```

If you see error messages like:
- `❌ RESEND_API_KEY is not set` - Go to Step 2
- `❌ Error sending email` - Check the error details and go to Step 3

### Step 2: Configure Resend API Key

1. **Get your Resend API key:**
   - Go to https://resend.com/api-keys
   - Create a new API key if you don't have one
   - Copy the API key (it starts with `re_`)

2. **Add to your `.env.local` file:**
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   ```

3. **Restart your Next.js development server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

4. **Important:** Make sure `.env.local` is in your `.gitignore` (it should be by default)

### Step 3: Verify Domain in Resend

For production use, you need to verify your sending domain:

1. Go to https://resend.com/domains
2. Add `frothmonkey.com` as a domain
3. Add the required DNS records (SPF, DKIM, DMARC)
4. Wait for verification (can take a few hours)

**For testing:** You can use Resend's default domain or send to the same email address you used to sign up for Resend.

### Step 4: Check Email Address Restrictions

Resend has restrictions on development API keys:

- **Development keys:** Can only send to:
  - The email address you used to sign up for Resend
  - Email addresses you've verified in Resend
  
- **Production keys:** Can send to any email address (but domain must be verified)

**Solution:** 
1. Try sending to the email address you used for your Resend account
2. Or verify additional email addresses at https://resend.com/settings/verified-emails

### Step 5: Check Spam Folder

Sometimes emails end up in spam, especially during testing:

1. Check your spam/junk folder
2. Mark as "Not Spam" if found there
3. This helps train email filters

### Step 6: Check Resend Dashboard

1. Go to https://resend.com/emails
2. Check if the email appears in your sent emails list
3. Check the status (sent, delivered, bounced, etc.)
4. Review any error messages

### Step 7: Common Issues and Solutions

#### Issue: "Invalid API key" error
- Double-check your API key is correct
- Ensure there are no extra spaces or quotes
- Regenerate the API key in Resend if needed

#### Issue: "From address not verified"
- The sender email (`updates@frothmonkey.com`) must match your verified domain
- Option 1: Verify the domain `frothmonkey.com` in Resend
- Option 2: Change `EMAIL_FROM` in `/lib/email/resend-client.ts` to use your verified domain

#### Issue: Email appears sent but never arrives
- Check if you're using a development API key
- Verify you're sending to an allowed email address (see Step 4)
- Check your email service's delivery logs
- Ensure you have valid DNS records (SPF, DKIM) for production

### Environment Variables Checklist

Make sure you have these in your `.env.local`:

```bash
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Your site URL (used in email links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # for development
# NEXT_PUBLIC_SITE_URL=https://frothmonkey.com  # for production
```

### Testing Tips

1. **Start simple:** Use the "Test Email (Simple)" type first
2. **Use your own email:** Send to the email you used to sign up for Resend
3. **Check logs first:** Always check the console logs before assuming success
4. **Wait a moment:** Emails can take 10-30 seconds to arrive
5. **Check Resend dashboard:** Verify the email was actually sent

### Still Not Working?

If you've tried all the above and it's still not working:

1. Check the detailed error logs in your terminal
2. Copy any error messages
3. Check Resend's status page: https://resend.com/status
4. Review Resend's documentation: https://resend.com/docs
5. Contact Resend support with your error logs

## Quick Command to Check Environment

Run this in your terminal to check if the API key is set:

```bash
# Check if RESEND_API_KEY is set (won't show the actual value for security)
if [ -f .env.local ]; then
  echo "✓ .env.local exists"
  if grep -q "RESEND_API_KEY" .env.local; then
    echo "✓ RESEND_API_KEY is defined in .env.local"
  else
    echo "✗ RESEND_API_KEY not found in .env.local"
  fi
else
  echo "✗ .env.local file not found"
fi
```

## Updated Test Workflow

1. Open `/admin/email-test`
2. Enter your email address (use the one from your Resend account)
3. Click "Send Test Email"
4. **Immediately switch to your terminal** to see detailed logs
5. Look for `[Email] ✅ Email sent successfully` or error messages
6. Check your inbox (and spam folder)
7. Check Resend dashboard if needed

The improved logging will now tell you exactly what's happening at each step!

