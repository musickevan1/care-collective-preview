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
      variant={variant} 
      size={size} 
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </Button>
  )
}