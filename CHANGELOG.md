# Changelog

All notable changes to this project will be documented in this file.

## [2.8.10] - 2025-10-14

### Added
- **Custom Email Templates**: Added FrothMonkey-branded email templates for authentication flows
  - Confirm Email (Account Creation) template with "Click to Complete Your Profile" button
  - Reset Password email template with security information
  - Both templates feature FrothMonkey purple gradient branding
- **Admin Email Testing**: Added new email types to Admin Email Test interface for easy testing

### Updated
- Enhanced email template system with additional authentication email types
- Updated email notification handler to support confirm_email and reset_password types

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
