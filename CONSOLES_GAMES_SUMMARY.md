# Consoles & Games Subcategory - Summary

## Overview
Added a new subcategory "Consoles & Games" to the Toys & Models category to accommodate gaming console and video game listings.

## What Was Created

### 1. Migration File
**File:** `supabase/migrations/046_add_consoles_games_subcategory.sql`

This migration:
- ✅ Adds "Consoles & Games" as subcategory #12 under Toys & Models
- ✅ Uses slug `consoles-games` for URL-friendly routing
- ✅ Initializes the `active_listing_count` field
- ✅ Is idempotent (safe to run multiple times)

### 2. Verification Script
**File:** `VERIFY_CONSOLES_GAMES.sql`

This script checks:
- ✅ Subcategory exists with correct slug
- ✅ Parent relationship to Toys & Models
- ✅ Sort order is set to 12
- ✅ Lists all Toys & Models subcategories
- ✅ Shows listing counts

### 3. Deployment Script
**File:** `DEPLOY_CONSOLES_GAMES.sh`

An executable bash script that:
- ✅ Checks for Supabase CLI
- ✅ Applies the migration
- ✅ Provides verification instructions

## Deployment Instructions

### Quick Deploy
```bash
# Option 1: Use the deployment script
./DEPLOY_CONSOLES_GAMES.sh

# Option 2: Manual deployment via Supabase CLI
supabase db push
```

### Verify Deployment
Run `VERIFY_CONSOLES_GAMES.sql` in your Supabase SQL Editor to confirm the subcategory was added correctly.

## Category Structure

The Toys & Models category now has **12 subcategories**:

1. Radio Control & Robots
2. Ride-On Toys
3. Models
4. Lego & Building Toys
5. Games & Puzzles
6. Outdoor Toys & Trampolines
7. Wooden
8. Vintage
9. Dolls
10. Bath Toys
11. Musical Instruments
12. **Consoles & Games** ← NEW

## How It Works

### In the Database
- The subcategory is stored in the `categories` table
- It has `parent_id` pointing to the Toys & Models category
- The `slug` field (`consoles-games`) is used for URL routing
- The `sort_order` field (12) determines display order

### In the Application
- The `getCategoriesWithCounts()` function in `lib/categories.ts` automatically fetches all categories with their subcategories
- Subcategories are sorted alphabetically by name (see line 27 of categories.ts)
- The new subcategory will appear in:
  - Category dropdowns when creating/editing listings
  - Browse pages and navigation
  - Category filters

### No Code Changes Required
The existing code dynamically loads categories from the database, so no application code changes are needed! The new subcategory will automatically appear once the migration is applied.

## User Impact

### Sellers
- Can now select "Consoles & Games" when creating listings in the Toys & Models category
- Better categorization for gaming-related items

### Buyers
- Can browse and filter by the new subcategory
- More specific search and discovery options

## Testing Checklist

After deployment:
- [ ] Run `VERIFY_CONSOLES_GAMES.sql` to confirm the subcategory exists
- [ ] Check that the subcategory appears in the category dropdown on the create listing page
- [ ] Verify the subcategory appears in the browse/category navigation
- [ ] Create a test listing in the new subcategory
- [ ] Confirm the listing appears when browsing the Consoles & Games subcategory

## Rollback (if needed)

If you need to remove the subcategory:

```sql
-- First, move any listings to a different category
UPDATE listings 
SET category_id = (SELECT id FROM categories WHERE slug = 'games-puzzles-toys')
WHERE category_id = (SELECT id FROM categories WHERE slug = 'consoles-games');

-- Then delete the subcategory
DELETE FROM categories WHERE slug = 'consoles-games';
```

## Related Files
- Migration: `supabase/migrations/046_add_consoles_games_subcategory.sql`
- Categories lib: `lib/categories.ts`
- Previous Toys & Models migration: `supabase/migrations/045_add_toys_and_models_category.sql`
- Verification: `VERIFY_CONSOLES_GAMES.sql`
- Deployment: `DEPLOY_CONSOLES_GAMES.sh`

---
*Created: October 22, 2025*

