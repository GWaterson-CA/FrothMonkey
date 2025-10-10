'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  XCircle,
  Loader2
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TestResult {
  success: boolean
  messageId?: string
  error?: string
  timestamp: string
}

export function EmailTestInterface() {
  const [testEmail, setTestEmail] = useState('')
  const [testName, setTestName] = useState('Test User')
  const [testMessage, setTestMessage] = useState('This is a test email from FrothMonkey. If you received this, the email system is working correctly!')
  const [notificationType, setNotificationType] = useState('test_email')
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const { toast } = useToast()

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      // Build test data based on notification type
      let testData: any = {}
      
      if (notificationType === 'bid_outbid') {
        testData = {
          listingId: 'test-listing-id',
          listingTitle: 'Test Auction Listing',
          previousBid: 100,
          newBid: 150
        }
      } else if (notificationType.startsWith('time_warning')) {
        testData = {
          listingId: 'test-listing-id',
          listingTitle: 'Test Auction Listing',
          currentBid: 200,
          isLeadingBidder: true
        }
      } else if (notificationType === 'listing_ended_seller') {
        testData = {
          listingId: 'test-listing-id',
          listingTitle: 'Test Auction Listing',
          finalBid: 250,
          buyerName: 'John Doe',
          reserveMet: true,
          hadBids: true
        }
      } else if (notificationType === 'auction_won') {
        testData = {
          listingId: 'test-listing-id',
          listingTitle: 'Test Auction Listing',
          finalBid: 250,
          sellerName: 'Jane Smith'
        }
      } else {
        testData = {
          message: testMessage
        }
      }

      // Call a special test endpoint
      const response = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientEmail: testEmail,
          recipientName: testName,
          notificationType,
          notificationData: testData
        })
      })

      const result = await response.json()

      if (response.ok) {
        const testResult: TestResult = {
          success: true,
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        }
        setTestResults([testResult, ...testResults])
        
        toast({
          title: 'Success!',
          description: `Test email sent successfully to ${testEmail}`,
        })
      } else {
        const testResult: TestResult = {
          success: false,
          error: result.error || 'Unknown error',
          timestamp: new Date().toISOString()
        }
        setTestResults([testResult, ...testResults])
        
        toast({
          title: 'Error',
          description: result.error || 'Failed to send test email',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      const testResult: TestResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
      setTestResults([testResult, ...testResults])
      
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const notificationTypes = [
    { value: 'test_email', label: 'Test Email (Simple)' },
    { value: 'bid_outbid', label: 'Outbid Notification' },
    { value: 'time_warning_24h', label: '24 Hour Warning' },
    { value: 'time_warning_2h', label: '2 Hour Warning' },
    { value: 'listing_ended_seller', label: 'Auction Ended (Seller)' },
    { value: 'auction_won', label: 'Auction Won (Buyer)' }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Test Email
          </CardTitle>
          <CardDescription>
            Send a test email to verify the email notification system is working correctly.
            <br />
            <strong className="text-orange-600">Important:</strong> Check your terminal/console for detailed logs after sending.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-type">Notification Type</Label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger id="notification-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-email">Recipient Email</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-name">Recipient Name</Label>
            <Input
              id="test-name"
              type="text"
              placeholder="Test User"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
          </div>

          {notificationType === 'test_email' && (
            <div className="space-y-2">
              <Label htmlFor="test-message">Test Message</Label>
              <Textarea
                id="test-message"
                placeholder="Enter a custom test message..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <Button 
            onClick={sendTestEmail} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Recent test email results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">
                        {result.success ? 'Email sent successfully' : 'Failed to send email'}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(result.timestamp).toLocaleString()}
                      </div>
                      {result.messageId && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Message ID: {result.messageId}
                        </div>
                      )}
                      {result.error && (
                        <div className="text-sm text-red-600 mt-1">
                          Error: {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>
            Current email notification settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Email Provider:</span>
              <span className="font-medium">Resend</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Sender Email:</span>
              <span className="font-medium">updates@frothmonkey.com</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Sender Name:</span>
              <span className="font-medium">FrothMonkey</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">SMTP Host:</span>
              <span className="font-medium">smtp.resend.com</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-medium text-blue-900 mb-1">📝 Troubleshooting Tips:</p>
            <ul className="text-blue-800 space-y-1 ml-4 list-disc">
              <li>Check your terminal for detailed logs (prefixed with [API] and [Email])</li>
              <li>Ensure RESEND_API_KEY is set in your .env.local file</li>
              <li>For testing, send to the email used for your Resend account</li>
              <li>Check spam folder if email doesn't arrive</li>
              <li>Verify domain in Resend for production use</li>
            </ul>
            <p className="mt-2 text-blue-800">
              See <code className="bg-blue-100 px-1 rounded">EMAIL_TROUBLESHOOTING_GUIDE.md</code> for detailed help.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

