'use client'
import { useState, useEffect } from 'react'

export default function MouseGradientBackground() {
  const [position, setPosition] = useState({ x: 50, y: 50 })

  useEffect(() => {
    let animationFrame: number

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100

      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(() => {
        setPosition({ x, y })
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <div
      className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-700 ease-out"
      style={{
        background: `radial-gradient(circle at ${position.x}% ${position.y}%, #5A7E79 0%, transparent 50%)`,
      }}
      aria-hidden="true"
    />
  )
}
