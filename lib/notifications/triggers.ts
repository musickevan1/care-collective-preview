/**
 * Notification Triggers
 * Helper functions to create notifications for various events
 * Part of Care Collective Notification System Phase 2
 */

import { NotificationService } from './NotificationService';
import type { NotificationType } from './NotificationService';

/**
 * Create a notification for a new message
 */
export async function notifyNewMessage(params: {
  recipientId: string;
  senderId: string;
  senderName: string;
  conversationId: string;
  messagePreview: string;
}): Promise<void> {
  const { recipientId, senderName, conversationId, messagePreview } = params;

  // Truncate preview to 100 chars
  const preview =
    messagePreview.length > 100
      ? messagePreview.substring(0, 100) + '...'
      : messagePreview;

  await NotificationService.createNotification({
    userId: recipientId,
    type: 'new_message',
    title: `New message from ${senderName}`,
    content: preview,
    relatedId: conversationId,
    relatedType: 'conversation',
    actionUrl: `/messages?conversation=${conversationId}`,
  });
}

/**
 * Create a notification when someone offers help on a request
 */
export async function notifyHelpRequestOffer(params: {
  requesterId: string;
  helperId: string;
  helperName: string;
  requestId: string;
  requestTitle: string;
}): Promise<void> {
  const { requesterId, helperName, requestId, requestTitle } = params;

  await NotificationService.createNotification({
    userId: requesterId,
    type: 'help_request_offer',
    title: `${helperName} wants to help! 🙌`,
    content: `${helperName} has offered to help with "${requestTitle}". You can now message them to coordinate assistance. Click to view your messages and get started.`,
    relatedId: requestId,
    relatedType: 'help_request',
    actionUrl: `/messages?help_request=${requestId}`,
  });
}

/**
 * Create a notification when a help offer is accepted
 */
export async function notifyHelpRequestAccepted(params: {
  helperId: string;
  requesterId: string;
  requesterName: string;
  requestId: string;
  requestTitle: string;
}): Promise<void> {
  const { helperId, requesterName, requestId, requestTitle } = params;

  await NotificationService.createNotification({
    userId: helperId,
    type: 'help_request_accepted',
    title: `${requesterName} accepted your help offer`,
    content: `You're now helping with: ${requestTitle}`,
    relatedId: requestId,
    relatedType: 'help_request',
    actionUrl: `/requests/${requestId}`,
  });
}

/**
 * Create notifications when a help request is completed
 */
export async function notifyHelpRequestCompleted(params: {
  requesterId: string;
  helperId: string;
  requestId: string;
  requestTitle: string;
  completedBy: 'requester' | 'helper';
}): Promise<void> {
  const { requesterId, helperId, requestId, requestTitle, completedBy } = params;

  // Notify the helper if requester marked it complete
  if (completedBy === 'requester') {
    await NotificationService.createNotification({
      userId: helperId,
      type: 'help_request_completed',
      title: 'Help request completed',
      content: `Request "${requestTitle}" has been marked as completed`,
      relatedId: requestId,
      relatedType: 'help_request',
      actionUrl: `/requests/${requestId}`,
    });
  }

  // Notify the requester if helper marked it complete
  if (completedBy === 'helper') {
    await NotificationService.createNotification({
      userId: requesterId,
      type: 'help_request_completed',
      title: 'Help request completed',
      content: `Your helper has completed: ${requestTitle}`,
      relatedId: requestId,
      relatedType: 'help_request',
      actionUrl: `/requests/${requestId}`,
    });
  }
}

/**
 * Create notifications when a help request is cancelled
 */
export async function notifyHelpRequestCancelled(params: {
  requesterId: string;
  helperId?: string;
  requestId: string;
  requestTitle: string;
  cancelReason?: string;
  cancelledBy: 'requester' | 'helper';
}): Promise<void> {
  const { requesterId, helperId, requestId, requestTitle, cancelReason, cancelledBy } =
    params;

  // If cancelled by requester and there's a helper, notify the helper
  if (cancelledBy === 'requester' && helperId) {
    await NotificationService.createNotification({
      userId: helperId,
      type: 'help_request_cancelled',
      title: 'Help request cancelled',
      content: cancelReason
        ? `Request "${requestTitle}" was cancelled: ${cancelReason}`
        : `Request "${requestTitle}" was cancelled`,
      relatedId: requestId,
      relatedType: 'help_request',
      actionUrl: `/requests/${requestId}`,
    });
  }

  // If cancelled by helper, notify the requester
  if (cancelledBy === 'helper' && helperId) {
    await NotificationService.createNotification({
      userId: requesterId,
      type: 'help_request_cancelled',
      title: 'Help offer cancelled',
      content: cancelReason
        ? `The helper cancelled for: ${requestTitle}. ${cancelReason}`
        : `The helper cancelled their offer for: ${requestTitle}`,
      relatedId: requestId,
      relatedType: 'help_request',
      actionUrl: `/requests/${requestId}`,
    });
  }
}

/**
 * Create a system announcement notification for a user
 */
export async function notifySystemAnnouncement(params: {
  userId: string;
  title: string;
  content: string;
  actionUrl?: string;
}): Promise<void> {
  const { userId, title, content, actionUrl } = params;

  await NotificationService.createNotification({
    userId,
    type: 'system_announcement',
    title,
    content,
    actionUrl: actionUrl || '/dashboard',
  });
}

/**
 * Create a system announcement for all users (admin function)
 * Note: This should be rate-limited and restricted to admins only
 */
export async function notifyAllUsersSystemAnnouncement(params: {
  title: string;
  content: string;
  actionUrl?: string;
  userIds: string[]; // Provide list of user IDs to notify
}): Promise<void> {
  const { title, content, actionUrl, userIds } = params;

  // Create notifications in parallel (but be careful with large user bases)
  const promises = userIds.map((userId) =>
    NotificationService.createNotification({
      userId,
      type: 'system_announcement',
      title,
      content,
      actionUrl: actionUrl || '/dashboard',
    })
  );

  await Promise.all(promises);
}
