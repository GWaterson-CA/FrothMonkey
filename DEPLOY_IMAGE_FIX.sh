#!/bin/bash

# 🚨 EMERGENCY IMAGE FIX DEPLOYMENT
# This disables Vercel image optimization to get images working immediately

echo "================================================"
echo "🚨 DEPLOYING IMAGE OPTIMIZATION FIX"
echo "================================================"
echo ""
echo "This will:"
echo "✅ Disable Vercel image optimization (exceeded limit)"
echo "✅ Images will load directly from Supabase"
echo "✅ Deploy to production"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "📝 Committing changes..."
git add next.config.js lib/image-optimization.ts IMAGE_OPTIMIZATION_FIX.md
git commit -m "fix: disable Vercel image optimization - exceeded 5000 limit

- Disabled Vercel image optimization (unoptimized: true)
- Images now load directly from Supabase
- Added Supabase image transformation utilities for future use
- Resolves issue with images not displaying on FrothMonkey"

echo ""
echo "🚀 Pushing to production..."
git push origin main

echo ""
echo "================================================"
echo "✅ DEPLOYED!"
echo "================================================"
echo ""
echo "Images should work again in 2-3 minutes once Vercel redeploys."
echo ""
echo "📊 What changed:"
echo "  - Images now load directly from Supabase (no Vercel optimization)"
echo "  - No more transformation limits"
echo "  - Added image-optimization.ts for future Supabase transformations"
echo ""
echo "🔮 Next steps:"
echo "  1. Wait 2-3 minutes for deploy"
echo "  2. Check FrothMonkey - images should display"
echo "  3. Later: Implement Supabase image optimization for better performance"
echo "     (See IMAGE_OPTIMIZATION_FIX.md for details)"
echo ""

