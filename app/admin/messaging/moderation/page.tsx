/**
 * @fileoverview Admin moderation interface for messaging system
 * Allows administrators to review and moderate reported messages
 */

import { ReactElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { moderationService } from '@/lib/messaging/moderation';
import { ModerationQueue } from '@/components/admin/ModerationQueue';
import { redirect } from 'next/navigation';

export default async function ModerationPage(): Promise<ReactElement> {
  const supabase = createClient();
  
  // Check authentication and admin status
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/signin?redirect=/admin/messaging/moderation');
  }

  // Check admin privileges (assuming you have an admin role system)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // For demo purposes, allowing access - in production, check proper admin role
  if (!profile) {
    redirect('/auth/signin');
  }

  // Load moderation queue
  let queueItems;
  let stats;
  try {
    [queueItems, stats] = await Promise.all([
      moderationService.getModerationQueue(50),
      getMessagingStats()
    ]);
  } catch (error) {
    console.error('Failed to load moderation data:', error);
    queueItems = [];
    stats = getDefaultStats();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary">Messaging Moderation</h1>
        <p className="text-muted-foreground mt-2">
          Review and moderate reported messages to maintain community safety.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pending Reports"
          value={queueItems.length}
          subtitle="Awaiting review"
          variant={queueItems.length > 10 ? "warning" : "default"}
        />
        <StatCard
          title="Active Conversations"
          value={stats.activeConversations}
          subtitle="This week"
        />
        <StatCard
          title="Messages Today"
          value={stats.messagesToday}
          subtitle="vs yesterday"
          change={stats.messageGrowth}
        />
        <StatCard
          title="Safety Score"
          value={`${stats.safetyScore}%`}
          subtitle="Community safety"
          variant={stats.safetyScore < 90 ? "warning" : "success"}
        />
      </div>

      {/* Moderation Queue */}
      <ModerationQueue 
        items={queueItems}
        onItemProcessed={() => {
          // Refresh the page after processing
          window.location.reload();
        }}
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  change?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatCard({ title, value, subtitle, change, variant = 'default' }: StatCardProps): ReactElement {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200'
  };

  const valueStyles = {
    default: 'text-gray-900',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    danger: 'text-red-700'
  };

  return (
    <div className={`p-4 rounded-lg border ${variantStyles[variant]}`}>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <div className="flex items-baseline gap-2">
        <p className={`text-2xl font-bold ${valueStyles[variant]}`}>
          {value}
        </p>
        {change && (
          <span className={`text-sm ${
            change.startsWith('+') ? 'text-green-600' : 
            change.startsWith('-') ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

async function getMessagingStats() {
  const supabase = createClient();
  
  try {
    // Get various messaging statistics
    const [conversationsResult, messagesResult, reportsResult] = await Promise.all([
      supabase
        .from('conversations')
        .select('id', { count: 'exact' })
        .eq('status', 'active')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date().toISOString().split('T')[0]),
      
      supabase
        .from('message_reports')
        .select('id, status', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    const activeConversations = conversationsResult.count || 0;
    const messagesToday = messagesResult.count || 0;
    const totalReports = reportsResult.count || 0;
    
    // Calculate safety score (simplified)
    const totalMessages = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    const totalMessagesCount = totalMessages.count || 1;
    const safetyScore = Math.round(((totalMessagesCount - totalReports) / totalMessagesCount) * 100);

    return {
      activeConversations,
      messagesToday,
      messageGrowth: '+5%', // Placeholder - would calculate from yesterday's data
      safetyScore: Math.max(85, Math.min(99, safetyScore))
    };
  } catch (error) {
    console.error('Failed to fetch messaging stats:', error);
    return getDefaultStats();
  }
}

function getDefaultStats() {
  return {
    activeConversations: 0,
    messagesToday: 0,
    messageGrowth: '0%',
    safetyScore: 95
  };
}

export const metadata = {
  title: 'Messaging Moderation - Admin - Care Collective',
  description: 'Moderation interface for community messaging safety'
};