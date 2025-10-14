#!/bin/bash

# Deployment script for Favorites Feature
# Run this script to deploy all favorites functionality

set -e  # Exit on any error

echo "🚀 Starting Favorites Feature Deployment"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first.${NC}"
    echo "   npm install -g supabase"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Applying database migration...${NC}"
supabase db push || {
    echo -e "${RED}❌ Database migration failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Database migration applied${NC}"
echo ""

echo -e "${BLUE}📋 Step 2: Deploying Edge Function...${NC}"
supabase functions deploy check-favorite-notifications || {
    echo -e "${RED}❌ Edge function deployment failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Edge function deployed${NC}"
echo ""

echo -e "${BLUE}📋 Step 3: Setting up cron job...${NC}"
echo "Please run the following SQL in your Supabase dashboard:"
echo ""
echo "-- Enable pg_cron extension (if not already enabled)"
echo "CREATE EXTENSION IF NOT EXISTS pg_cron;"
echo ""
echo "-- Schedule favorite notifications check every hour"
echo "SELECT cron.schedule("
echo "  'check-favorite-notifications',"
echo "  '0 * * * *', -- Every hour at minute 0"
echo "  \$\$"
echo "  SELECT"
echo "    net.http_post("
echo "      url:='${SUPABASE_URL}/functions/v1/check-favorite-notifications',"
echo "      headers:='{\"Content-Type\": \"application/json\", \"Authorization\": \"Bearer ${SUPABASE_SERVICE_ROLE_KEY}\"}'::jsonb"
echo "    ) AS request_id;"
echo "  \$\$"
echo ");"
echo ""
echo -e "${BLUE}⚠️  Make sure to replace SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY with your actual values${NC}"
echo ""

echo -e "${BLUE}📋 Step 4: Verifying deployment...${NC}"

# Test the edge function
echo "Testing edge function..."
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/check-favorite-notifications" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json") || {
    echo -e "${RED}❌ Edge function test failed${NC}"
    exit 1
}

if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Edge function is working${NC}"
else
    echo -e "${RED}❌ Edge function test returned unexpected response:${NC}"
    echo "$RESPONSE"
fi
echo ""

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "========================================"
echo "📝 Next Steps:"
echo "1. ✅ Set up the cron job using the SQL above"
echo "2. ✅ Test favorite functionality on your site"
echo "3. ✅ Favorite a listing and wait for notifications"
echo "4. ✅ Check user notification preferences"
echo ""
echo "📖 See FAVORITES_IMPLEMENTATION.md for detailed documentation"
echo "========================================"

