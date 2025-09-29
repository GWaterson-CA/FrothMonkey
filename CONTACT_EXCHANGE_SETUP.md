# Contact Exchange & Messaging System - Setup Guide

## Overview

This feature enables buyers and sellers to exchange contact information and communicate after an auction ends. The system automatically handles different scenarios based on whether the reserve price was met.

## Features

### 1. **Automatic Contact Exchange (Reserve Met)**
When an auction ends with the reserve price met (or no reserve):
- Contact details are automatically shared between buyer and seller
- Both parties can immediately message each other
- Notifications are sent to both parties

### 2. **Approval Required (Reserve Not Met)**
When an auction ends without meeting the reserve:
- Seller receives a notification asking if they want to connect with the highest bidder
- Seller can approve or decline the contact exchange
- If approved, contact details are shared and messaging becomes available
- If declined, no contact information is shared

### 3. **Short Messaging System**
Once contact is approved:
- Both parties can exchange short messages (max 500 characters)
- Messages are displayed in a chat-like interface
- Real-time updates (polls every 10 seconds)
- Perfect for sharing:
  - Phone numbers
  - Email addresses
  - Physical addresses
  - Delivery preferences
  - Payment arrangements
  - Meeting locations

## Database Schema

### New Tables

#### `auction_contacts`
Manages contact exchange between buyers and sellers.

**Columns:**
- `id` - UUID primary key
- `listing_id` - Reference to the listing
- `seller_id` - Reference to seller profile
- `buyer_id` - Reference to buyer profile
- `status` - `pending_approval`, `approved`, `auto_approved`, or `declined`
- `seller_contact_visible` - Boolean flag
- `buyer_contact_visible` - Boolean flag
- `reserve_met` - Boolean indicating if reserve was met
- `final_price` - Final auction price
- `created_at` - Timestamp
- `approved_at` - Timestamp when approved
- `declined_at` - Timestamp when declined

#### `auction_messages`
Stores messages between buyers and sellers.

**Columns:**
- `id` - UUID primary key
- `contact_id` - Reference to auction_contacts
- `sender_id` - Message sender
- `recipient_id` - Message recipient
- `message` - Message text (max 500 characters)
- `read_at` - Timestamp when read
- `created_at` - Timestamp

### Database Functions

#### `create_contact_exchange()`
Called automatically by `finalize_auctions()` when an auction ends.
- Creates contact exchange record
- Sets appropriate status based on reserve
- Sends notifications to relevant parties

#### `approve_contact_exchange()`
Called when seller approves a pending contact exchange.
- Updates status to approved
- Makes contact details visible
- Sends notifications

#### `decline_contact_exchange()`
Called when seller declines a pending contact exchange.
- Updates status to declined
- Sends notification to buyer

## Installation Steps

### 1. Run Database Migration

```bash
# Apply the migration
supabase db push
```

Or manually run:
```bash
supabase migration apply 026_auction_contact_exchange
```

### 2. Verify Database Setup

Check that the tables were created:
```sql
SELECT * FROM auction_contacts LIMIT 1;
SELECT * FROM auction_messages LIMIT 1;
```

### 3. Test the Finalize Function

The `finalize_auctions()` function has been updated to automatically create contact exchanges.

Test it:
```sql
SELECT finalize_auctions(10);
```

## User Interface

### For Sellers (My Listings Page)

1. Navigate to **Account → My Listings**
2. Click on the **Contact Exchanges** tab
3. View all contact exchanges for your auctions

**Pending Approvals:**
- Yellow notification box appears
- Two buttons: "Approve" and "Decline"
- Click "Approve" to share contact details
- Click "Decline" to reject the request

**Approved Exchanges:**
- Green badge shows "Approved"
- "Show Messages" button available
- Can send and receive messages

### For Buyers (My Bids Page)

1. Navigate to **Account → My Bids**
2. Click on the **Contact Exchanges** tab
3. View all contact exchanges for auctions you bid on

**Pending Status:**
- Yellow notification shows "Waiting for seller to approve"
- No messaging available yet

**Approved Exchanges:**
- Green badge shows "Approved"
- "Show Messages" button available
- Can send and receive messages

## API Endpoints

### GET `/api/contacts`
Get all contact exchanges for the current user.

**Query Parameters:**
- `role` - Optional: `seller` or `buyer`

**Response:** Array of contact exchange objects

### GET `/api/contacts/[id]`
Get details for a specific contact exchange.

**Response:** Contact exchange object with listing and user details

### PATCH `/api/contacts/[id]`
Update contact exchange status (approve/decline).

**Body:**
```json
{
  "action": "approve" | "decline"
}
```

**Response:** 
```json
{
  "success": true
}
```

### GET `/api/contacts/[id]/messages`
Get all messages for a contact exchange.

**Response:** Array of message objects

### POST `/api/contacts/[id]/messages`
Send a new message.

**Body:**
```json
{
  "message": "Your message here (max 500 characters)"
}
```

**Response:** Created message object

## Notifications

The system creates several notification types:

- `contact_shared` - Contact details have been shared (auto-approved)
- `contact_approval_needed` - Seller needs to approve/decline (reserve not met)
- `contact_approved` - Seller approved the contact exchange
- `contact_declined` - Seller declined the contact exchange
- `new_message` - New message received

## Security & Privacy

### Row Level Security (RLS)
- Users can only view their own contact exchanges
- Users can only send messages in approved exchanges
- Only sellers can approve/decline pending exchanges
- Service role required to create contact exchanges (via finalize_auctions)

### Data Protection
- Contact visibility is controlled by separate flags for buyer/seller
- Messages limited to 500 characters
- Messages only available after approval
- All actions are logged with timestamps

## Testing

### Test Scenario 1: Reserve Met
1. Create a listing with a reserve price
2. Place bids that meet the reserve
3. Wait for auction to end (or manually call finalize_auctions)
4. Check that contact exchange is created with status `auto_approved`
5. Verify both parties see the contact exchange
6. Test sending messages

### Test Scenario 2: Reserve Not Met
1. Create a listing with a reserve price
2. Place bids below the reserve
3. Wait for auction to end
4. Check that contact exchange is created with status `pending_approval`
5. As seller, approve the contact exchange
6. Verify buyer receives notification
7. Test sending messages

### Test Scenario 3: Declined Exchange
1. Follow steps 1-4 from Scenario 2
2. As seller, decline the contact exchange
3. Verify buyer receives notification
4. Confirm messaging is not available

## Troubleshooting

### Contact Exchange Not Created
- Verify the auction has ended
- Check that there was at least one bid
- Review `finalize_auctions` function logs
- Ensure migration was applied successfully

### Messages Not Sending
- Verify contact exchange status is `approved` or `auto_approved`
- Check message length (max 500 characters)
- Ensure user is part of the contact exchange
- Review RLS policies

### Notifications Not Received
- Verify `create_notification` function exists
- Check user's notification preferences
- Review notification creation in function logs

## Future Enhancements

Possible improvements:
- Real-time messaging with WebSockets
- File attachments (photos of items)
- Email/SMS integration for contact sharing
- Dispute resolution system
- Rating/review after contact exchange
- Contact export feature

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Review Supabase logs for database errors
3. Verify all migrations have been applied
4. Check RLS policies are enabled

## Code Locations

- **Migration:** `/supabase/migrations/026_auction_contact_exchange.sql`
- **Database Types:** `/lib/database.types.ts`
- **API Routes:** `/app/api/contacts/`
- **Components:** `/components/account/contact-exchange-card.tsx`, `/components/account/contact-messaging.tsx`
- **Pages:** `/app/account/listings/page.tsx`, `/app/account/bids/page.tsx`
