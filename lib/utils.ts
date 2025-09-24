import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting for CAD
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount)
}

// Time formatting for America/Vancouver timezone
const TIMEZONE = 'America/Vancouver'

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatInTimeZone(dateObj, TIMEZONE, 'MMM d, yyyy h:mm a zzz')
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatInTimeZone(dateObj, TIMEZONE, 'MMM d, yyyy')
}

export function formatTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatInTimeZone(dateObj, TIMEZONE, 'h:mm a')
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

export function isAuctionLive(startTime: string | Date, endTime: string | Date): boolean {
  const now = new Date()
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime
  
  return isAfter(now, start) && isBefore(now, end)
}

export function isAuctionEnded(endTime: string | Date): boolean {
  const now = new Date()
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime
  
  return isAfter(now, end)
}

export function isAuctionEndingSoon(endTime: string | Date, hoursThreshold: number = 2): boolean {
  const now = new Date()
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime
  const threshold = new Date(now.getTime() + hoursThreshold * 60 * 60 * 1000)
  
  return isBefore(now, end) && isAfter(threshold, end)
}

// Get the effective auction status considering both database status and time
export function getEffectiveAuctionStatus(
  status: string, 
  startTime: string | Date, 
  endTime: string | Date
): string {
  const now = new Date()
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime
  
  // If the auction has ended by time, it should be considered ended regardless of database status
  if (isAfter(now, end)) {
    return 'ended'
  }
  
  // If the auction hasn't started yet, it's scheduled
  if (isBefore(now, start)) {
    return 'scheduled'
  }
  
  // Otherwise, use the database status
  return status
}

// Check if auction is effectively live (considering time)
export function isAuctionEffectivelyLive(
  status: string, 
  startTime: string | Date, 
  endTime: string | Date
): boolean {
  return getEffectiveAuctionStatus(status, startTime, endTime) === 'live'
}

// Slug generation
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// File size formatting
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// Image URL helpers
export function getImageUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${path}`
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,24}$/
  return usernameRegex.test(username)
}
