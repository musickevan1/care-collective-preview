'use client'
import { useRef, useState, useEffect, ReactNode, ReactElement } from 'react'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  pullStrength?: number
  href?: string
}

export default function MagneticButton({
  children,
  className = '',
  pullStrength = 0.25,
  href
}: MagneticButtonProps): ReactElement {
  const buttonRef = useRef<HTMLAnchorElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const button = buttonRef.current
    if (!button || !isHovered) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const x = e.clientX - centerX
      const y = e.clientY - centerY

      setPosition({
        x: x * pullStrength,
        y: y * pullStrength
      })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isHovered, pullStrength])

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => {
    setIsHovered(false)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <a
      ref={buttonRef}
      href={href}
      className={`inline-block transition-transform duration-200 ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        className="inline-flex items-center justify-center"
        style={{
          transform: `translate(${-position.x * 0.5}px, ${-position.y * 0.5}px)`,
          transition: 'transform 200ms ease-out'
        }}
      >
        {children}
      </span>
    </a>
  )
}
