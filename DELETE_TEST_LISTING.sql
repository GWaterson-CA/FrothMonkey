-- =====================================================
-- DELETE TEST LISTING
-- =====================================================
-- This script deletes the test listing from the database
-- =====================================================

-- First, let's see what we're about to delete
SELECT 
    id,
    title,
    current_price,
    status,
    created_at,
    owner_id
FROM listings 
WHERE title LIKE 'TEST: Auto-Bid Email%'
ORDER BY created_at DESC;

-- Show related data that will be deleted (via CASCADE)
-- Bids on the test listing
SELECT COUNT(*) as bid_count
FROM bids 
WHERE listing_id IN (SELECT id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%');

-- Auto-bids on the test listing
SELECT COUNT(*) as auto_bid_count
FROM auto_bids 
WHERE listing_id IN (SELECT id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%');

-- Notifications for the test listing
SELECT COUNT(*) as notification_count
FROM notifications 
WHERE listing_id IN (SELECT id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%');

-- =====================================================
-- DELETE THE TEST LISTING
-- =====================================================

DELETE FROM listings 
WHERE title LIKE 'TEST: Auto-Bid Email%';

-- =====================================================
-- VERIFY DELETION
-- =====================================================

-- Should return 0
SELECT COUNT(*) as remaining_test_listings
FROM listings 
WHERE title LIKE 'TEST: Auto-Bid Email%';

-- Verify no orphaned data
SELECT COUNT(*) as orphaned_bids
FROM bids 
WHERE listing_id IN (SELECT id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%');

SELECT COUNT(*) as orphaned_auto_bids
FROM auto_bids 
WHERE listing_id IN (SELECT id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%');

SELECT 'Test listing deleted successfully!' as status;

