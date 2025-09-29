'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  contact_id: string
  sender_id: string
  recipient_id: string
  message: string
  read_at: string | null
  created_at: string
  sender: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  }
  recipient: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  }
}

interface ContactMessagingProps {
  contactId: string
  currentUserId: string
  otherParty: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  }
}

export function ContactMessaging({ 
  contactId, 
  currentUserId,
  otherParty 
}: ContactMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/messages`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [contactId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/contacts/${contactId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const sentMessage = await response.json()
      setMessages(prev => [...prev, sentMessage])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Messages List */}
      <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-4 bg-muted/20">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No messages yet.</p>
            <p className="text-sm mt-1">
              Start a conversation to share delivery details, phone numbers, or other information.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId
            const sender = isOwn ? message.sender : otherParty

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isOwn && "flex-row-reverse"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={sender.avatar_url || undefined} />
                  <AvatarFallback>
                    {(sender.username || sender.full_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className={cn(
                  "flex-1 space-y-1",
                  isOwn && "items-end"
                )}>
                  <div className={cn(
                    "inline-block p-3 rounded-lg max-w-[80%]",
                    isOwn 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.message}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground px-1">
                    {formatDateTime(message.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="space-y-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message... (max 500 characters)"
          maxLength={500}
          rows={3}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {newMessage.length}/500 characters
          </span>
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || isSending}
            size="sm"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
