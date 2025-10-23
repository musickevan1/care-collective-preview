'use client'

import { ReactElement, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'

export function ContactForm(): ReactElement {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // Create mailto link with form data
      const subject = encodeURIComponent(formData.subject || 'Contact Form Submission')
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      )
      const mailtoLink = `mailto:swmocarecollective@gmail.com?subject=${subject}&body=${body}`

      // Open mailto link
      window.location.href = mailtoLink

      // Reset form and show success
      setFormData({ name: '', email: '', subject: '', message: '' })
      setSubmitStatus('success')
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-sage/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Send className="w-6 h-6 text-sage" />
          Send Us a Message
        </CardTitle>
        <CardDescription>
          Fill out the form below and we'll get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-medium">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="min-h-[44px] border-sage/20 focus:border-sage focus:ring-sage"
              placeholder="Your full name"
              aria-required="true"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="min-h-[44px] border-sage/20 focus:border-sage focus:ring-sage"
              placeholder="your.email@example.com"
              aria-required="true"
            />
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-foreground font-medium">
              Subject
            </Label>
            <Input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="min-h-[44px] border-sage/20 focus:border-sage focus:ring-sage"
              placeholder="What is your message about?"
            />
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-foreground font-medium">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={6}
              className="border-sage/20 focus:border-sage focus:ring-sage resize-none"
              placeholder="Tell us how we can help you..."
              aria-required="true"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-sage text-white hover:bg-sage-dark min-h-[48px] text-lg font-semibold transition-all duration-300 hover:shadow-lg"
          >
            {isSubmitting ? (
              <>
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Message
              </>
            )}
          </Button>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="p-4 bg-sage/10 border border-sage/20 rounded-lg text-sage-dark text-center">
              Thank you for your message! Your default email client should open now.
            </div>
          )}
          {submitStatus === 'error' && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-center">
              There was an error submitting your message. Please try again or email us directly.
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
