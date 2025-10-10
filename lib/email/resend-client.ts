import { Resend } from 'resend'

// Initialize Resend client
// The API key should be set in .env.local as RESEND_API_KEY
export const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
export const EMAIL_FROM = 'FrothMonkey <updates@frothmonkey.com>'
export const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://frothmonkey.com'

