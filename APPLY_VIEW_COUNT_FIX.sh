#!/bin/bash
# Apply the view count security fix to Supabase

echo "🔧 Applying view count security fix..."
echo ""
echo "This will:"
echo "  1. Update record_listing_view to use SECURITY DEFINER"
echo "  2. Update record_page_view to use SECURITY DEFINER"
echo "  3. Grant execute permissions to authenticated and anonymous users"
echo ""
echo "This allows the analytics functions to bypass RLS and insert views properly."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Cancelled"
    exit 1
fi

echo "📤 Pushing migration to Supabase..."
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🧪 Test the fix:"
    echo "  1. Visit any listing page"
    echo "  2. Open DevTools → Network tab"
    echo "  3. Look for successful POST to /api/analytics/listing-view"
    echo "  4. Refresh the page a few times"
    echo "  5. Run this query in Supabase SQL Editor:"
    echo ""
    echo "     SELECT COUNT(*) FROM listing_views WHERE listing_id = 'YOUR-LISTING-ID';"
    echo ""
    echo "  6. The count should increase with each refresh!"
else
    echo ""
    echo "❌ Migration failed. Check the error above."
    exit 1
fi

