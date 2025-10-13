# Fix Edge Function Deployment - v2.8.4

## ✅ Code Fixed!

The helper function now handles your database format correctly:
- **Database stores**: `2fb6feb4-5ae2-4644-89be-fe8493963ca1/95970711-1b4e-487d-8e38-dc2ce7d8e75a` (no extension)
- **Function adds**: `.jpg` extension automatically
- **Final URL**: `https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/2fb6feb4-5ae2-4644-89be-fe8493963ca1/95970711-1b4e-487d-8e38-dc2ce7d8e75a.jpg`

---

## 🚨 Deployment Error: "Entrypoint path does not exist"

This error happens when deploying via Supabase Dashboard. There are 3 ways to fix it:

---

## Method 1: Manual Dashboard Upload (Easiest)

### Step 1: Create a Simple Folder Structure
The dashboard expects just the `index.ts` file. Let's verify it's correct:

**File location**:
```
supabase/functions/send-notification-emails/index.ts
```

### Step 2: Deploy via Dashboard
1. **Go to**: Supabase Dashboard → Edge Functions
2. **Click**: `send-notification-emails` function
3. **Click**: "Deploy new version" or "Create new function"
4. **Upload**: Select **ONLY** the `index.ts` file
   - Do NOT zip it
   - Do NOT include a folder
   - Just the raw `index.ts` file
5. **Click**: Deploy

### Step 3: If That Doesn't Work
Try creating a new function:
1. **Delete** the existing `send-notification-emails` function (if it exists)
2. **Create new**: Click "New Edge Function"
3. **Name**: `send-notification-emails`
4. **Upload**: The `index.ts` file
5. **Deploy**

---

## Method 2: Use Supabase CLI (Recommended)

### Step 1: Install Supabase CLI
```bash
# If not already installed:
npm install -g supabase

# Or with Homebrew:
brew install supabase/tap/supabase
```

### Step 2: Login
```bash
supabase login
```

### Step 3: Link Your Project
```bash
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"
supabase link --project-ref ysoxcftclnlmvxuopdun
```

### Step 4: Deploy
```bash
supabase functions deploy send-notification-emails
```

This should work perfectly and avoid the dashboard issue!

---

## Method 3: Copy-Paste Code Manually

If the file upload isn't working:

### Step 1: Open the Function in Dashboard
1. **Go to**: Edge Functions → send-notification-emails
2. **Click**: "Edit function" or create new

### Step 2: Copy the Code
Open your local file:
```
supabase/functions/send-notification-emails/index.ts
```

### Step 3: Paste & Deploy
1. **Select all** code in the dashboard editor
2. **Delete** it
3. **Paste** your updated code
4. **Click**: "Save" or "Deploy"

---

## Method 4: Check Function Configuration

The error might be a configuration issue. Let's create a proper config:

### Create deno.json (if needed)
Create this file: `supabase/functions/send-notification-emails/deno.json`

```json
{
  "importMap": "",
  "lock": false
}
```

Or create at root of functions: `supabase/functions/deno.json`

```json
{
  "importMap": "",
  "lock": false
}
```

---

## Verify Deployment Worked

### Check in Dashboard
1. **Go to**: Edge Functions → send-notification-emails
2. **Check**: "Last deployed" timestamp should be recent
3. **View**: Logs tab to ensure no errors

### Test the Function
```bash
# Send a test email
curl -X POST https://ysoxcftclnlmvxuopdun.supabase.co/functions/v1/send-notification-emails \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"record": {"id": "test", "type": "bid_outbid", "listing_id": "2fb6feb4-5ae2-4644-89be-fe8493963ca1"}}'
```

### Watch the Logs
1. **Dashboard**: Edge Functions → send-notification-emails → Logs
2. **Look for**:
```
[IMAGE URL DEBUG] Original URL: 2fb6feb4-5ae2-4644-89be-fe8493963ca1/95970711-1b4e-487d-8e38-dc2ce7d8e75a
[IMAGE URL DEBUG] Relative path converted: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/2fb6feb4-5ae2-4644-89be-fe8493963ca1/95970711-1b4e-487d-8e38-dc2ce7d8e75a.jpg
[IMAGE URL DEBUG] Added .jpg extension to path
✅ Final email image URL: https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/2fb6feb4-5ae2-4644-89be-fe8493963ca1/95970711-1b4e-487d-8e38-dc2ce7d8e75a.jpg
```

---

## Expected Behavior After Deployment

### For Your Test Listing (Candleholder)

**Database value**:
```
2fb6feb4-5ae2-4644-89be-fe8493963ca1/95970711-1b4e-487d-8e38-dc2ce7d8e75a
```

**Function processes**:
1. Receives: `2fb6feb4-5ae2-4644-89be-fe8493963ca1/95970711-1b4e-487d-8e38-dc2ce7d8e75a`
2. Checks: No extension found (regex check fails)
3. Adds: `.jpg` extension
4. Constructs: `https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/2fb6feb4-5ae2-4644-89be-fe8493963ca1/95970711-1b4e-487d-8e38-dc2ce7d8e75a.jpg`
5. Uses in email: ✅

**Result**: Image loads in email! 🎉

---

## Troubleshooting Deployment

### Error: "Function already exists"
```bash
# Delete and recreate
supabase functions delete send-notification-emails
supabase functions deploy send-notification-emails
```

### Error: "Not logged in"
```bash
supabase login
```

### Error: "Project not linked"
```bash
supabase link --project-ref ysoxcftclnlmvxuopdun
```

### Error: "Permission denied"
Make sure you're the project owner or have appropriate permissions in Supabase.

---

## Alternative: Use Supabase Dashboard Code Editor

If CLI doesn't work:

1. **Go to**: Dashboard → Edge Functions
2. **Click**: send-notification-emails
3. **Click**: "Code" tab
4. **Edit directly** in browser
5. **Paste** updated code from your local file
6. **Click**: "Save & Deploy"

---

## Quick Command Reference

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"
supabase link --project-ref ysoxcftclnlmvxuopdun

# Deploy
supabase functions deploy send-notification-emails

# View logs (real-time)
supabase functions logs send-notification-emails --tail

# Test the function
supabase functions serve send-notification-emails
```

---

## Once Deployed Successfully

### 1. Send Test Email
Visit: https://frothmonkey.com/admin/email-test

### 2. Check Logs
Dashboard → Edge Functions → send-notification-emails → Logs

### 3. Verify Image URL
Copy the final URL from logs and test in browser:
```
https://ysoxcftclnlmvxuopdun.supabase.co/storage/v1/object/public/listing-images/2fb6feb4-5ae2-4644-89be-fe8493963ca1/95970711-1b4e-487d-8e38-dc2ce7d8e75a.jpg
```

Should load the candleholder image! ✅

### 4. Check Email
Open the test email - image should display correctly!

---

## Summary of Changes (v2.8.4)

**What was fixed**:
- ✅ Automatic `.jpg` extension handling
- ✅ Regex detection for existing extensions
- ✅ Works with your database format (path without extension)
- ✅ Debug logging shows when extension is added

**What to do**:
1. Deploy using **Method 1** (Dashboard) or **Method 2** (CLI)
2. Send test email
3. Check logs for debug output
4. Verify image loads

---

**Next Step**: Try deploying with the Supabase CLI (Method 2) - it's the most reliable!

If you don't have CLI installed:
```bash
npm install -g supabase
```

Then:
```bash
supabase login
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"
supabase link --project-ref ysoxcftclnlmvxuopdun
supabase functions deploy send-notification-emails
```

This should work perfectly! 🚀

