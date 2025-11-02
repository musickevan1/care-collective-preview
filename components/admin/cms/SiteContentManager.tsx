'use client';

import { useState, useEffect, useCallback, ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/lib/database.types';

type SiteContent = Tables<'site_content'>;

interface SiteContentManagerProps {
  adminUserId: string;
}

const SECTIONS = [
  {
    key: 'mission',
    name: 'Mission & Values',
    description: 'Edit the mission statement and core values',
  },
  {
    key: 'about',
    name: 'About / Story',
    description: 'Edit the about section and story',
  },
  {
    key: 'events_updates',
    name: 'Events & Updates',
    description: 'Edit the events and updates section',
  },
] as const;

export function SiteContentManager({ adminUserId }: SiteContentManagerProps): ReactElement {
  const [sections, setSections] = useState<Record<string, SiteContent>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('mission');
  const [formData, setFormData] = useState<Record<string, any>>({});

  const loadSections = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/admin/cms/site-content');

      if (!response.ok) throw new Error('Failed to load site content');

      const result = await response.json();
      const sectionsMap: Record<string, SiteContent> = {};

      (result.sections || []).forEach((section: SiteContent) => {
        sectionsMap[section.section_key] = section;
      });

      setSections(sectionsMap);

      // Initialize form data with current content
      const initialFormData: Record<string, any> = {};
      SECTIONS.forEach((section) => {
        const content = sectionsMap[section.key]?.content || {};
        initialFormData[section.key] = content;
      });
      setFormData(initialFormData);
    } catch (err) {
      console.error('[CMS Site Content] Error loading:', err);
      setError('Failed to load site content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const handleSave = async (sectionKey: string) => {
    try {
      setSaving(true);
      setError('');

      const response = await fetch('/api/admin/cms/site-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: sectionKey,
          content: formData[sectionKey],
          status: 'draft',
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save content');
      }

      await loadSections();
    } catch (err) {
      console.error('[CMS Site Content] Error saving:', err);
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (sectionKey: string) => {
    try {
      setError('');
      const response = await fetch(`/api/admin/cms/site-content/${sectionKey}/publish`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to publish content');

      await loadSections();
    } catch (err) {
      console.error('[CMS Site Content] Error publishing:', err);
      setError('Failed to publish content');
    }
  };

  const updateField = (sectionKey: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value,
      },
    }));
  };

  const activeSection = SECTIONS.find((s) => s.key === activeTab);
  const activeContent = sections[activeTab];
  const activeFormData = formData[activeTab] || {};

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-lg">{error}</div>
      )}

      <div className="flex gap-2 border-b overflow-x-auto">
        {SECTIONS.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveTab(section.key)}
            className={`px-4 py-3 min-h-[44px] font-medium whitespace-nowrap transition-colors ${
              activeTab === section.key
                ? 'border-b-2 border-sage text-sage'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {section.name}
            {sections[section.key] && (
              <Badge variant={sections[section.key].status === 'published' ? 'default' : 'outline'} className="ml-2">
                {sections[section.key].status}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading content...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit {activeSection?.name}</CardTitle>
              <CardDescription>{activeSection?.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="heading" className="block text-sm font-medium mb-1">
                  Heading
                </label>
                <Input
                  id="heading"
                  placeholder="Section heading"
                  value={activeFormData.heading || ''}
                  onChange={(e) => updateField(activeTab, 'heading', e.target.value)}
                  className="min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="body" className="block text-sm font-medium mb-1">
                  Body Text
                </label>
                <Textarea
                  id="body"
                  placeholder="Main content"
                  value={activeFormData.body || ''}
                  onChange={(e) => updateField(activeTab, 'body', e.target.value)}
                  rows={6}
                />
              </div>

              {activeTab === 'mission' && (
                <div>
                  <label htmlFor="values" className="block text-sm font-medium mb-1">
                    Core Values (comma-separated)
                  </label>
                  <Input
                    id="values"
                    placeholder="Community, Support, Empowerment"
                    value={(activeFormData.values || []).join(', ')}
                    onChange={(e) =>
                      updateField(
                        activeTab,
                        'values',
                        e.target.value.split(',').map((v) => v.trim())
                      )
                    }
                    className="min-h-[44px]"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => handleSave(activeTab)}
                  variant="sage"
                  disabled={saving}
                  className="min-h-[44px]"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                {activeContent && activeContent.status === 'draft' && (
                  <Button
                    onClick={() => handlePublish(activeTab)}
                    variant="terracotta"
                    className="min-h-[44px]"
                  >
                    Publish
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Current draft version</CardDescription>
            </CardHeader>
            <CardContent>
              {activeFormData.heading && (
                <h2 className="text-2xl font-bold mb-3">{activeFormData.heading}</h2>
              )}
              {activeFormData.body && (
                <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                  {activeFormData.body}
                </p>
              )}
              {activeTab === 'mission' && activeFormData.values?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Core Values:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {activeFormData.values.map((value: string, idx: number) => (
                      <li key={idx} className="text-muted-foreground">
                        {value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!activeFormData.heading && !activeFormData.body && (
                <p className="text-muted-foreground italic">No content yet. Start editing!</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
