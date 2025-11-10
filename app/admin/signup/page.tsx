'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Rocket, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminSignupPage() {
  const [email, setEmail] = useState('evanmusick.dev@gmail.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: 'Admin User',
            role: 'admin'
          }
        }
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data?.user) {
        setMessage('✅ Admin account created successfully! Check your email for verification, then you can login.')
        setTimeout(() => {
          router.push('/login?redirectTo=/admin')
        }, 3000)
      }
    } catch (err) {
      setError('Failed to create admin account. Please check your Supabase configuration.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-secondary flex items-center justify-center gap-2">
            <Rocket className="w-6 h-6" aria-hidden="true" />
            Create Admin Account
          </CardTitle>
          <CardDescription>
            Phase 2.3 Admin Panel Setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Admin Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This email is pre-configured in the admin allowlist
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{message}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Admin Account'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" aria-hidden="true" />
              Next Steps:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Create your admin account here</li>
              <li>2. Check email for verification link</li>
              <li>3. Login at <code>/login</code></li>
              <li>4. Access admin panel at <code>/admin</code></li>
              <li>5. Test Phase 2.3 features!</li>
            </ol>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:underline">
                Login here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}