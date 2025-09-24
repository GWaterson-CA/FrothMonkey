'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, Reply } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface Question {
  id: string
  question: string
  answer: string | null
  answered_at: string | null
  created_at: string | null
  questioner_id: string
  profiles: {
    username: string | null
    full_name: string | null
  }
}

interface QuestionsData {
  questions: Question[]
  unanswered_count: number
}

interface AuctionQuestionsProps {
  listingId: string
  isOwner: boolean
  isLoggedIn: boolean
}

export function AuctionQuestions({ listingId, isOwner, isLoggedIn }: AuctionQuestionsProps) {
  const [questionsData, setQuestionsData] = useState<QuestionsData>({ questions: [], unanswered_count: 0 })
  const [loading, setLoading] = useState(true)
  const [newQuestion, setNewQuestion] = useState('')
  const [submittingQuestion, setSubmittingQuestion] = useState(false)
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchQuestions()
  }, [listingId])

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/questions?listing_id=${listingId}`)
      if (response.ok) {
        const data = await response.json()
        setQuestionsData(data)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newQuestion.trim()) return

    setSubmittingQuestion(true)
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: listingId,
          question: newQuestion.trim()
        })
      })

      if (response.ok) {
        setNewQuestion('')
        toast({
          title: 'Question submitted',
          description: 'Your question has been sent to the seller. You\'ll be notified when it\'s answered.',
        })
        await fetchQuestions()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to submit question',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error submitting question:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit question',
        variant: 'destructive',
      })
    } finally {
      setSubmittingQuestion(false)
    }
  }

  const handleSubmitAnswer = async (questionId: string) => {
    if (!answerText.trim()) return

    try {
      const response = await fetch(`/api/questions/${questionId}/answer`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer: answerText.trim()
        })
      })

      if (response.ok) {
        setAnsweringId(null)
        setAnswerText('')
        toast({
          title: 'Answer posted',
          description: 'Your answer is now visible to all users.',
        })
        await fetchQuestions()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to post answer',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error posting answer:', error)
      toast({
        title: 'Error',
        description: 'Failed to post answer',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading questions...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const answeredQuestions = questionsData.questions.filter(q => q.answer)
  const unansweredQuestions = questionsData.questions.filter(q => !q.answer)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Questions & Answers
          </CardTitle>
          {isOwner && questionsData.unanswered_count > 0 && (
            <Badge variant="secondary">
              {questionsData.unanswered_count} unanswered
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question Form for non-owners */}
        {!isOwner && isLoggedIn && (
          <form onSubmit={handleSubmitQuestion} className="space-y-3">
            <Textarea
              placeholder="Ask the seller a question about this item..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={3}
            />
            <Button 
              type="submit" 
              disabled={!newQuestion.trim() || submittingQuestion}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {submittingQuestion ? 'Sending...' : 'Ask Question'}
            </Button>
          </form>
        )}

        {/* Unanswered Questions (only visible to owner) */}
        {isOwner && unansweredQuestions.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Unanswered Questions</h4>
            {unansweredQuestions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      @{question.profiles?.username || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {question.created_at && formatDateTime(question.created_at)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Pending
                  </Badge>
                </div>
                <p className="mb-4 text-sm">{question.question}</p>
                
                {answeringId === question.id ? (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Type your answer..."
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSubmitAnswer(question.id)}
                        disabled={!answerText.trim()}
                      >
                        Post Answer
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setAnsweringId(null)
                          setAnswerText('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setAnsweringId(question.id)}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Answer
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Answered Questions */}
        {answeredQuestions.length > 0 && (
          <div className="space-y-4">
            {unansweredQuestions.length > 0 && isOwner && (
              <h4 className="font-semibold text-sm">Answered Questions</h4>
            )}
            {answeredQuestions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">
                      @{question.profiles?.username || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {question.created_at && formatDateTime(question.created_at)}
                    </p>
                  </div>
                  <p className="text-sm">{question.question}</p>
                </div>
                
                <div className="border-t pt-3 bg-muted/10 -mx-4 -mb-4 p-4 rounded-b-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-primary">Seller's Answer</p>
                    {question.answered_at && (
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(question.answered_at)}
                      </p>
                    )}
                  </div>
                  <p className="text-sm">{question.answer}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {questionsData.questions.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No questions yet. {!isOwner && isLoggedIn && "Be the first to ask!"}
            </p>
          </div>
        )}

        {!isLoggedIn && !isOwner && (
          <div className="text-center py-4 border rounded-lg bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Please log in to ask questions about this item.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
