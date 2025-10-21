#!/bin/bash

# Deployment script for Auto-bid Max Amount Priority Fix
# This script deploys the fix for ensuring users get to bid their max amount first

set -e  # Exit on any error

echo "============================================================================"
echo "Auto-bid Max Amount Priority Fix - Deployment Script"
echo "============================================================================"
echo ""
echo "This fix ensures that when an auto-bid reaches a user's maximum amount,"
echo "that user gets priority to place that bid (since they committed first)."
echo ""
echo "Example: If User A auto-bids to \$25 and User B auto-bids to \$30,"
echo "User A will get the \$25 bid, then User B counters at \$26."
echo ""
echo "============================================================================"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Please install it: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if we're logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Error: Not logged in to Supabase"
    echo "Please run: supabase login"
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Show current migration files
echo "Checking migration files..."
if [ -f "supabase/migrations/042_fix_autobid_max_amount_priority.sql" ]; then
    echo "✅ Migration file found: 042_fix_autobid_max_amount_priority.sql"
else
    echo "❌ Error: Migration file not found"
    echo "Expected: supabase/migrations/042_fix_autobid_max_amount_priority.sql"
    exit 1
fi
echo ""

# Confirm deployment
echo "============================================================================"
echo "Ready to deploy the fix"
echo "============================================================================"
echo ""
echo "This will:"
echo "  1. Apply migration 042_fix_autobid_max_amount_priority.sql"
echo "  2. Update the process_auto_bids() function"
echo "  3. Affect all active auto-bids immediately (in a good way!)"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Deploying migration..."
echo ""

# Push the migration
if supabase db push; then
    echo ""
    echo "============================================================================"
    echo "✅ Migration deployed successfully!"
    echo "============================================================================"
    echo ""
else
    echo ""
    echo "============================================================================"
    echo "❌ Migration failed"
    echo "============================================================================"
    echo ""
    exit 1
fi

# Verify the migration
echo "Verifying migration..."
echo ""

# Create a verification query
cat > /tmp/verify_migration.sql << 'EOF'
-- Verify migration was applied
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Migration 042 applied successfully'
        ELSE '❌ Migration 042 not found'
    END as status,
    MAX(executed_at) as executed_at
FROM supabase_migrations 
WHERE name LIKE '%042_fix_autobid_max_amount_priority%';

-- Show active auto-bids that will benefit from this fix
SELECT 
    '📊 Active Auto-bids Statistics' as info,
    COUNT(*) as total_active_autobids,
    COUNT(DISTINCT listing_id) as listings_with_autobids,
    COUNT(DISTINCT CASE WHEN multiple_bidders THEN listing_id END) as competitive_listings
FROM auto_bids ab
LEFT JOIN (
    SELECT listing_id, COUNT(*) > 1 as multiple_bidders
    FROM auto_bids
    WHERE enabled = true
    GROUP BY listing_id
) competing ON competing.listing_id = ab.listing_id
WHERE ab.enabled = true;
EOF

supabase db execute --file /tmp/verify_migration.sql

echo ""
echo "============================================================================"
echo "Deployment Complete!"
echo "============================================================================"
echo ""
echo "Next steps:"
echo "  1. (Optional) Run test script: psql -f TEST_AUTOBID_MAX_PRIORITY.sql"
echo "  2. Monitor auto-bid behavior on live listings"
echo "  3. Check for any user reports or issues"
echo ""
echo "For more information, see: AUTOBID_MAX_PRIORITY_FIX.md"
echo ""

# Clean up temp file
rm -f /tmp/verify_migration.sql

echo "✅ Done!"

