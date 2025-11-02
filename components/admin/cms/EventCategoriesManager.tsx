'use client';

import { useState, useEffect, useCallback, ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/lib/database.types';

type EventCategory = Tables<'event_categories'>;

interface EventCategoriesManagerProps {
  adminUserId: string;
}

const PRESET_COLORS = [
  { name: 'Sage', value: '#7A9E99' },
  { name: 'Terracotta', value: '#BC6547' },
  { name: 'Rose', value: '#D8A8A0' },
  { name: 'Navy', value: '#324158' },
  { name: 'Tan', value: '#C39778' },
  { name: 'Purple', value: '#8B7AA8' },
];

export function EventCategoriesManager({ adminUserId }: EventCategoriesManagerProps): ReactElement {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#7A9E99',
    icon: '',
    display_order: 0,
    is_active: true,
  });

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/admin/cms/calendar-events/categories');

      if (!response.ok) throw new Error('Failed to load categories');

      const result = await response.json();
      setCategories(result.categories || []);
    } catch (err) {
      console.error('[CMS Categories] Error loading:', err);
      setError('Failed to load event categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#7A9E99',
      icon: '',
      display_order: 0,
      is_active: true,
    });
    setEditingId(null);
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      setError('Name and slug are required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const url = editingId
        ? `/api/admin/cms/calendar-events/categories/${editingId}`
        : '/api/admin/cms/calendar-events/categories';

      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save category');
      }

      resetForm();
      await loadCategories();
    } catch (err) {
      console.error('[CMS Categories] Error saving:', err);
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: EventCategory) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color,
      icon: category.icon || '',
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setEditingId(category.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this category?')) return;

    try {
      setError('');
      const response = await fetch(`/api/admin/cms/calendar-events/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete category');

      await loadCategories();
    } catch (err) {
      console.error('[CMS Categories] Error deleting:', err);
      setError('Failed to delete category');
    }
  };

  const autoSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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
          <CardTitle>{editingId ? 'Edit' : 'Create'} Event Category</CardTitle>
          <CardDescription>
            {editingId ? 'Update an existing category' : 'Add a new event category'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name *
              </label>
              <Input
                id="name"
                placeholder="e.g., Community Events"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    slug: formData.slug || autoSlug(name),
                  });
                }}
                className="min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium mb-1">
                Slug *
              </label>
              <Input
                id="slug"
                placeholder="community-events"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Brief description of this category"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[44px]"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: preset.value })}
                    className="w-10 h-10 rounded-full border-2 transition-all min-h-[44px] min-w-[44px]"
                    style={{
                      backgroundColor: preset.value,
                      borderColor: formData.color === preset.value ? '#000' : preset.value,
                    }}
                    title={preset.name}
                    aria-label={`Select ${preset.name} color`}
                  />
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="icon" className="block text-sm font-medium mb-1">
                Icon (optional)
              </label>
              <Input
                id="icon"
                placeholder="Calendar"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="display_order" className="block text-sm font-medium mb-1">
                Display Order
              </label>
              <Input
                id="display_order"
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                }
                className="min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCreateOrUpdate}
              variant="sage"
              disabled={saving || !formData.name.trim() || !formData.slug.trim()}
              className="min-h-[44px]"
            >
              {saving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
            </Button>
            {editingId && (
              <Button onClick={resetForm} variant="outline" className="min-h-[44px]">
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground">No categories yet. Create one above!</p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <h3 className="font-medium">{category.name}</h3>
                        <code className="text-sm text-muted-foreground">{category.slug}</code>
                        {!category.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Order: {category.display_order}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(category)}
                        variant="outline"
                        size="sm"
                        className="min-h-[44px]"
                      >
                        Edit
                      </Button>
                      {category.is_active && (
                        <Button
                          onClick={() => handleDelete(category.id)}
                          variant="destructive"
                          size="sm"
                          className="min-h-[44px]"
                        >
                          Deactivate
                        </Button>
                      )}
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
