# FrothMonkey Email Customization Guide

This guide explains how to customize authentication emails to match your FrothMonkey branding instead of using default Supabase templates.

## 📧 Overview

Supabase sends several types of authentication emails:
- **Email Confirmation** - When users sign up
- **Password Recovery** - When users reset their password
- **Magic Link** - For passwordless login
- **Email Change** - When users update their email

## 🎨 Local Development Setup

### 1. Email Templates

Custom email templates are stored in `/supabase/templates/`:

- `confirmation.html` - Email confirmation (signup)
- `recovery.html` - Password recovery (coming soon)
- `magic_link.html` - Magic link login (coming soon)
- `email_change.html` - Email change confirmation (coming soon)

### 2. Configuration

Email settings are configured in `supabase/config.toml`:

```toml
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[auth.email.template.confirmation]
subject = "Welcome to FrothMonkey - Confirm Your Email"
content_path = "./supabase/templates/confirmation.html"

[auth.email.smtp]
sender_name = "FrothMonkey"
```

### 3. Template Variables

Available variables in email templates:

- `{{ .ConfirmationURL }}` - Confirmation link (signup)
- `{{ .Token }}` - Magic token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address

### 4. Testing Locally

After updating templates:

1. Restart your Supabase local instance:
   ```bash
   supabase stop
   supabase start
   ```

2. Test signup flow at `http://localhost:3000/auth/register`

3. Check Inbucket for emails at `http://localhost:54324`
   - Supabase local dev uses Inbucket to capture emails
   - View all sent emails in your browser

## 🚀 Production Setup (Supabase Dashboard)

### Step 1: Access Email Templates

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ysoxcftclnlmvxuopdun)
2. Navigate to **Authentication** → **Email Templates**
3. You'll see templates for:
   - Confirm signup
   - Invite user
   - Magic Link
   - Change Email Address
   - Reset Password

### Step 2: Customize Each Template

Click on each template and customize:

#### Example: Confirm Signup Template

**Subject:**
```
Welcome to FrothMonkey - Confirm Your Email
```

**Body:**
Use the HTML from `/supabase/templates/confirmation.html` as a starting point.

Key things to customize:
- Replace Supabase branding with FrothMonkey logo
- Update colors to match your brand (#3B82F6 for blue)
- Add your messaging and personality
- Include helpful next steps

### Step 3: Configure Email Sender

In **Authentication** → **Settings** → **SMTP Settings**:

#### Option A: Use Supabase SMTP (Easier)
- **Sender name**: `FrothMonkey`
- **Sender email**: Uses Supabase's email service
- ✅ No setup required
- ⚠️ May have "via Supabase" in some email clients

#### Option B: Custom SMTP (Recommended for Production)
- **Enable Custom SMTP**: Yes
- **Sender email**: `noreply@frothmonkey.com` (or your domain)
- **Sender name**: `FrothMonkey`
- **Host**: smtp.sendgrid.net (or your provider)
- **Port**: 587
- **Username**: Your SMTP username
- **Password**: Your SMTP password

Popular SMTP providers:
- **SendGrid** - 100 emails/day free
- **Mailgun** - 1,000 emails/month free
- **Amazon SES** - Very cheap, great for scale
- **Resend** - Developer-friendly, great DX

### Step 4: Update Site URL

In **Authentication** → **Settings** → **General**:
- **Site URL**: `https://frothmonkey.com` (your production domain)
- **Additional Redirect URLs**: Add any other domains you use

## 🎨 Design Tips

### Branding Consistency
- Use FrothMonkey's color scheme consistently
- Include your logo (consider hosting it on Supabase Storage or a CDN)
- Match the tone and voice of your main website

### Email Best Practices
1. **Mobile-first**: Most emails are opened on mobile
2. **Clear CTA**: Make the confirmation button obvious
3. **Plain text alternative**: Include the URL as text too
4. **Professional**: Avoid too many emojis in production
5. **Secure**: Always use HTTPS links
6. **Accessible**: Good contrast ratios, alt text for images

### Template Structure
```html
<!DOCTYPE html>
<html>
  <head>
    <!-- Meta tags for mobile -->
  </head>
  <body style="inline styles only">
    <table role="presentation">
      <!-- Header with logo -->
      <!-- Main content -->
      <!-- CTA button -->
      <!-- Footer -->
    </table>
  </body>
</html>
```

**Important**: Use inline styles only (no `<style>` tags or external CSS)

## 🧪 Testing

### Local Testing
1. Use Inbucket at `http://localhost:54324`
2. Send test emails by signing up with different email addresses
3. Check formatting on different email clients if possible

### Production Testing
1. Send test emails to yourself from Supabase Dashboard
2. Test on multiple email clients:
   - Gmail (web and mobile)
   - Apple Mail
   - Outlook
3. Check spam score using tools like [Mail Tester](https://www.mail-tester.com/)

## 🔒 Security Notes

- Never expose SMTP credentials in your repository
- Use environment variables or Supabase Secrets for sensitive data
- Regularly rotate SMTP passwords
- Monitor email sending for abuse

## 📱 Example SMTP Provider Setup (SendGrid)

1. **Create SendGrid account** at sendgrid.com
2. **Verify your domain** (or use Single Sender Verification for testing)
3. **Create API Key**:
   - Settings → API Keys → Create API Key
   - Choose "Restricted Access" and enable "Mail Send"
   - Save the API key (you won't see it again)
4. **Configure in Supabase**:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey` (literally the word "apikey")
   - Password: Your SendGrid API key

## 🚨 Troubleshooting

### Emails not sending locally
- Check Inbucket at `http://localhost:54324`
- Verify Supabase is running: `supabase status`
- Check template path in `config.toml` is correct

### Emails going to spam in production
- Verify your sending domain (SPF, DKIM, DMARC records)
- Use a reputable SMTP provider
- Avoid spam trigger words
- Include unsubscribe link (not needed for transactional emails but good practice)

### Template not updating
- Clear browser cache
- Restart Supabase local instance
- Check for HTML syntax errors in your template

### Variables not rendering
- Ensure you're using correct syntax: `{{ .VariableName }}`
- Check Supabase documentation for available variables
- Test with simple text first, then add HTML

## 📚 Additional Resources

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SendGrid Email Design Guide](https://sendgrid.com/blog/email-design-guide/)
- [HTML Email Best Practices](https://www.campaignmonitor.com/dev-resources/guides/coding-html-emails/)
- [Email on Acid](https://www.emailonacid.com/) - Email testing tool

## ✅ Checklist

### Local Development
- [x] Created email template directory
- [x] Added confirmation email template
- [x] Configured `config.toml`
- [ ] Test with Inbucket
- [ ] Create other email templates (recovery, magic link)

### Production
- [ ] Access Supabase Dashboard email templates
- [ ] Customize all email templates
- [ ] Set up custom SMTP (optional but recommended)
- [ ] Update sender name to "FrothMonkey"
- [ ] Verify site URL is correct
- [ ] Send test emails
- [ ] Monitor email deliverability

---

**Last Updated**: September 30, 2025  
**Contact**: For questions about email setup, check Supabase docs or email configuration files.
