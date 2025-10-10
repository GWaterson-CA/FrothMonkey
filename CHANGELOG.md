# Changelog

All notable changes to this project will be documented in this file.

## [2.7.0] - 2025-10-10

### Fixed
- **Outbid Email Notifications**: Users now receive an email EVERY TIME they are outbid (previously only received one email per listing)
  - Removed duplicate notification check in database trigger
  - Updated Edge Function to send emails directly via Resend API
  - Improved email notification reliability and user experience

### Technical Changes
- Updated `notify_bid_placed()` database function to remove "only once per listing" restriction
- Completely rewrote `send-notification-emails` Edge Function for better reliability
- Added proper environment variable management for Edge Functions
- Enhanced email template with better styling and user experience

### Documentation
- Added comprehensive troubleshooting guides for email notifications
- Created migration scripts for outbid notification fixes
- Updated email notification setup documentation

## [2.6.2] - Previous Version
- Previous auction marketplace features and functionality
