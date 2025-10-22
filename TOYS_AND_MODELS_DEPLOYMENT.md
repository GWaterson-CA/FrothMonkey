# Toys & Models Category Deployment Guide

This guide explains how to deploy the new "Toys & Models" category with its subcategories.

## 🎯 What's Being Added

A new main category **Toys & Models** with 11 subcategories:

1. **Radio Control & Robots** - RC cars, drones, robots, etc.
2. **Ride-On Toys** - Kids' ride-on vehicles
3. **Models** - Scale models, model kits, collectible models
4. **Lego & Building Toys** - LEGO sets and other building toys
5. **Games & Puzzles** - Board games, puzzles, card games
6. **Outdoor Toys & Trampolines** - Playground equipment, trampolines
7. **Wooden** - Wooden toys and playsets
8. **Vintage** - Collectible and vintage toys
9. **Dolls** - Dolls and doll accessories
10. **Bath Toys** - Toys for bath time
11. **Musical Instruments** - Toy instruments and kid-sized instruments

## 📁 Files Created

- `supabase/migrations/045_add_toys_and_models_category.sql` - Database migration
- `DEPLOY_TOYS_AND_MODELS.sh` - Deployment script
- `TOYS_AND_MODELS_DEPLOYMENT.md` - This guide

## 🚀 Deployment Methods

### Method 1: Using the Deployment Script (Recommended)

```bash
# Make the script executable
chmod +x DEPLOY_TOYS_AND_MODELS.sh

# Run the deployment
./DEPLOY_TOYS_AND_MODELS.sh
```

### Method 2: Using Supabase CLI Directly

```bash
# Push the migration to your database
supabase db push
```

### Method 3: Manual SQL Execution

If you prefer to run the SQL manually:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/045_add_toys_and_models_category.sql`
4. Paste and execute the SQL

## ✅ Verification

After deployment, verify the categories were added:

```sql
-- Check main category
SELECT id, name, slug, sort_order, icon, parent_id 
FROM categories 
WHERE slug = 'toys-and-models';

-- Check all subcategories
SELECT name, slug, sort_order 
FROM categories 
WHERE parent_id = (SELECT id FROM categories WHERE slug = 'toys-and-models')
ORDER BY sort_order;
```

You should see:
- 1 main category: "Toys & Models" (🧸)
- 11 subcategories listed in order

## 📊 Category Structure

```
Toys & Models (🧸)
├── Radio Control & Robots
├── Ride-On Toys
├── Models
├── Lego & Building Toys
├── Games & Puzzles
├── Outdoor Toys & Trampolines
├── Wooden
├── Vintage
├── Dolls
├── Bath Toys
└── Musical Instruments
```

## 🔄 Idempotency

The migration is designed to be **idempotent** - you can run it multiple times safely. It will only add categories that don't already exist.

## 🎨 Icon

The category uses the 🧸 (teddy bear) emoji icon, which fits well with the toy theme.

## 📝 Notes

- **Sort Order**: The main category has `sort_order = 6`, placing it after Sports
- **Slug Format**: All slugs use kebab-case for URL-friendly navigation
- **Active Listing Count**: Initialized to 0 for all new categories
- **Parent-Child Relationship**: Subcategories reference the main category via `parent_id`

## 🔍 Testing After Deployment

1. **In the UI**:
   - Go to the "Sell" page
   - Verify "Toys & Models" appears in the category dropdown
   - Verify all subcategories appear when you select it

2. **Via API**:
   ```javascript
   const { data: categories } = await supabase
     .from('categories')
     .select('*')
     .eq('slug', 'toys-and-models');
   ```

3. **Create a Test Listing**:
   - Try creating a listing in one of the new subcategories
   - Verify it saves correctly

## 🐛 Troubleshooting

### Categories Not Appearing

```sql
-- Check if migration was applied
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version = '045';
```

### Duplicate Slug Error

If you get a duplicate slug error, it means some categories already exist. The migration will skip those automatically due to the `WHERE NOT EXISTS` clauses.

### Count the Categories

```sql
-- Should return 1
SELECT COUNT(*) FROM categories WHERE slug = 'toys-and-models';

-- Should return 11
SELECT COUNT(*) FROM categories 
WHERE parent_id = (SELECT id FROM categories WHERE slug = 'toys-and-models');
```

## 🎉 Success!

Once deployed, sellers can immediately start listing items in these new categories. The categories will appear in:
- Category dropdown on the sell page
- Browse categories page
- Category filters
- Search results

---

**Need Help?** Check the main README or consult the Supabase documentation.

