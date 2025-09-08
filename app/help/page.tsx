/**
 * @fileoverview Help and support page for Care Collective users
 * Provides community support resources, platform help, and contact information
 */

import { ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  HelpCircle, 
  MessageCircle, 
  Users, 
  Heart, 
  Shield, 
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Home,
  Search,
  Plus
} from 'lucide-react';

export default function HelpPage(): ReactElement {
  const breadcrumbs = [
    { label: 'Help & Support', href: '/help' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-sage" />
          </div>
          <h1 className="text-3xl font-bold text-secondary mb-2">
            Help & Support
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're here to help you connect with your community and provide mutual aid safely and effectively.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-sage" />
                </div>
                <h3 className="font-semibold text-secondary mb-2">Browse Help Requests</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Find ways to help your community members
                </p>
                <Button asChild className="w-full">
                  <Link href="/requests">
                    Browse Requests
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-dusty-rose/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-dusty-rose" />
                </div>
                <h3 className="font-semibold text-secondary mb-2">Request Help</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask your community for assistance
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/requests/new">
                    Create Request
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-secondary mb-2">Messages</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with community members
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/messages">
                    View Messages
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Platform Help */}
          <div>
            <h2 className="text-xl font-semibold text-secondary mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-sage" />
              Platform Help
            </h2>
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-secondary mb-2">Getting Started</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    New to Care Collective? Learn how to create your first help request or offer assistance.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Creating Your Profile</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Posting Help Requests</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Offering Help</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-secondary mb-2">Messaging System</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Learn how to communicate safely with community members.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Starting Conversations</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Privacy Settings</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Reporting Issues</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Community Guidelines & Safety */}
          <div>
            <h2 className="text-xl font-semibold text-secondary mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-dusty-rose" />
              Safety & Guidelines
            </h2>
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-secondary mb-2">Community Guidelines</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Our shared principles for creating a safe, supportive community.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                      <span>Treat everyone with kindness and respect</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-dusty-rose mt-0.5 flex-shrink-0" />
                      <span>Prioritize safety in all interactions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Build authentic community connections</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-secondary mb-2">Safety Tips</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Best practices for safe mutual aid interactions.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Meeting in Public Places</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Sharing Personal Information</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Trust and Verification</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5 text-sage" />
              Contact Our Support Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                Can't find what you're looking for? Our community support team is here to help.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Mail className="w-8 h-8 text-sage mx-auto mb-2" />
                <h3 className="font-medium text-secondary mb-1">Email Support</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get help via email within 24 hours
                </p>
                <Button variant="outline" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Us
                </Button>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Phone className="w-8 h-8 text-dusty-rose mx-auto mb-2" />
                <h3 className="font-medium text-secondary mb-1">Phone Support</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Speak with a team member directly
                </p>
                <Button variant="outline" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Us
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Crisis Resources Link */}
        <Card className="mt-6 bg-sage/5 border-sage/20">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-sage" />
              </div>
              <h3 className="text-lg font-semibold text-secondary mb-2">
                Need Immediate Support?
              </h3>
              <p className="text-muted-foreground mb-4">
                If you're in crisis or need immediate assistance, we have resources to help.
              </p>
              <Button asChild>
                <Link href="/resources" className="inline-flex items-center">
                  Crisis Resources
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Back */}
        <div className="text-center mt-8">
          <Button asChild variant="outline">
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
  title: 'Help & Support - Care Collective',
  description: 'Get help using the Care Collective platform and find community support resources'
};