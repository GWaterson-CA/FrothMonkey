#!/bin/bash

# Deploy Toys & Models category to Supabase
# This script applies the migration to add the new category

echo "🧸 Deploying Toys & Models category..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're linked to a project
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Not linked to a Supabase project."
    echo "   Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "📋 Applying migration 045_add_toys_and_models_category.sql..."
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Toys & Models category deployed successfully!"
    echo ""
    echo "📊 The new category includes:"
    echo "   • Radio Control & Robots"
    echo "   • Ride-On Toys"
    echo "   • Models"
    echo "   • Lego & Building Toys"
    echo "   • Games & Puzzles"
    echo "   • Outdoor Toys & Trampolines"
    echo "   • Wooden"
    echo "   • Vintage"
    echo "   • Dolls"
    echo "   • Bath Toys"
    echo "   • Musical Instruments"
    echo ""
    echo "🎉 Users can now create listings in these categories!"
else
    echo ""
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi

