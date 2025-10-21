#!/bin/bash

# Script to deploy admin notification system
# This will set up email notifications for new users and new listings

set -e

echo "🚀 Deploying Admin Notification System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo -e "${BLUE}Step 1: Deploying Supabase Edge Function${NC}"
echo "This edge function sends admin notifications via email..."
supabase functions deploy send-admin-notifications --no-verify-jwt

echo ""
echo -e "${GREEN}✅ Edge function deployed successfully!${NC}"
echo ""

echo -e "${BLUE}Step 2: Applying Database Migration${NC}"
echo "This creates triggers for new users and listings..."
supabase db push

echo ""
echo -e "${GREEN}✅ Database migration applied successfully!${NC}"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANT: Manual Setup Required${NC}"
echo ""
echo "You need to configure database webhooks in your Supabase Dashboard:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/database/webhooks"
echo ""
echo "2. Create webhook for NEW USERS:"
echo "   - Name: Admin Notification - New User"
echo "   - Table: admin_notification_log"
echo "   - Events: INSERT"
echo "   - Type: Edge Function"
echo "   - Edge Function: send-admin-notifications"
echo "   - HTTP Headers (optional):"
echo "     Content-Type: application/json"
echo "   - Conditions: notification_type = 'new_user'"
echo "   - Payload:"
echo "     {"
echo "       \"type\": \"new_user\","
echo "       \"record\": {"
echo "         \"id\": \"{{record.record_id}}\","
echo "         \"username\": \"{{record.metadata->>'username'}}\","
echo "         \"full_name\": \"{{record.metadata->>'full_name'}}\","
echo "         \"created_at\": \"{{record.metadata->>'created_at'}}\""
echo "       }"
echo "     }"
echo ""
echo "3. Create webhook for NEW LISTINGS:"
echo "   - Name: Admin Notification - New Listing"
echo "   - Table: admin_notification_log"
echo "   - Events: INSERT"
echo "   - Type: Edge Function"
echo "   - Edge Function: send-admin-notifications"
echo "   - HTTP Headers (optional):"
echo "     Content-Type: application/json"
echo "   - Conditions: notification_type = 'new_listing'"
echo "   - Payload:"
echo "     {"
echo "       \"type\": \"new_listing\","
echo "       \"record\": {"
echo "         \"id\": \"{{record.record_id}}\","
echo "         \"title\": \"{{record.metadata->>'title'}}\","
echo "         \"description\": \"{{record.metadata->>'description'}}\","
echo "         \"owner_id\": \"{{record.metadata->>'owner_id'}}\","
echo "         \"start_price\": \"{{record.metadata->>'start_price'}}\","
echo "         \"status\": \"{{record.metadata->>'status'}}\","
echo "         \"created_at\": \"{{record.metadata->>'created_at'}}\""
echo "       }"
echo "     }"
echo ""
echo -e "${GREEN}4. Ensure RESEND_API_KEY is set in Edge Function Secrets:${NC}"
echo "   - Go to: Edge Functions > send-admin-notifications > Settings"
echo "   - Add secret: RESEND_API_KEY = your_resend_api_key"
echo "   - Add secret: APP_URL = https://frothmonkey.com"
echo ""
echo -e "${BLUE}5. Test the system:${NC}"
echo "   - Create a test user to verify email notification"
echo "   - Create a test listing to verify email notification"
echo "   - Check frothmonkey@myyahoo.com for emails"
echo ""
echo -e "${GREEN}✅ Deployment script completed!${NC}"
echo "Please complete the manual steps above to finish the setup."

