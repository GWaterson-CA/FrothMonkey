# Deploy Edge Function for Email Notifications

## The Problem
Notifications ARE being created in your database, but emails aren't being sent because:
1. The Edge Function may not be deployed
2. The database webhook is definitely not configured

## Step 1: Login to Supabase CLI

```bash
npx supabase login
```

This will open a browser window to authenticate.

## Step 2: Link Your Project

Find your project reference ID in Supabase Dashboard (top right, looks like `abcdefghijk`).

```bash
npx supabase link --project-ref ysoxcftclnlmvxuopdun
```

## Step 3: Deploy the Edge Function

```bash
npx supabase functions deploy send-notification-emails
```

## Step 4: Set Environment Variable for Edge Function

In Supabase Dashboard:
1. Go to **Edge Functions**
2. Click on `send-notification-emails`
3. Go to **Settings** tab
4. Under **Environment Variables**, add:
   - **Name:** `APP_URL`
   - **Value:** `http://localhost:3003` (for local dev) or `https://frothmonkey.com` (for production)
5. Click **Save**

## Step 5: Create the Database Webhook

In Supabase Dashboard:
1. Go to **Database** → **Webhooks**
2. Click **"Create a new hook"**
3. Configure:
   - **Name:** `Send Notification Emails`
   - **Schema:** `public`
   - **Table:** `notifications`
   - **Events:** Check **INSERT** only
   - **Type:** Select **"Supabase Edge Functions"**
   - **Edge Function:** Select `send-notification-emails` (should now appear!)
4. Click **Confirm**

## Step 6: Test It!

Place a new bid on any listing and the previous bidder should receive an email within seconds!

## Verification

Check webhook is working:
1. Place a bid
2. In Supabase Dashboard, go to **Database** → **Webhooks**
3. Click your webhook
4. Check the **Logs** tab - you should see successful deliveries

## Already Have Pending Notifications?

The webhook will only trigger for NEW notifications going forward. The existing notifications in your database won't trigger emails retroactively.

To test, just place a new bid and it should work!

