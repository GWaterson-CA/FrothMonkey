'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, MessageCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Message {
  id: string
  content: string
  created_at: string
  read_at: string | null
  profiles: {
    id: string
    username: string
  }
}

interface Conversation {
  id: string
  listing_id: string
  seller_id: string
  buyer_id: string
  created_at: string
  updated_at: string
  listings: {
    id: string
    title: string
    cover_image_url?: string
  }
  participants: Array<{
    user_id: string
    username: string
    is_seller: boolean
  }>
}

interface MessageConversationProps {
  listingId: string
  currentUserId: string
}

export function MessageConversation({ listingId, currentUserId }: MessageConversationProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const fetchConversation = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/conversations?listingId=${listingId}`)
        if (response.ok) {
          const data = await response.json()
          setConversation(data.conversation)
        }
      } catch (error) {
        console.error('Error fetching conversation:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversation()
  }, [listingId])

  useEffect(() => {
    if (conversation) {
      const fetchMessages = async () => {
        try {
          const response = await fetch(`/api/messages?conversationId=${conversation.id}`)
          if (response.ok) {
            const data = await response.json()
            setMessages(data.messages)
          }
        } catch (error) {
          console.error('Error fetching messages:', error)
        }
      }

      fetchMessages()
    }
  }, [conversation])

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: newMessage.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading conversation...</div>
        </CardContent>
      </Card>
    )
  }

  if (!conversation) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Unable to load conversation
          </div>
        </CardContent>
      </Card>
    )
  }

  const otherParticipant = conversation.participants.find(p => p.user_id !== currentUserId)

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Message @{otherParticipant?.username}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          About: {conversation.listings.title}
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.profiles.id === currentUserId
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {formatDateTime(message.created_at)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="min-h-[60px] resize-none"
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
