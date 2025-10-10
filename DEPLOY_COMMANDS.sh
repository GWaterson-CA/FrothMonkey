#!/bin/bash

# Step 1: Login to Supabase (this will open a browser window)
echo "Step 1: Logging in to Supabase..."
npx supabase login

# Step 2: Deploy the Edge Function
echo "Step 2: Deploying send-notification-emails Edge Function..."
npx supabase functions deploy send-notification-emails --project-ref ysoxcftclnlmvxuopdun

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to Supabase Dashboard → Edge Functions → send-notification-emails → Settings"
echo "2. Add Environment Variable: APP_URL = http://localhost:3003"
echo "3. Go to Database → Webhooks → Create new hook"
echo "4. Configure webhook for 'notifications' table INSERT events"
echo "5. Select 'send-notification-emails' as the Edge Function"

