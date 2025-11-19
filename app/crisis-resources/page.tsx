/**
 * @fileoverview Crisis resources and community support page
 * Provides immediate crisis support, hotlines, and community resources
 */

import { ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Heart, 
  Phone, 
  ExternalLink, 
  Shield,
  Users,
  Home,
  AlertTriangle,
  Clock,
  MapPin,
  Headphones
} from 'lucide-react';

export default function ResourcesPage(): ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Critical Alert Banner */}
        <Card className="mb-6 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                  Emergency? Call 911 Immediately
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  If you&apos;re in immediate danger or having a medical emergency, call 911 or your local emergency services right away.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Resources Link */}
        <Card className="mb-6 border-sage/30 bg-sage/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-sage flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Looking for Community Support?
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Find local organizations offering food assistance, transportation, housing support, and more.
                </p>
                <Link
                  href="/resources"
                  className="text-sm text-sage hover:underline font-medium inline-flex items-center gap-1"
                >
                  View Community Resources
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-sage" />
          </div>
          <h1 className="text-3xl font-bold text-secondary mb-2">
            Crisis Resources & Support
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            You matter. Your wellbeing matters. These resources are available 24/7 to provide immediate support when you need it most.
          </p>
        </div>

        {/* National Crisis Hotlines */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-secondary mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-sage" />
            National Crisis Hotlines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-sage/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-sage" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary">988 Suicide & Crisis Lifeline</h3>
                    <Badge variant="outline" className="text-xs">24/7 Available</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Call:</span>
                    <a href="tel:988" className="text-sage hover:underline font-mono">988</a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Text:</span>
                    <a href="sms:988" className="text-sage hover:underline font-mono">988</a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Chat:</span>
                    <a 
                      href="https://suicidepreventionlifeline.org/chat/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sage hover:underline text-sm flex items-center gap-1"
                    >
                      Online Chat <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Free, confidential support for people in suicidal crisis or emotional distress
                </p>
              </CardContent>
            </Card>

            <Card className="border-dusty-rose/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-dusty-rose/10 rounded-full flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-dusty-rose" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary">Crisis Text Line</h3>
                    <Badge variant="outline" className="text-xs">24/7 Available</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Text:</span>
                    <span className="font-mono">
                      <a href="sms:741741" className="text-dusty-rose hover:underline">HOME to 741741</a>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Web:</span>
                    <a 
                      href="https://www.crisistextline.org/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-dusty-rose hover:underline text-sm flex items-center gap-1"
                    >
                      crisistextline.org <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  24/7 support via text message with trained crisis counselors
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Specialized Support */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-secondary mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Specialized Support
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-sage" />
                </div>
                <h3 className="font-semibold text-secondary mb-2">Domestic Violence</h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">National Hotline:</span>
                    <br />
                    <a href="tel:18007997233" className="text-sage hover:underline font-mono">
                      1-800-799-7233
                    </a>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Text:</span>
                    <br />
                    <a href="sms:22522" className="text-sage hover:underline font-mono">
                      START to 22522
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-dusty-rose/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-dusty-rose" />
                </div>
                <h3 className="font-semibold text-secondary mb-2">LGBTQ+ Support</h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Trevor Lifeline:</span>
                    <br />
                    <a href="tel:18664887386" className="text-dusty-rose hover:underline font-mono">
                      1-866-488-7386
                    </a>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Text:</span>
                    <br />
                    <a href="sms:678678" className="text-dusty-rose hover:underline font-mono">
                      START to 678678
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-secondary mb-2">Veterans Crisis</h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Call:</span>
                    <br />
                    <a href="tel:18002738255" className="text-primary hover:underline font-mono">
                      1-800-273-8255
                    </a>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Text:</span>
                    <br />
                    <a href="sms:838255" className="text-primary hover:underline font-mono">
                      838255
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Local Missouri Resources */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-secondary mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sage" />
            Missouri Local Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-secondary mb-3">Southwest Missouri</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Burrell Behavioral Health:</span>
                    <br />
                    <a href="tel:4178319000" className="text-sage hover:underline">417-831-9000</a>
                    <p className="text-xs text-muted-foreground">Springfield area mental health services</p>
                  </div>
                  <div>
                    <span className="font-medium">Compass Health:</span>
                    <br />
                    <a href="tel:4176735333" className="text-sage hover:underline">417-673-5333</a>
                    <p className="text-xs text-muted-foreground">Crisis services and mental health support</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-secondary mb-3">Statewide Missouri</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Missouri Crisis Line:</span>
                    <br />
                    <a href="tel:18882799376" className="text-sage hover:underline">1-888-279-8369</a>
                    <p className="text-xs text-muted-foreground">24/7 crisis support statewide</p>
                  </div>
                  <div>
                    <span className="font-medium">211 Missouri:</span>
                    <br />
                    <a href="tel:211" className="text-sage hover:underline">Dial 211</a>
                    <p className="text-xs text-muted-foreground">Connect with local resources and services</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* When to Seek Help */}
        <Card className="mb-8 bg-sage/5 border-sage/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-sage" />
              When to Reach Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You don&apos;t have to wait until things feel unbearable. Reach out for support if you&apos;re experiencing:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span>Persistent feelings of sadness or hopelessness</span>
                </div>
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span>Overwhelming anxiety or panic</span>
                </div>
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span>Thoughts of self-harm or suicide</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span>Difficulty coping with daily activities</span>
                </div>
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span>Substance use concerns</span>
                </div>
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span>Relationship or family problems</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Self-Care Resources */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-dusty-rose" />
              Self-Care & Wellness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Taking care of your mental health is just as important as your physical health. Here are some resources:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-secondary mb-2">Mental Health Apps</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Headspace (meditation)</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Calm (sleep & relaxation)</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Youper (mood tracking)</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-secondary mb-2">Online Resources</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Mental Health America</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>NAMI (National Alliance)</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Psychology Today</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/help">
              Platform Help
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Crisis Resources - CARE Collective',
  description: 'Crisis support resources, hotlines, and community mental health services'
};