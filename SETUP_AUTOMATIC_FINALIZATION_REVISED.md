# 🚀 Setting Up Automatic Auction Finalization (Revised)

Since **Cron Jobs** isn't visible in your Supabase Dashboard, here are **3 working methods**:

---

## Method 1: Enable pg_cron Extension + SQL (Recommended)

### Step 1: Enable pg_cron Extension

1. Go to **Supabase Dashboard** → **Database** → **Extensions** (in the left menu)
2. Search for **"pg_cron"**
3. Click **"Enable"** if it's not already enabled

**OR** run this in SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Step 2: Schedule the Job via SQL Editor

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Run this SQL:

```sql
SELECT cron.schedule(
    'finalize-auctions',           -- Job name
    '*/5 * * * *',                 -- Every 5 minutes (cron format)
    'SELECT finalize_auctions();'  -- SQL to execute
);
```

### Step 3: Verify It's Working

Run this to check:

```sql
SELECT * FROM cron.job WHERE jobname = 'finalize-auctions';
```

You should see a row with your scheduled job.

---

## Method 2: Edge Function + External Cron (Most Reliable)

This works even if pg_cron isn't available. Use an external cron service to call your edge function.

### Step 1: Deploy Edge Function

```bash
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"
npx supabase functions deploy finalize-auctions
```

### Step 2: Set Up Vercel Cron (if using Vercel)

Create `vercel.json` in your project root:

```json
{
  "crons": [{
    "path": "/api/cron/finalize-auctions",
    "schedule": "*/5 * * * *"
  }]
}
```

Create `app/api/cron/finalize-auctions/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const functionUrl = `${supabaseUrl}/functions/v1/finalize-auctions`
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  const data = await response.json()
  return NextResponse.json(data)
}
```

Add to `.env`:
```
CRON_SECRET=your-secret-key-here
```

### Step 3: Alternative - GitHub Actions Cron

If not using Vercel, create `.github/workflows/finalize-auctions.yml`:

```yaml
name: Finalize Auctions
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
jobs:
  finalize:
    runs-on: ubuntu-latest
    steps:
      - name: Call Finalize Function
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          curl -X POST \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Content-Type: application/json" \
            "$SUPABASE_URL/functions/v1/finalize-auctions"
```

---

## Method 3: Manual Trigger (Testing Only)

For testing, you can manually trigger it:

```sql
SELECT finalize_auctions();
```

Or call the edge function directly:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://YOUR_PROJECT.supabase.co/functions/v1/finalize-auctions
```

---

## Which Method Should You Use?

1. **Method 1 (pg_cron)** - Best if you can enable the extension
   - ✅ Native Supabase solution
   - ✅ No external dependencies
   - ❌ Requires pg_cron extension (may not be available on Free plan)

2. **Method 2 (Edge Function + External Cron)** - Most reliable
   - ✅ Works on any Supabase plan
   - ✅ More control and monitoring
   - ✅ Can use Vercel Cron (free) or GitHub Actions (free)
   - ⚠️ Requires deploying edge function

3. **Method 3 (Manual)** - For testing only
   - ✅ Quick to test
   - ❌ Not automated

---

## Quick Start Recommendation

**Try Method 1 first:**
1. Go to **Database** → **Extensions** → Enable **pg_cron**
2. Run `SETUP_CRON_VIA_SQL.sql` in SQL Editor

**If that doesn't work, use Method 2:**
1. Deploy edge function: `npx supabase functions deploy finalize-auctions`
2. Set up Vercel Cron or GitHub Actions (see above)

---

## Verify It's Working

After setup, run this to check for stuck auctions:

```sql
SELECT 
    COUNT(*) as stuck_count,
    'Listings that should be finalized' as description
FROM listings
WHERE status = 'live' 
  AND NOW() >= end_time;
```

If this returns `0` after a few minutes, your automation is working! 🎉

