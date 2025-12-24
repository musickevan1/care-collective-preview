'use client'
import { useState, useEffect } from 'react'

export default function AnimatedGradientText() {
  const [gradientPos, setGradientPos] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPos(prev => (prev + 0.5) % 100)
    }, 50) // 20fps = smooth, elegant shimmer

    return () => clearInterval(interval)
  }, [])

  return (
    <h1
      className="text-[clamp(56px,15vw,180px)] font-black uppercase tracking-tighter"
      style={{
        background: `linear-gradient(135deg, #5A7E79 ${gradientPos}%, #4A6B66 ${gradientPos + 50}%)`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundSize: '200% 200%',
        filter: 'drop-shadow(0 8px 16px rgba(90, 126, 121, 0.25))'
      }}
      aria-label="CARE Collective"
    >
      CARE Collective
    </h1>
  )
}
