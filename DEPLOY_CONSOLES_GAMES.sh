#!/bin/bash

# Deployment script for Consoles & Games subcategory
# This script will apply the migration to add the new subcategory

echo "=========================================="
echo "Deploying Consoles & Games Subcategory"
echo "=========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Link to project (if not already linked)
echo "📡 Checking Supabase project link..."
supabase link --project-ref your-project-ref 2>/dev/null || echo "Already linked or manual link required"
echo ""

# Apply the migration
echo "🚀 Applying migration 046_add_consoles_games_subcategory.sql..."
supabase db push
echo ""

# Verify the deployment
echo "🔍 Verifying deployment..."
echo "Run the following in your Supabase SQL Editor:"
echo ""
echo "SELECT name, slug, sort_order, active_listing_count"
echo "FROM categories"
echo "WHERE slug = 'consoles-games';"
echo ""
echo "Or use the VERIFY_CONSOLES_GAMES.sql script for a complete verification."
echo ""

echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run VERIFY_CONSOLES_GAMES.sql in Supabase SQL Editor to verify"
echo "2. The new subcategory will now appear in category dropdowns"
echo "3. Users can select 'Consoles & Games' when creating listings"
echo ""

