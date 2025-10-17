'use client'

import { useEffect, useState } from 'react'

interface Circle {
  id: number
  size: number
  color: string
  initialX: number
  initialY: number
  duration: number
  delay: number
  direction: 'clockwise' | 'counterclockwise'
}

export function FloatingCircles() {
  const [circles, setCircles] = useState<Circle[]>([])

  useEffect(() => {
    // Generate random circles
    const colors = [
      'rgba(59, 130, 246, 0.15)',  // blue
      'rgba(168, 85, 247, 0.15)',  // purple
      'rgba(236, 72, 153, 0.15)',  // pink
      'rgba(34, 197, 94, 0.15)',   // green
      'rgba(251, 146, 60, 0.15)',  // orange
      'rgba(14, 165, 233, 0.15)',  // sky
    ]

    const newCircles: Circle[] = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      size: Math.random() * 150 + 100, // 100-250px
      color: colors[Math.floor(Math.random() * colors.length)],
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      duration: Math.random() * 13 + 20, // 20-33s (50% faster)
      delay: Math.random() * -20, // stagger start times
      direction: Math.random() > 0.5 ? 'clockwise' : 'counterclockwise'
    }))

    setCircles(newCircles)
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float-clockwise {
            0%, 100% {
              transform: translate(-50%, -50%) translate(0, 0) rotate(0deg);
            }
            25% {
              transform: translate(-50%, -50%) translate(100px, -50px) rotate(90deg);
            }
            50% {
              transform: translate(-50%, -50%) translate(150px, 0) rotate(180deg);
            }
            75% {
              transform: translate(-50%, -50%) translate(100px, 50px) rotate(270deg);
            }
          }
          
          @keyframes float-counterclockwise {
            0%, 100% {
              transform: translate(-50%, -50%) translate(0, 0) rotate(0deg);
            }
            25% {
              transform: translate(-50%, -50%) translate(-100px, -50px) rotate(-90deg);
            }
            50% {
              transform: translate(-50%, -50%) translate(-150px, 0) rotate(-180deg);
            }
            75% {
              transform: translate(-50%, -50%) translate(-100px, 50px) rotate(-270deg);
            }
          }
        `
      }} />
      
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        {circles.map((circle) => (
          <div
            key={circle.id}
            className="absolute rounded-full blur-2xl"
            style={{
              width: `${circle.size}px`,
              height: `${circle.size}px`,
              background: circle.color,
              left: `${circle.initialX}%`,
              top: `${circle.initialY}%`,
              animation: `float-${circle.direction} ${circle.duration}s ease-in-out infinite`,
              animationDelay: `${circle.delay}s`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    </>
  )
}

