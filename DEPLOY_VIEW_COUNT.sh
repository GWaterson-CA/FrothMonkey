#!/bin/bash

# Deployment script for listing view count feature
# This script applies the database migration to add view count functionality

echo "🚀 Deploying listing view count feature..."
echo ""

# Apply migration
echo "📊 Creating view count function..."
supabase db push

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test the view count display on any listing page"
echo "2. Verify views are being tracked in the listing_views table"
echo "3. Check that the Share button appears at the bottom of listings"
echo ""

