'use client';

import { useState, useEffect, useCallback, ReactElement } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/lib/database.types';

type CommunityUpdate = Tables<'community_updates'>;

interface CommunityUpdatesManagerProps {
  adminUserId: string;
}

export function CommunityUpdatesManager({ adminUserId }: CommunityUpdatesManagerProps): ReactElement {
  const [updates, setUpdates] = useState<CommunityUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Users',
    highlight_value: '',
    display_order: 0,
    status: 'draft' as const,
  });

  const supabase = createClient();

  const loadUpdates = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/admin/cms/community-updates');

      if (!response.ok) throw new Error('Failed to load updates');

      const result = await response.json();
      setUpdates(result.updates || []);
    } catch (err) {
      console.error('[CMS] Error loading updates:', err);
      setError('Failed to load community updates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch('/api/admin/cms/community-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to create update');
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        icon: 'Users',
        highlight_value: '',
        display_order: 0,
        status: 'draft',
      });

      // Reload updates
      await loadUpdates();
    } catch (err) {
      console.error('[CMS] Error creating update:', err);
      setError(err instanceof Error ? err.message : 'Failed to create update');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      setError('');
      const response = await fetch(`/api/admin/cms/community-updates/${id}/publish`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to publish update');

      await loadUpdates();
    } catch (err) {
      console.error('[CMS] Error publishing update:', err);
      setError('Failed to publish update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this update?')) return;

    try {
      setError('');
      const response = await fetch(`/api/admin/cms/community-updates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete update');

      await loadUpdates();
    } catch (err) {
      console.error('[CMS] Error deleting update:', err);
      setError('Failed to delete update');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'archived':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create Community Update</CardTitle>
          <CardDescription>Add a new stat or update to display on the home page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title *
            </label>
            <Input
              id="title"
              placeholder="e.g., Active Members"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="highlight" className="block text-sm font-medium mb-1">
              Highlight Value
            </label>
            <Input
              id="highlight"
              placeholder="e.g., 150+ members"
              value={formData.highlight_value || ''}
              onChange={(e) => setFormData({ ...formData, highlight_value: e.target.value })}
              className="min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Additional details..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[88px]"
            />
          </div>

          <Button
            onClick={handleCreate}
            variant="sage"
            disabled={saving || !formData.title.trim()}
            className="min-h-[44px]"
          >
            {saving ? 'Creating...' : 'Create Update'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Community Updates ({updates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading updates...</p>
          ) : updates.length === 0 ? (
            <p className="text-muted-foreground">No community updates yet. Create one above!</p>
          ) : (
            <div className="space-y-3">
              {updates.map((update) => (
                <div key={update.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{update.title}</h3>
                        <Badge variant={getStatusBadgeVariant(update.status)}>
                          {update.status}
                        </Badge>
                      </div>
                      {update.highlight_value && (
                        <p className="text-sm font-semibold text-primary mb-1">
                          {update.highlight_value}
                        </p>
                      )}
                      {update.description && (
                        <p className="text-sm text-muted-foreground">{update.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {update.status === 'draft' && (
                        <Button
                          onClick={() => handlePublish(update.id)}
                          variant="terracotta"
                          size="sm"
                          className="min-h-[44px]"
                        >
                          Publish
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDelete(update.id)}
                        variant="destructive"
                        size="sm"
                        className="min-h-[44px]"
                      >
                        Archive
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
