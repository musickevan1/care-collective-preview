/**
 * @fileoverview Avatar picker component for profile customization
 * Allows selecting default avatars or uploading custom images
 */

'use client';

import { ReactElement, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_AVATARS, type DefaultAvatar } from '@/lib/avatars/defaults';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Camera, Check, Loader2, Upload, X } from 'lucide-react';

interface AvatarPickerProps {
  userId: string;
  currentAvatarUrl: string | null;
  userName: string;
  onAvatarChange: (newUrl: string | null) => void;
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function AvatarPicker({
  userId,
  currentAvatarUrl,
  userName,
  onAvatarChange
}: AvatarPickerProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get initials for fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Resize image on canvas before upload
  const resizeImage = useCallback((file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Target size: 200x200
        const size = 200;
        canvas.width = size;
        canvas.height = size;

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate crop to center
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          0.85
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Handle custom file upload
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please select a JPEG, PNG, WebP, or GIF image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be smaller than 1MB');
      return;
    }

    setIsUploading(true);

    try {
      // Resize image
      const resizedBlob = await resizeImage(file);

      // Upload to Supabase Storage
      const supabase = createClient();
      const filePath = `${userId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, resizedBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-busting query param
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBust })
        .eq('id', userId);

      if (updateError) throw updateError;

      setSelectedAvatar(urlWithCacheBust);
      onAvatarChange(urlWithCacheBust);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [userId, resizeImage, onAvatarChange]);

  // Handle default avatar selection
  const handleSelectDefault = useCallback(async (avatar: DefaultAvatar) => {
    setError(null);
    setIsUploading(true);

    try {
      const supabase = createClient();

      // Update profile with default avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatar.url })
        .eq('id', userId);

      if (updateError) throw updateError;

      setSelectedAvatar(avatar.url);
      onAvatarChange(avatar.url);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update avatar');
    } finally {
      setIsUploading(false);
    }
  }, [userId, onAvatarChange]);

  // Check if URL is a default avatar
  const isDefaultAvatar = (url: string | null): boolean => {
    if (!url) return false;
    return DEFAULT_AVATARS.some(a => a.url === url);
  };

  return (
    <div className="relative">
      {/* Current Avatar with Edit Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative group cursor-pointer"
        aria-label="Change profile picture"
      >
        <div className="w-24 h-24 rounded-full overflow-hidden bg-dusty-rose flex items-center justify-center">
          {selectedAvatar ? (
            <Image
              src={selectedAvatar}
              alt={`${userName}'s avatar`}
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-2xl font-semibold text-white">
              {getInitials(userName)}
            </span>
          )}
        </div>

        {/* Edit overlay */}
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
        </div>
      </button>

      {/* Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Choose Profile Picture</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded-full"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                  {error}
                </div>
              )}

              {/* Upload Custom */}
              <div>
                <h3 className="text-sm font-medium mb-2">Upload Custom Image</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className={cn(
                    'flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer',
                    'hover:border-primary hover:bg-primary/5 transition-colors',
                    isUploading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  <span className="text-sm">
                    {isUploading ? 'Uploading...' : 'Click to upload (max 1MB)'}
                  </span>
                </label>
              </div>

              {/* Default Avatars */}
              <div>
                <h3 className="text-sm font-medium mb-2">Or Choose a Default</h3>
                <div className="grid grid-cols-4 gap-3">
                  {DEFAULT_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => handleSelectDefault(avatar)}
                      disabled={isUploading}
                      className={cn(
                        'relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all',
                        'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary',
                        selectedAvatar === avatar.url
                          ? 'border-primary ring-2 ring-primary'
                          : 'border-transparent hover:border-muted-foreground/30'
                      )}
                      aria-label={avatar.label}
                      title={avatar.description}
                    >
                      <Image
                        src={avatar.url}
                        alt={avatar.label}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                      {selectedAvatar === avatar.url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
