'use client';

import { useState, useEffect, useCallback, ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/lib/database.types';
import { format } from 'date-fns';

type CalendarEvent = Tables<'calendar_events'> & {
  event_categories?: { id: string; name: string; slug: string; color: string } | null;
};
type EventCategory = Tables<'event_categories'>;

interface CalendarEventsManagerProps {
  adminUserId: string;
}

export function CalendarEventsManager({ adminUserId }: CalendarEventsManagerProps): ReactElement {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category_id: string;
    start_date: string;
    end_date: string;
    all_day: boolean;
    location: string;
    location_type: 'in_person' | 'virtual' | 'hybrid';
    virtual_link: string;
    registration_required: boolean;
    registration_link: string;
    max_attendees: number | null;
    status: 'draft' | 'published';
  }>({
    title: '',
    description: '',
    category_id: '',
    start_date: '',
    end_date: '',
    all_day: false,
    location: '',
    location_type: 'in_person',
    virtual_link: '',
    registration_required: false,
    registration_link: '',
    max_attendees: null,
    status: 'draft',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [eventsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/cms/calendar-events'),
        fetch('/api/admin/cms/calendar-events/categories'),
      ]);

      if (!eventsRes.ok || !categoriesRes.ok) throw new Error('Failed to load data');

      const [eventsData, categoriesData] = await Promise.all([
        eventsRes.json(),
        categoriesRes.json(),
      ]);

      setEvents(eventsData.events || []);
      setCategories(categoriesData.categories || []);
    } catch (err) {
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category_id: '',
      start_date: '',
      end_date: '',
      all_day: false,
      location: '',
      location_type: 'in_person',
      virtual_link: '',
      registration_required: false,
      registration_link: '',
      max_attendees: null,
      status: 'draft',
    });
    setEditingId(null);
    setShowForm(false);
    setFieldErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';

    // Conditional virtual_link requirement
    if (
      (formData.location_type === 'virtual' || formData.location_type === 'hybrid') &&
      !formData.virtual_link.trim()
    ) {
      newErrors.virtual_link = 'Virtual link is required for virtual/hybrid events';
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      const url = editingId
        ? `/api/admin/cms/calendar-events/${editingId}`
        : '/api/admin/cms/calendar-events';

      // Convert datetime-local format to ISO 8601 with timezone
      const formatDateForAPI = (dateStr: string) => {
        if (!dateStr) return dateStr;
        // datetime-local gives us "2025-12-15T10:00", need "2025-12-15T10:00:00.000Z"
        return dateStr.includes('Z') ? dateStr : `${dateStr}:00.000Z`;
      };

      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          start_date: formatDateForAPI(formData.start_date),
          end_date: formatDateForAPI(formData.end_date),
          category_id: formData.category_id || null,
          max_attendees: formData.max_attendees || null,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save event');
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event: CalendarEvent) => {
    // Ensure location_type is a valid value
    const locationType = event.location_type as 'in_person' | 'virtual' | 'hybrid' | null;
    const validLocationType = locationType && ['in_person', 'virtual', 'hybrid'].includes(locationType)
      ? locationType
      : 'in_person';

    setFormData({
      title: event.title,
      description: event.description || '',
      category_id: event.category_id || '',
      start_date: event.start_date?.slice(0, 16) || '',
      end_date: event.end_date?.slice(0, 16) || '',
      all_day: event.all_day ?? false,
      location: event.location || '',
      location_type: validLocationType,
      virtual_link: event.virtual_link || '',
      registration_required: event.registration_required ?? false,
      registration_link: event.registration_link || '',
      max_attendees: event.max_attendees,
      status: (event.status === 'published' ? 'published' : 'draft'),
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handlePublish = async (id: string) => {
    try {
      setError('');
      const response = await fetch(`/api/admin/cms/calendar-events/${id}/publish`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to publish event');

      await loadData();
    } catch (err) {
      setError('Failed to publish event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this event?')) return;

    try {
      setError('');
      const response = await fetch(`/api/admin/cms/calendar-events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');

      await loadData();
    } catch (err) {
      setError('Failed to delete event');
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filterStatus !== 'all' && event.status !== filterStatus) return false;
    if (filterCategory !== 'all' && event.category_id !== filterCategory) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'outline';
      case 'cancelled':
        return 'secondary';
      case 'archived':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-lg">{error}</div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Calendar Events ({filteredEvents.length})</CardTitle>
              <CardDescription>Manage events displayed on the calendar</CardDescription>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant="sage"
              className="min-h-[44px]"
            >
              {showForm ? 'Hide Form' : '+ New Event'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg min-h-[44px]"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg min-h-[44px]"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {showForm && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl">{editingId ? 'Edit' : 'Create'} Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Event Title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="min-h-[44px]"
                />
                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg min-h-[44px]"
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date/Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date/Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg min-h-[44px]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="all_day"
                    checked={formData.all_day}
                    onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label htmlFor="all_day" className="text-sm font-medium">
                    All Day Event
                  </label>
                </div>
                <select
                  value={formData.location_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location_type: e.target.value as 'in_person' | 'virtual' | 'hybrid',
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg min-h-[44px]"
                >
                  <option value="in_person">In Person</option>
                  <option value="virtual">Virtual</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                {formData.location_type !== 'virtual' && (
                  <Input
                    placeholder="Location Address"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="min-h-[44px]"
                  />
                )}
                {(formData.location_type === 'virtual' || formData.location_type === 'hybrid') && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-secondary">
                      Virtual Link <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="https://zoom.us/j/... or meeting link"
                      value={formData.virtual_link}
                      onChange={(e) => {
                        setFormData({ ...formData, virtual_link: e.target.value });
                        if (fieldErrors.virtual_link) {
                          setFieldErrors({ ...fieldErrors, virtual_link: '' });
                        }
                      }}
                      className={`min-h-[44px] ${fieldErrors.virtual_link ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {fieldErrors.virtual_link && (
                      <p className="text-sm text-red-600">{fieldErrors.virtual_link}</p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="registration_required"
                    checked={formData.registration_required}
                    onChange={(e) =>
                      setFormData({ ...formData, registration_required: e.target.checked })
                    }
                    className="w-5 h-5"
                  />
                  <label htmlFor="registration_required" className="text-sm font-medium">
                    Registration Required
                  </label>
                </div>
                {formData.registration_required && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      placeholder="Registration Link"
                      value={formData.registration_link}
                      onChange={(e) =>
                        setFormData({ ...formData, registration_link: e.target.value })
                      }
                      className="min-h-[44px]"
                    />
                    <Input
                      type="number"
                      placeholder="Max Attendees (optional)"
                      value={formData.max_attendees || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_attendees: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="min-h-[44px]"
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={handleCreateOrUpdate}
                    variant="sage"
                    disabled={saving}
                    className="min-h-[44px]"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                  </Button>
                  {showForm && (
                    <Button onClick={resetForm} variant="outline" className="min-h-[44px]">
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <p className="text-muted-foreground">Loading events...</p>
          ) : filteredEvents.length === 0 ? (
            <p className="text-muted-foreground">No events found. Create one above!</p>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <div key={event.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium">{event.title}</h3>
                        <Badge variant={getStatusBadge(event.status)}>{event.status}</Badge>
                        {event.event_categories && (
                          <Badge
                            style={{ backgroundColor: event.event_categories.color }}
                            className="text-white"
                          >
                            {event.event_categories.name}
                          </Badge>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.start_date && format(new Date(event.start_date), 'MMM d, yyyy h:mm a')} →{' '}
                        {event.end_date && format(new Date(event.end_date), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => handleEdit(event)}
                        variant="outline"
                        size="sm"
                        className="min-h-[44px]"
                      >
                        Edit
                      </Button>
                      {event.status === 'draft' && (
                        <Button
                          onClick={() => handlePublish(event.id)}
                          variant="terracotta"
                          size="sm"
                          className="min-h-[44px]"
                        >
                          Publish
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDelete(event.id)}
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
