/**
 * @fileoverview Caregiving situation editor component
 * Allows users to describe their caregiving context
 */

'use client';

import { ReactElement, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Loader2, Pencil, X, Heart } from 'lucide-react';

interface CaregivingSituationEditorProps {
  userId: string;
  initialValue: string | null;
}

const MAX_LENGTH = 500;
const PLACEHOLDER = "Share your caregiving context (e.g., 'Caring for aging parent with mobility challenges')";

export function CaregivingSituationEditor({
  userId,
  initialValue
}: CaregivingSituationEditorProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue || '');
  const [savedValue, setSavedValue] = useState(initialValue || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (value.length > MAX_LENGTH) {
      setError(`Maximum ${MAX_LENGTH} characters allowed`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ caregiving_situation: value || null })
        .eq('id', userId);

      if (updateError) throw updateError;

      setSavedValue(value);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [userId, value]);

  const handleCancel = useCallback(() => {
    setValue(savedValue);
    setIsEditing(false);
    setError(null);
  }, [savedValue]);

  const charactersRemaining = MAX_LENGTH - value.length;
  const isOverLimit = charactersRemaining < 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Heart className="w-4 h-4" />
          Caregiving Situation
        </div>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 px-2"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={PLACEHOLDER}
            className={cn(
              'w-full min-h-[100px] p-3 text-sm rounded-lg border bg-background',
              'focus:outline-none focus:ring-2 focus:ring-primary',
              'resize-none',
              isOverLimit && 'border-destructive focus:ring-destructive'
            )}
            disabled={isSaving}
            aria-label="Caregiving situation"
          />

          {/* Character count */}
          <div className={cn(
            'text-xs text-right',
            isOverLimit ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {charactersRemaining} characters remaining
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isOverLimit}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-secondary">
          {savedValue ? (
            <p className="text-sm whitespace-pre-wrap">{savedValue}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Not set - click edit to add your caregiving context
            </p>
          )}
        </div>
      )}
    </div>
  );
}
