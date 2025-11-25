/**
 * @fileoverview Profile field inline editor component
 * Allows users to edit name and location with inline editing pattern
 */

'use client';

import { ReactElement, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Loader2, Pencil, X, LucideIcon } from 'lucide-react';

interface ProfileFieldEditorProps {
  userId: string;
  field: 'name' | 'location';
  initialValue: string | null;
  label: string;
  icon: LucideIcon;
  placeholder: string;
  maxLength: number;
  required?: boolean;
}

// Validation functions matching lib/validations.ts
const validateName = (value: string): string | null => {
  if (!value.trim()) return 'Name is required';
  if (value.length > 100) return 'Name too long (max 100 characters)';
  if (!/^[a-zA-Z\s\-'\.]+$/.test(value)) {
    return 'Name can only contain letters, spaces, hyphens, apostrophes, and periods';
  }
  if (value.includes('<script')) return 'Invalid characters in name';
  return null;
};

const validateLocation = (value: string): string | null => {
  if (value.length > 200) return 'Location too long (max 200 characters)';
  if (value.includes('<script')) return 'Invalid characters in location';
  return null;
};

export function ProfileFieldEditor({
  userId,
  field,
  initialValue,
  label,
  icon: Icon,
  placeholder,
  maxLength,
  required = false
}: ProfileFieldEditorProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue || '');
  const [savedValue, setSavedValue] = useState(initialValue || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((val: string): string | null => {
    if (field === 'name') return validateName(val);
    if (field === 'location') return validateLocation(val);
    return null;
  }, [field]);

  const handleSave = useCallback(async () => {
    const trimmedValue = value.trim();

    // Validate
    const validationError = validate(trimmedValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const updateData = {
        [field]: trimmedValue || null
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) throw updateError;

      setSavedValue(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [userId, field, value, validate]);

  const handleCancel = useCallback(() => {
    setValue(savedValue);
    setIsEditing(false);
    setError(null);
  }, [savedValue]);

  const charactersRemaining = maxLength - value.length;
  const isOverLimit = charactersRemaining < 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="w-4 h-4" />
          {label}
          {required && <span className="text-destructive">*</span>}
        </div>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 px-2"
            aria-label={`Edit ${label.toLowerCase()}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'w-full px-3 py-2 text-sm rounded-lg border bg-background',
              'focus:outline-none focus:ring-2 focus:ring-primary',
              isOverLimit && 'border-destructive focus:ring-destructive'
            )}
            disabled={isSaving}
            aria-label={label}
            autoFocus
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
            <div className="text-sm text-destructive" role="alert">
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
              className="min-h-[44px]"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isOverLimit || (required && !value.trim())}
              className="min-h-[44px]"
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
            <p className="text-sm">{savedValue}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {required ? 'Not set - click edit to add' : `Not set (optional)`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
