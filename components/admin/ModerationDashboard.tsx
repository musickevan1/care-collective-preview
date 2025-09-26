/**
 * @fileoverview Admin Moderation Dashboard Component
 * Comprehensive moderation interface for messaging system management
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { ReactElement } from 'react';
import { createClient } from '@/lib/supabase/client';
import { moderationService } from '@/lib/messaging/moderation';
import { privacyEventTracker } from '@/lib/security/privacy-event-tracker';
import { errorTracker } from '@/lib/error-tracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  UserX,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Flag,
  Calendar,
  TrendingUp,
  Activity,
  Settings,
  Download,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface ModerationStats {
  total_reports: number;
  pending_reports: number;
  resolved_today: number;
  active_restrictions: number;
  messages_flagged_today: number;
  average_resolution_time: number;
}

interface ModerationQueueItem {
  id: string;
  message: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    sender: {
      id: string;
      name: string;
      location?: string;
    };
    conversation_id: string;
  };
  report: {
    reason: string;
    description?: string;
    created_at: string;
  };
  reporter: {
    id: string;
    name: string;
  };
  context: {
    conversation_id: string;
    help_request_title?: string;
  };
}

interface UserRestriction {
  id: string;
  user_id: string;
  user_name: string;
  restriction_level: 'limited' | 'suspended' | 'banned';
  reason: string;
  created_at: string;
  expires_at?: string;
  applied_by_name?: string;
}

interface ModerationDashboardProps {
  adminUserId: string;
  className?: string;
}

/**
 * Admin Moderation Dashboard - Comprehensive messaging moderation interface
 */
export function ModerationDashboard({
  adminUserId,
  className
}: ModerationDashboardProps): ReactElement {
  const [stats, setStats] = useState<ModerationStats>({
    total_reports: 0,
    pending_reports: 0,
    resolved_today: 0,
    active_restrictions: 0,
    messages_flagged_today: 0,
    average_resolution_time: 0
  });

  const [queueItems, setQueueItems] = useState<ModerationQueueItem[]>([]);
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([]);
  const [loading, setLoading] = useState({
    stats: true,
    queue: true,
    restrictions: true
  });

  const [processingItem, setProcessingItem] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('queue');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const supabase = createClient();

  // Load moderation statistics
  const loadStats = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));

      // Get report counts
      const { data: reportStats } = await supabase
        .from('message_reports')
        .select('status, created_at');

      const totalReports = reportStats?.length || 0;
      const pendingReports = reportStats?.filter(r => r.status === 'pending').length || 0;
      const today = new Date().toDateString();
      const resolvedToday = reportStats?.filter(r =>
        r.status === 'action_taken' &&
        new Date(r.created_at).toDateString() === today
      ).length || 0;

      // Get active restrictions
      const { data: activeRestrictions } = await supabase
        .from('user_restrictions')
        .select('id')
        .neq('restriction_level', 'none')
        .or('expires_at.is.null,expires_at.gt.now()');

      // Get flagged messages today
      const { data: flaggedMessages } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('is_flagged', true)
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

      setStats({
        total_reports: totalReports,
        pending_reports: pendingReports,
        resolved_today: resolvedToday,
        active_restrictions: activeRestrictions?.length || 0,
        messages_flagged_today: flaggedMessages?.length || 0,
        average_resolution_time: 2.5 // Hours - would calculate from actual data
      });

    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'ModerationDashboard',
        action: 'load_stats',
        severity: 'medium'
      });
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, [supabase]);

  // Load moderation queue
  const loadQueue = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, queue: true }));

      const queueData = await moderationService.getModerationQueue(50);
      setQueueItems(queueData);

    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'ModerationDashboard',
        action: 'load_queue',
        severity: 'medium'
      });
    } finally {
      setLoading(prev => ({ ...prev, queue: false }));
    }
  }, []);

  // Load user restrictions
  const loadRestrictions = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, restrictions: true }));

      const { data: restrictionData, error } = await supabase
        .from('user_restrictions')
        .select(`
          id,
          user_id,
          restriction_level,
          reason,
          created_at,
          expires_at,
          profiles!user_id (
            name
          ),
          applied_by_profile:profiles!applied_by (
            name
          )
        `)
        .neq('restriction_level', 'none')
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedRestrictions: UserRestriction[] = (restrictionData || []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        user_name: r.profiles?.name || 'Unknown User',
        restriction_level: r.restriction_level,
        reason: r.reason,
        created_at: r.created_at,
        expires_at: r.expires_at,
        applied_by_name: r.applied_by_profile?.name
      }));

      setRestrictions(formattedRestrictions);

    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'ModerationDashboard',
        action: 'load_restrictions',
        severity: 'medium'
      });
    } finally {
      setLoading(prev => ({ ...prev, restrictions: false }));
    }
  }, [supabase]);

  // Process moderation queue item
  const processQueueItem = useCallback(async (
    reportId: string,
    action: 'dismiss' | 'hide_message' | 'warn_user' | 'restrict_user' | 'ban_user',
    notes?: string
  ) => {
    try {
      setProcessingItem(reportId);

      await moderationService.processModerationItem(
        reportId,
        action,
        adminUserId,
        notes
      );

      // Track moderation action
      await privacyEventTracker.trackPrivacyEvent({
        event_type: 'MODERATION_ACTION_TAKEN',
        user_id: adminUserId,
        severity: action === 'ban_user' ? 'high' : action === 'restrict_user' ? 'medium' : 'low',
        description: `Admin processed moderation report with action: ${action}`,
        metadata: {
          report_id: reportId,
          action,
          notes
        }
      });

      // Refresh data
      await Promise.all([loadStats(), loadQueue(), loadRestrictions()]);

    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'ModerationDashboard',
        action: 'process_queue_item',
        severity: 'high',
        tags: { report_id: reportId, action }
      });
    } finally {
      setProcessingItem(null);
    }
  }, [adminUserId, loadStats, loadQueue, loadRestrictions]);

  // Apply user restriction
  const applyRestriction = useCallback(async (
    userId: string,
    action: 'warn' | 'limit' | 'suspend' | 'ban',
    reason: string,
    duration?: string
  ) => {
    try {
      await moderationService.applyModerationAction(
        userId,
        action,
        reason,
        duration,
        adminUserId
      );

      // Track restriction action
      await privacyEventTracker.trackPrivacyEvent({
        event_type: 'USER_RESTRICTION_APPLIED',
        user_id: adminUserId,
        affected_user_id: userId,
        severity: action === 'ban' ? 'high' : action === 'suspend' ? 'medium' : 'low',
        description: `Admin applied ${action} restriction to user`,
        metadata: {
          action,
          reason,
          duration
        }
      });

      await loadRestrictions();

    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'ModerationDashboard',
        action: 'apply_restriction',
        severity: 'high'
      });
    }
  }, [adminUserId, loadRestrictions]);

  // Initial data load
  useEffect(() => {
    loadStats();
    loadQueue();
    loadRestrictions();
  }, [loadStats, loadQueue, loadRestrictions]);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      loadStats();
      loadQueue();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loadStats, loadQueue]);

  // Filter queue items
  const filteredQueueItems = queueItems.filter(item => {
    const matchesSearch = !searchTerm ||
      item.message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.report.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'urgent' && ['harassment', 'scam'].includes(item.report.reason)) ||
      (filterStatus === 'recent' && new Date(item.report.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Moderation Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage community messaging safety
          </p>
        </div>
        <Button onClick={() => {
          loadStats();
          loadQueue();
          loadRestrictions();
        }} disabled={loading.stats || loading.queue || loading.restrictions}>
          <RefreshCw className={cn("w-4 h-4 mr-2", (loading.stats || loading.queue || loading.restrictions) && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Pending Reports</p>
                <p className="text-2xl font-bold text-orange-700">{stats.pending_reports}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Reports</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total_reports}</p>
              </div>
              <Flag className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Resolved Today</p>
                <p className="text-2xl font-bold text-green-700">{stats.resolved_today}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Active Restrictions</p>
                <p className="text-2xl font-bold text-red-700">{stats.active_restrictions}</p>
              </div>
              <UserX className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Messages Flagged</p>
                <p className="text-2xl font-bold text-purple-700">{stats.messages_flagged_today}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Resolution</p>
                <p className="text-2xl font-bold text-gray-700">{stats.average_resolution_time}h</p>
              </div>
              <Clock className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue">
            <Flag className="w-4 h-4 mr-2" />
            Moderation Queue ({stats.pending_reports})
          </TabsTrigger>
          <TabsTrigger value="restrictions">
            <Shield className="w-4 h-4 mr-2" />
            User Restrictions ({stats.active_restrictions})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Moderation Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Queue Items */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredQueueItems.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">No pending moderation reports</p>
                  </CardContent>
                </Card>
              ) : (
                filteredQueueItems.map((item) => (
                  <ModerationQueueItemCard
                    key={item.id}
                    item={item}
                    onProcess={processQueueItem}
                    isProcessing={processingItem === item.id}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* User Restrictions Tab */}
        <TabsContent value="restrictions" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {restrictions.map((restriction) => (
                <UserRestrictionCard
                  key={restriction.id}
                  restriction={restriction}
                  onUpdate={loadRestrictions}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Moderation Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                <p>Analytics dashboard coming soon</p>
                <p className="text-sm">Track trends, patterns, and system performance</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Individual moderation queue item card
 */
interface ModerationQueueItemCardProps {
  item: ModerationQueueItem;
  onProcess: (reportId: string, action: 'dismiss' | 'hide_message' | 'warn_user' | 'restrict_user' | 'ban_user', notes?: string) => void;
  isProcessing: boolean;
}

function ModerationQueueItemCard({
  item,
  onProcess,
  isProcessing
}: ModerationQueueItemCardProps): ReactElement {
  const [notes, setNotes] = useState('');
  const [showActions, setShowActions] = useState(false);

  const getReasonColor = (reason: string): string => {
    switch (reason) {
      case 'harassment':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'scam':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'spam':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'inappropriate':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Badge className={getReasonColor(item.report.reason)}>
                {item.report.reason}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Reported {new Date(item.report.created_at).toLocaleString()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
            >
              {showActions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          {/* Message Content */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{item.message.sender.name}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(item.message.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm">{item.message.content}</p>
          </div>

          {/* Report Details */}
          <div className="text-sm">
            <p className="mb-1">
              <strong>Reported by:</strong> {item.reporter.name}
            </p>
            {item.report.description && (
              <p>
                <strong>Details:</strong> {item.report.description}
              </p>
            )}
            {item.context.help_request_title && (
              <p>
                <strong>Help Request:</strong> {item.context.help_request_title}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="space-y-3 pt-2 border-t">
              <Textarea
                placeholder="Add notes (optional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onProcess(item.id, 'dismiss', notes)}
                  disabled={isProcessing}
                >
                  Dismiss
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onProcess(item.id, 'hide_message', notes)}
                  disabled={isProcessing}
                >
                  Hide Message
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onProcess(item.id, 'warn_user', notes)}
                  disabled={isProcessing}
                >
                  Warn User
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onProcess(item.id, 'restrict_user', notes)}
                  disabled={isProcessing}
                >
                  Restrict User
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onProcess(item.id, 'ban_user', notes)}
                  disabled={isProcessing}
                >
                  Ban User
                </Button>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Processing...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * User restriction card
 */
interface UserRestrictionCardProps {
  restriction: UserRestriction;
  onUpdate: () => void;
}

function UserRestrictionCard({
  restriction,
  onUpdate
}: UserRestrictionCardProps): ReactElement {
  const getRestrictionColor = (level: string): string => {
    switch (level) {
      case 'limited':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'suspended':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'banned':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const isExpiring = restriction.expires_at &&
    new Date(restriction.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <Card className={cn(
      "border-l-4",
      restriction.restriction_level === 'banned' ? 'border-l-red-500' :
      restriction.restriction_level === 'suspended' ? 'border-l-orange-500' :
      'border-l-yellow-500'
    )}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-medium">{restriction.user_name}</h4>
                <Badge className={getRestrictionColor(restriction.restriction_level)}>
                  {restriction.restriction_level}
                </Badge>
                {isExpiring && (
                  <Badge variant="outline" className="text-orange-600">
                    Expiring Soon
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Reason:</strong> {restriction.reason}
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <Calendar className="w-3 h-3 inline mr-1" />
              Applied: {new Date(restriction.created_at).toLocaleString()}
              {restriction.applied_by_name && ` by ${restriction.applied_by_name}`}
            </p>
            {restriction.expires_at && (
              <p>
                <Clock className="w-3 h-3 inline mr-1" />
                Expires: {new Date(restriction.expires_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}