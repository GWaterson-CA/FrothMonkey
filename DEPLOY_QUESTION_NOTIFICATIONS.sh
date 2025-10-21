#!/bin/bash

# Deployment script for Q&A Email Notifications
# This script deploys the Q&A email notification feature

set -e  # Exit on any error

echo "======================================"
echo "Q&A Email Notifications Deployment"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if Supabase CLI is installed
echo -e "${YELLOW}Step 1: Checking Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed!${NC}"
    echo "Please install it with: npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✅ Supabase CLI is installed${NC}"
echo ""

# Step 2: Apply database migration
echo -e "${YELLOW}Step 2: Applying database migration...${NC}"
echo "This will add the question_answered notification type and triggers"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase db push
    echo -e "${GREEN}✅ Database migration applied${NC}"
else
    echo -e "${RED}❌ Migration cancelled${NC}"
    exit 1
fi
echo ""

# Step 3: Deploy edge function
echo -e "${YELLOW}Step 3: Deploying edge function...${NC}"
echo "This will update the send-notification-emails edge function"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase functions deploy send-notification-emails
    echo -e "${GREEN}✅ Edge function deployed${NC}"
else
    echo -e "${RED}❌ Edge function deployment cancelled${NC}"
    exit 1
fi
echo ""

# Step 4: Verify deployment
echo -e "${YELLOW}Step 4: Verifying deployment...${NC}"
echo "Checking if notification types are configured correctly..."
echo ""

# Create a verification SQL file
cat > /tmp/verify_question_notifications.sql << 'EOF'
-- Check if question_answered notification type exists in constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_question_received', 'trigger_notify_question_answered')
ORDER BY trigger_name;

-- Check notification preferences default
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'notification_preferences';
EOF

echo "Running verification queries..."
supabase db execute < /tmp/verify_question_notifications.sql

echo ""
echo -e "${GREEN}✅ Verification complete!${NC}"
rm /tmp/verify_question_notifications.sql
echo ""

# Step 5: Test notification
echo -e "${YELLOW}Step 5: Test the notifications (optional)${NC}"
echo "Would you like to run a test?"
echo "This will:"
echo "  1. Create a test listing"
echo "  2. Ask a question on it"
echo "  3. Answer the question"
echo "  4. Verify notifications were created"
echo ""
read -p "Run test? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Opening test file..."
    echo "Please run: TEST_QUESTION_NOTIFICATIONS.sql"
    echo "in your Supabase SQL Editor"
else
    echo "Skipping test"
fi
echo ""

# Step 6: Summary
echo "======================================"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "======================================"
echo ""
echo "What was deployed:"
echo "  ✅ Database migration (041_question_email_notifications.sql)"
echo "  ✅ Updated edge function (send-notification-emails)"
echo "  ✅ New email templates for Q&A notifications"
echo ""
echo "New notification types:"
echo "  📧 question_received - Seller gets email when user asks question"
echo "  📧 question_answered - User gets email when seller answers"
echo ""
echo "Next steps:"
echo "  1. Test the feature by asking a question on a listing"
echo "  2. Answer the question as the seller"
echo "  3. Check that both emails were sent"
echo "  4. Users can manage preferences in Account Settings"
echo ""
echo "For troubleshooting, see: QUESTION_NOTIFICATIONS_GUIDE.md"
echo ""

