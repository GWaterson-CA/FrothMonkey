#!/bin/bash

# Deploy Updated Email Templates with Listing Images
# This script deploys the enhanced email notification templates

echo "🚀 Deploying Enhanced Email Templates..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Error: Not logged in to Supabase"
    echo "Run: supabase login"
    exit 1
fi

echo "✅ Supabase CLI is ready"
echo ""

# Deploy the send-notification-emails function
echo "📧 Deploying send-notification-emails function..."
supabase functions deploy send-notification-emails

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully deployed!"
    echo ""
    echo "📋 What was updated:"
    echo "  • Outbid notifications now include listing image & title"
    echo "  • Time warning emails (1h-48h) include listing image & title"
    echo "  • Auction won emails include listing image & title"
    echo "  • Auction ended (seller) emails include listing image & title"
    echo ""
    echo "🎯 Benefits:"
    echo "  • Increased user engagement"
    echo "  • Better visual recognition"
    echo "  • Higher click-through rates"
    echo "  • Improved trust and professionalism"
    echo ""
    echo "🧪 Testing:"
    echo "  1. Visit: https://frothmonkey.com/admin/email-test"
    echo "  2. Or place a test bid on an auction"
    echo "  3. Check your email for the enhanced templates"
    echo ""
    echo "📊 Monitor Results:"
    echo "  • Resend Dashboard: https://resend.com/emails"
    echo "  • Supabase Logs: https://supabase.com/dashboard/project/_/functions"
    echo ""
else
    echo ""
    echo "❌ Deployment failed"
    echo "Check the error message above and try again"
    exit 1
fi

