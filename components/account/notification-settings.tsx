'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NotificationPreferences {
  email_notifications: boolean
  question_received: boolean
  first_bid_received: boolean
  reserve_met: boolean
  listing_ended: boolean
  listing_reported: boolean
  bid_outbid: boolean
  auction_won: boolean
  time_warning_enabled: boolean
  time_warning_hours: number
}

const defaultPreferences: NotificationPreferences = {
  email_notifications: true,
  question_received: true,
  first_bid_received: true,
  reserve_met: true,
  listing_ended: true,
  listing_reported: true,
  bid_outbid: true,
  auction_won: true,
  time_warning_enabled: true,
  time_warning_hours: 24,
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationPreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single()

      if (profile?.notification_preferences) {
        setSettings(profile.notification_preferences as NotificationPreferences)
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: settings })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Notification preferences saved successfully',
      })
    } catch (error) {
      console.error('Error saving notification preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to save notification preferences',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateSetting = (key: keyof NotificationPreferences, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Choose which notifications you'd like to receive.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Master Switch</Label>
            <p className="text-sm text-muted-foreground">
              Enable or disable all email notifications
            </p>
          </div>
          <Switch
            checked={settings.email_notifications}
            onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Seller Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Questions Received</Label>
              <p className="text-sm text-muted-foreground">
                When someone asks a question about your listing
              </p>
            </div>
            <Switch
              checked={settings.question_received}
              onCheckedChange={(checked) => updateSetting('question_received', checked)}
              disabled={!settings.email_notifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>First Bid Received</Label>
              <p className="text-sm text-muted-foreground">
                When someone places the first bid on your listing
              </p>
            </div>
            <Switch
              checked={settings.first_bid_received}
              onCheckedChange={(checked) => updateSetting('first_bid_received', checked)}
              disabled={!settings.email_notifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Reserve Price Met</Label>
              <p className="text-sm text-muted-foreground">
                When the reserve price is met on your listing
              </p>
            </div>
            <Switch
              checked={settings.reserve_met}
              onCheckedChange={(checked) => updateSetting('reserve_met', checked)}
              disabled={!settings.email_notifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Listing Ended</Label>
              <p className="text-sm text-muted-foreground">
                When your listing ends (with outcome details)
              </p>
            </div>
            <Switch
              checked={settings.listing_ended}
              onCheckedChange={(checked) => updateSetting('listing_ended', checked)}
              disabled={!settings.email_notifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Listing Reported</Label>
              <p className="text-sm text-muted-foreground">
                When someone reports your listing
              </p>
            </div>
            <Switch
              checked={settings.listing_reported}
              onCheckedChange={(checked) => updateSetting('listing_reported', checked)}
              disabled={!settings.email_notifications}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Buyer Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Outbid Notifications</Label>
              <p className="text-sm text-muted-foreground">
                When someone outbids you (first time only)
              </p>
            </div>
            <Switch
              checked={settings.bid_outbid}
              onCheckedChange={(checked) => updateSetting('bid_outbid', checked)}
              disabled={!settings.email_notifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auction Won</Label>
              <p className="text-sm text-muted-foreground">
                When you win an auction
              </p>
            </div>
            <Switch
              checked={settings.auction_won}
              onCheckedChange={(checked) => updateSetting('auction_won', checked)}
              disabled={!settings.email_notifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auction Ending Warning</Label>
              <p className="text-sm text-muted-foreground">
                Notify me when an auction I'm bidding on is ending soon
              </p>
            </div>
            <Switch
              checked={settings.time_warning_enabled}
              onCheckedChange={(checked) => updateSetting('time_warning_enabled', checked)}
              disabled={!settings.email_notifications}
            />
          </div>

          {settings.time_warning_enabled && (
            <div className="flex items-center justify-between pl-6 border-l-2 border-muted">
              <div className="space-y-0.5">
                <Label>Warning Timeframe</Label>
                <p className="text-sm text-muted-foreground">
                  How far in advance should we notify you?
                </p>
              </div>
              <Select
                value={settings.time_warning_hours.toString()}
                onValueChange={(value) => updateSetting('time_warning_hours', parseInt(value))}
                disabled={!settings.email_notifications}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-start pt-4">
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
        <p className="font-medium mb-2">📧 Email Notifications Active</p>
        <p>
          Email notifications are powered by Resend and will be sent to your account email address.
          Make sure to keep your email address up to date in your account settings.
        </p>
      </div>
    </div>
  )
}
