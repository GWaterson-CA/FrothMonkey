#!/bin/bash

# Auto Bid Feature Deployment Script
# This script helps deploy the auto-bid feature to your auction marketplace

set -e  # Exit on error

echo "=========================================="
echo "Auto Bid Feature Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "→ $1"
}

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Step 1: Install dependencies
echo "Step 1: Installing dependencies..."
print_info "Installing @radix-ui/react-tooltip..."
npm install @radix-ui/react-tooltip
print_success "Dependencies installed"
echo ""

# Step 2: Check if Supabase CLI is available
echo "Step 2: Checking Supabase setup..."
if command -v supabase &> /dev/null; then
    print_success "Supabase CLI found"
    
    # Ask if user wants to apply migration via CLI
    read -p "Do you want to apply the migration using Supabase CLI? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Applying migration..."
        supabase migration up
        print_success "Migration applied successfully"
    else
        print_warning "Skipping migration. Please apply manually via Supabase dashboard."
        print_info "Migration file: supabase/migrations/038_auto_bid_feature.sql"
    fi
else
    print_warning "Supabase CLI not found"
    print_info "Please apply the migration manually:"
    print_info "1. Go to your Supabase dashboard"
    print_info "2. Navigate to SQL Editor"
    print_info "3. Copy and paste the contents of:"
    print_info "   supabase/migrations/038_auto_bid_feature.sql"
    print_info "4. Run the migration"
    echo ""
    read -p "Press Enter when migration is applied..." -r
fi
echo ""

# Step 3: Update database types (if Supabase CLI is available)
echo "Step 3: Updating database types..."
if command -v supabase &> /dev/null; then
    read -p "Do you want to regenerate database types? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Generating types..."
        supabase gen types typescript --local > lib/database.types.ts
        print_success "Database types updated"
    else
        print_warning "Skipping type generation"
        print_info "Database types have been manually updated in lib/database.types.ts"
    fi
else
    print_info "Database types have been manually updated in lib/database.types.ts"
fi
echo ""

# Step 4: Run type check
echo "Step 4: Running type check..."
print_info "Checking TypeScript types..."
if npm run typecheck; then
    print_success "Type check passed"
else
    print_error "Type check failed. Please fix type errors before deploying."
    exit 1
fi
echo ""

# Step 5: Build the application
echo "Step 5: Building application..."
print_info "Running production build..."
if npm run build; then
    print_success "Build successful"
else
    print_error "Build failed. Please check the errors above."
    exit 1
fi
echo ""

# Step 6: Final checklist
echo "=========================================="
echo "Deployment Checklist"
echo "=========================================="
echo ""
print_info "Before deploying to production, ensure:"
echo "  1. Database migration is applied to production"
echo "  2. Test accounts have been created for testing"
echo "  3. Auto-bid feature has been tested locally"
echo "  4. All tests pass"
echo ""

read -p "Have you completed all the above? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Please complete the checklist before deploying."
    exit 0
fi

echo ""
echo "=========================================="
print_success "Auto Bid Feature Ready for Deployment!"
echo "=========================================="
echo ""
print_info "Next steps:"
echo "  1. Deploy to your hosting platform (e.g., Vercel, Netlify)"
echo "  2. Verify migration is applied to production database"
echo "  3. Test the feature in production with test accounts"
echo "  4. Monitor logs for any errors"
echo ""
print_info "For detailed testing instructions, see AUTO_BID_FEATURE.md"
echo ""

print_success "Deployment preparation complete!"

