'use client'

import { useState, useEffect } from 'react'
import { isAfter } from 'date-fns'

interface CountdownTimerProps {
  endTime: string | Date
  onExpire?: () => void
}

export function CountdownTimer({ endTime, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = typeof endTime === 'string' ? new Date(endTime) : endTime
      const now = new Date()

      if (isAfter(now, end)) {
        setIsExpired(true)
        if (onExpire) onExpire()
        return null
      }

      const difference = end.getTime() - now.getTime()
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }
    }

    // Calculate initial time
    setTimeLeft(calculateTimeLeft())

    // Set up interval
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime, onExpire])

  if (isExpired) {
    return <span className="text-destructive font-medium">Auction ended</span>
  }

  if (!timeLeft) {
    return <span>Loading...</span>
  }

  const { days, hours, minutes, seconds } = timeLeft
  const isUrgent = days === 0 && hours < 2

  return (
    <span className={isUrgent ? 'text-destructive font-medium' : ''}>
      {days > 0 && `${days}d `}
      {(days > 0 || hours > 0) && `${hours}h `}
      {(days > 0 || hours > 0 || minutes > 0) && `${minutes}m `}
      {days === 0 && hours === 0 && `${seconds}s`}
    </span>
  )
}
