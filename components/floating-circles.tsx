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

    // Create a grid-based distribution for more even spread
    const gridCols = 5
    const gridRows = 3
    const cellWidth = 100 / gridCols
    const cellHeight = 100 / gridRows
    
    const newCircles: Circle[] = Array.from({ length: 15 }, (_, i) => {
      const col = i % gridCols
      const row = Math.floor(i / gridCols)
      
      // Add some randomness within each grid cell
      const cellX = col * cellWidth + Math.random() * cellWidth
      const cellY = row * cellHeight + Math.random() * cellHeight
      
      return {
        id: i,
        size: Math.random() * 150 + 100, // 100-250px
        color: colors[Math.floor(Math.random() * colors.length)],
        initialX: cellX,
        initialY: cellY,
        duration: Math.random() * 7 + 12, // 20-33s (50% faster)
        delay: Math.random() * -20, // stagger start times
        direction: Math.random() > 0.5 ? 'clockwise' : 'counterclockwise'
      }
    })

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

