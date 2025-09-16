'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Save } from 'lucide-react'

export function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailBidUpdates: true,
    emailOutbid: true,
    emailWonAuction: true,
    emailListingEnded: true,
    emailNewMessages: false,
    browserNotifications: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsLoading(true)
    
    // Simulate API call - in a real app, this would save to the database
    setTimeout(() => {
      toast({
        title: 'Success',
        description: 'Notification preferences saved successfully',
      })
      setIsLoading(false)
    }, 1000)
  }

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Email Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Choose which email notifications you'd like to receive.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Bid Updates</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when someone bids on your items
            </p>
          </div>
          <Switch
            checked={settings.emailBidUpdates}
            onCheckedChange={(checked) => updateSetting('emailBidUpdates', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Outbid Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when you've been outbid on an item
            </p>
          </div>
          <Switch
            checked={settings.emailOutbid}
            onCheckedChange={(checked) => updateSetting('emailOutbid', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auction Won</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when you win an auction
            </p>
          </div>
          <Switch
            checked={settings.emailWonAuction}
            onCheckedChange={(checked) => updateSetting('emailWonAuction', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Listing Ended</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when your listings end
            </p>
          </div>
          <Switch
            checked={settings.emailListingEnded}
            onCheckedChange={(checked) => updateSetting('emailListingEnded', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>New Messages</Label>
            <p className="text-sm text-muted-foreground">
              Get notified about new messages (coming soon)
            </p>
          </div>
          <Switch
            checked={settings.emailNewMessages}
            onCheckedChange={(checked) => updateSetting('emailNewMessages', checked)}
            disabled
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Browser Notifications</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications in your browser (coming soon)
            </p>
          </div>
          <Switch
            checked={settings.browserNotifications}
            onCheckedChange={(checked) => updateSetting('browserNotifications', checked)}
            disabled
          />
        </div>
      </div>

      <div className="flex justify-start">
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          Save Preferences
        </Button>
      </div>

      <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
        <p className="font-medium mb-2">📧 Email Integration Coming Soon</p>
        <p>
          Email notifications are currently logged to the console for development. 
          Integration with email providers like Resend or SendGrid will be added in a future update.
        </p>
      </div>
    </div>
  )
}
