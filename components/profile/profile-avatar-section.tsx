/**
 * @fileoverview Client-side wrapper for profile avatar section
 * Handles state management for avatar changes
 */

'use client';

import { ReactElement, useState } from 'react';
import { AvatarPicker } from './avatar-picker';

interface ProfileAvatarSectionProps {
  userId: string;
  userName: string;
  initialAvatarUrl: string | null;
}

export function ProfileAvatarSection({
  userId,
  userName,
  initialAvatarUrl
}: ProfileAvatarSectionProps): ReactElement {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);

  return (
    <div className="flex flex-col items-center pb-4 border-b mb-4">
      <AvatarPicker
        userId={userId}
        currentAvatarUrl={avatarUrl}
        userName={userName}
        onAvatarChange={setAvatarUrl}
      />
      <p className="text-sm text-muted-foreground mt-2">
        Click to change profile picture
      </p>
    </div>
  );
}
