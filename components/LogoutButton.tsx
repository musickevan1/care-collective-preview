'use client'

import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth'
import { useState } from 'react'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function LogoutButton({ variant = 'destructive', size = 'sm', className }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      await signOut()
      // Redirect to home page after successful logout
      window.location.href = window.location.origin + '/'
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoading(false)
      // You could add a toast notification here
    }
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={`text-white focus:ring-[#D8837C]/50 font-overlock ${className}`}
      style={{ backgroundColor: isHovered ? '#C7726C' : '#D8837C' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </Button>
  )
}