'use client';

import { ReactElement } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, Calendar } from 'lucide-react';

interface CMSDashboardProps {
  adminUserId: string;
}

export function CMSDashboard({ adminUserId }: CMSDashboardProps): ReactElement {
  const sections = [
    {
      title: 'Community Updates',
      description: 'Manage community stats and updates displayed on the home page',
      icon: TrendingUp,
      href: '/admin/cms/community-updates',
      color: 'text-sage',
    },
    {
      title: 'Site Content',
      description: 'Edit mission, about, and other site sections (Coming soon)',
      icon: FileText,
      href: '#',
      color: 'text-terracotta',
      disabled: true,
    },
    {
      title: 'Calendar Events',
      description: 'Manage community events and calendar (Coming soon)',
      icon: Calendar,
      href: '#',
      color: 'text-dusty-rose',
      disabled: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Content Management System</h2>
        <p className="text-muted-foreground">
          Manage your website content, community updates, and events
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.title}
              className={section.disabled ? 'opacity-60' : ''}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg bg-background ${section.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {section.disabled ? (
                  <Button disabled variant="outline" className="w-full min-h-[44px]">
                    Coming Soon
                  </Button>
                ) : (
                  <Link href={section.href}>
                    <Button variant="sage" className="w-full min-h-[44px]">
                      Manage
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            • Use <strong>Community Updates</strong> to showcase important stats and milestones
          </p>
          <p>
            • Remember to <strong>publish</strong> your changes to make them visible on the live
            site
          </p>
          <p>• Draft content is only visible to administrators until published</p>
        </CardContent>
      </Card>
    </div>
  );
}
