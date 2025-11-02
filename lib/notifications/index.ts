/**
 * Notification System - Public API
 * Phase 2: In-App Notifications
 */

export { NotificationService } from './NotificationService';
export type {
  NotificationType,
  Notification,
  NotificationInsert,
  CreateNotificationParams,
  NotificationListOptions,
  NotificationListResult,
} from './NotificationService';

export {
  notifyNewMessage,
  notifyHelpRequestOffer,
  notifyHelpRequestAccepted,
  notifyHelpRequestCompleted,
  notifyHelpRequestCancelled,
  notifySystemAnnouncement,
  notifyAllUsersSystemAnnouncement,
} from './triggers';
