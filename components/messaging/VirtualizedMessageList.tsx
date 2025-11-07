/**
 * @fileoverview VirtualizedMessageList Component
 * Efficient rendering of large message lists with threading support
 */

'use client'

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { ReactElement } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { MessageBubble } from './MessageBubble';
import { MessageWithSender } from '@/lib/messaging/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, CornerDownRight, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface VirtualizedMessageListProps {
  messages: MessageWithSender[];
  currentUserId: string;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onMessageReply?: (messageId: string) => void;
  onThreadOpen?: (threadId: string) => void;
  className?: string;
  showDateSeparators?: boolean;
  enableVirtualization?: boolean;
  itemHeight?: number;
  height?: number;
}

interface MessageGroup {
  date?: string;
  messages: MessageWithSender[];
  threads: Array<{
    parentId: string;
    replies: MessageWithSender[];
  }>;
}

interface MessageItemData {
  groups: MessageGroup[];
  currentUserId: string;
  onMessageReply?: (messageId: string) => void;
  onThreadOpen?: (threadId: string) => void;
  showDateSeparators?: boolean;
}

// Default message item height (in pixels)
const DEFAULT_ITEM_HEIGHT = 80;
const THREAD_REPLY_HEIGHT = 60;
const DATE_SEPARATOR_HEIGHT = 40;

/**
 * Individual message item renderer for virtualization
 */
function MessageItem({ index, style, data }: ListChildComponentProps<MessageItemData>): ReactElement {
  const { groups, currentUserId, onMessageReply, onThreadOpen, showDateSeparators } = data;

  // Calculate which group and message this index refers to
  let currentIndex = 0;
  let targetGroup: MessageGroup | null = null;
  let targetMessage: MessageWithSender | null = null;
  let isDateSeparator = false;
  let isThreadReply = false;
  let threadParentId: string | null = null;

  for (const group of groups) {
    // Date separator
    if (showDateSeparators && group.date) {
      if (currentIndex === index) {
        isDateSeparator = true;
        targetGroup = group;
        break;
      }
      currentIndex++;
    }

    // Main messages in group
    for (const message of group.messages) {
      if (currentIndex === index) {
        targetGroup = group;
        targetMessage = message;
        break;
      }
      currentIndex++;

      // Thread replies
      const messageThread = group.threads.find(t => t.parentId === message.id);
      if (messageThread) {
        for (const reply of messageThread.replies) {
          if (currentIndex === index) {
            targetGroup = group;
            targetMessage = reply;
            isThreadReply = true;
            threadParentId = message.id;
            break;
          }
          currentIndex++;
        }
      }

      if (targetMessage) break;
    }

    if (targetMessage || isDateSeparator) break;
  }

  if (isDateSeparator && targetGroup?.date) {
    return (
      <div style={style} className="flex justify-center">
        <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
          {format(new Date(targetGroup.date), 'MMM d, yyyy')}
        </div>
      </div>
    );
  }

  if (!targetMessage) {
    return <div style={style} />; // Empty fallback
  }

  const isCurrentUser = targetMessage.sender_id === currentUserId;

  return (
    <div style={style} className={cn("px-4", isThreadReply && "pl-12")}>
      {isThreadReply && (
        <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
          <CornerDownRight className="w-3 h-3" />
          <span>Reply</span>
        </div>
      )}

      <MessageBubble
        message={targetMessage}
        isCurrentUser={isCurrentUser}
        showSenderName={!isCurrentUser}
        onReply={onMessageReply ? () => onMessageReply(targetMessage.id) : undefined}
        onThreadOpen={targetMessage.thread_id && onThreadOpen
          ? () => onThreadOpen(targetMessage.thread_id!)
          : undefined
        }
        showThreadIndicator={!!targetMessage.thread_id}
      />
    </div>
  );
}

/**
 * Group messages by date and organize threads
 */
function groupMessagesByDate(messages: MessageWithSender[], showDateSeparators: boolean): MessageGroup[] {
  const groups: MessageGroup[] = [];
  const messagesByDate = new Map<string, MessageWithSender[]>();
  const threadReplies = new Map<string, MessageWithSender[]>();

  // Separate main messages and thread replies
  const mainMessages: MessageWithSender[] = [];

  for (const message of messages) {
    if (message.parent_message_id) {
      // This is a thread reply
      const parentId = message.parent_message_id;
      if (!threadReplies.has(parentId)) {
        threadReplies.set(parentId, []);
      }
      threadReplies.get(parentId)!.push(message);
    } else {
      // This is a main message
      mainMessages.push(message);
    }
  }

  // Group main messages by date
  if (showDateSeparators) {
    for (const message of mainMessages) {
      const dateKey = new Date(message.created_at).toDateString();
      if (!messagesByDate.has(dateKey)) {
        messagesByDate.set(dateKey, []);
      }
      messagesByDate.get(dateKey)!.push(message);
    }

    // Create groups with date separators
    for (const [dateKey, dateMessages] of messagesByDate.entries()) {
      const threads = dateMessages.map(msg => ({
        parentId: msg.id,
        replies: threadReplies.get(msg.id) || []
      })).filter(thread => thread.replies.length > 0);

      groups.push({
        date: dateKey,
        messages: dateMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        threads
      });
    }

    groups.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
  } else {
    // Single group without date separation
    const sortedMessages = mainMessages.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const threads = sortedMessages.map(msg => ({
      parentId: msg.id,
      replies: threadReplies.get(msg.id) || []
    })).filter(thread => thread.replies.length > 0);

    groups.push({
      messages: sortedMessages,
      threads
    });
  }

  return groups;
}

/**
 * Calculate total item count including date separators and thread replies
 */
function calculateItemCount(groups: MessageGroup[], showDateSeparators: boolean): number {
  let count = 0;

  for (const group of groups) {
    // Date separator
    if (showDateSeparators && group.date) {
      count++;
    }

    // Main messages
    count += group.messages.length;

    // Thread replies
    for (const thread of group.threads) {
      count += thread.replies.length;
    }
  }

  return count;
}

/**
 * VirtualizedMessageList - High-performance message list with threading and date grouping
 *
 * Efficiently renders large conversation histories using react-window virtualization.
 * Supports message threading, date separators, and automatic scroll management.
 * Falls back to regular scrolling for smaller message lists.
 *
 * @param props.messages - Array of messages to display with sender information
 * @param props.currentUserId - Current user's ID for message alignment and permissions
 * @param props.isLoading - Loading state for pagination spinner
 * @param props.hasMore - Whether more messages can be loaded
 * @param props.onLoadMore - Callback for loading additional messages
 * @param props.onMessageReply - Callback when user replies to a message
 * @param props.onThreadOpen - Callback when user opens a message thread
 * @param props.className - Additional CSS classes
 * @param props.showDateSeparators - Whether to show date separators between message groups
 * @param props.enableVirtualization - Force enable/disable virtualization (auto-detected by default)
 * @param props.itemHeight - Height of each message item in pixels (default: 80)
 * @param props.height - Container height in pixels (default: 400)
 * @returns Virtualized message list component with optimized rendering
 *
 * @example
 * ```typescript
 * <VirtualizedMessageList
 *   messages={conversationMessages}
 *   currentUserId="user123"
 *   isLoading={loadingMore}
 *   hasMore={canLoadMore}
 *   onLoadMore={() => loadMoreMessages()}
 *   onMessageReply={(messageId) => openReplyDialog(messageId)}
 *   onThreadOpen={(threadId) => openThread(threadId)}
 *   showDateSeparators={true}
 *   height={600}
 * />
 * ```
 */
export function VirtualizedMessageList({
  messages,
  currentUserId,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onMessageReply,
  onThreadOpen,
  className,
  showDateSeparators = true,
  enableVirtualization = true,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  height = 400
}: VirtualizedMessageListProps): ReactElement {
  const listRef = useRef<List>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const previousMessageCount = useRef(messages.length);

  // Group messages and calculate item count
  const { groups, itemCount } = useMemo(() => {
    const messageGroups = groupMessagesByDate(messages, showDateSeparators);
    const count = calculateItemCount(messageGroups, showDateSeparators);

    return {
      groups: messageGroups,
      itemCount: count
    };
  }, [messages, showDateSeparators]);

  // Scroll to bottom when new messages arrive (if auto-scroll is enabled)
  // Only auto-scroll for NEW messages (not on initial load or navigation)
  useEffect(() => {
    const isNewMessage = messages.length > previousMessageCount.current && previousMessageCount.current > 0;

    if (isNewMessage && autoScrollEnabled && listRef.current) {
      // Use setTimeout to prevent interrupting user scroll gestures
      setTimeout(() => {
        if (listRef.current && autoScrollEnabled) {
          listRef.current.scrollToItem(itemCount - 1, 'end');
        }
      }, 100);
    }
    previousMessageCount.current = messages.length;
  }, [messages.length, itemCount, autoScrollEnabled]);

  // Handle scroll events to toggle auto-scroll and scroll-to-bottom button
  const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }: any) => {
    if (!scrollUpdateWasRequested) {
      // User initiated scroll
      const scrollHeight = itemCount * itemHeight;
      const visibleHeight = height;
      const scrollBottom = scrollOffset + visibleHeight;
      const isNearBottom = scrollBottom >= scrollHeight - 100; // 100px threshold

      setAutoScrollEnabled(isNearBottom);
      setShowScrollToBottom(!isNearBottom);
    }
  }, [itemCount, itemHeight, height]);

  // Scroll to bottom manually
  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(itemCount - 1, 'end');
      setAutoScrollEnabled(true);
      setShowScrollToBottom(false);
    }
  }, [itemCount]);

  // Load more messages when scrolling to top
  const handleItemsRendered = useCallback(({ visibleStartIndex }: any) => {
    if (visibleStartIndex === 0 && hasMore && onLoadMore && !isLoading) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore, isLoading]);

  if (messages.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center p-8", className)}>
        <div className="text-center space-y-4 max-w-md">
          <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground/50" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No messages yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Start the conversation by sending a message
            </p>
          </div>
        </div>
      </div>
    );
  }

  const itemData: MessageItemData = {
    groups,
    currentUserId,
    onMessageReply,
    onThreadOpen,
    showDateSeparators
  };

  if (!enableVirtualization || itemCount < 100) {
    // Render non-virtualized for small lists
    return (
      <div className={cn("flex-1 relative", className)}>
        <ScrollArea className="h-full">
          <div className="space-y-2 p-4">
            {groups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-2">
                {showDateSeparators && group.date && (
                  <div className="flex justify-center">
                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {format(new Date(group.date), 'MMM d, yyyy')}
                    </div>
                  </div>
                )}

                {group.messages.map((message) => (
                  <div key={message.id} className="space-y-1">
                    <MessageBubble
                      message={message}
                      isCurrentUser={message.sender_id === currentUserId}
                      showSenderName={message.sender_id !== currentUserId}
                      onReply={onMessageReply ? () => onMessageReply(message.id) : undefined}
                      onThreadOpen={message.thread_id && onThreadOpen
                        ? () => onThreadOpen(message.thread_id!)
                        : undefined
                      }
                      showThreadIndicator={!!message.thread_id}
                    />

                    {/* Thread replies */}
                    {group.threads
                      .filter(thread => thread.parentId === message.id)
                      .map(thread => (
                        <div key={`thread-${thread.parentId}`} className="pl-8 space-y-1">
                          {thread.replies.map(reply => (
                            <div key={reply.id} className="flex items-start gap-2">
                              <CornerDownRight className="w-4 h-4 text-muted-foreground mt-2 flex-shrink-0" />
                              <MessageBubble
                                message={reply}
                                isCurrentUser={reply.sender_id === currentUserId}
                                showSenderName={reply.sender_id !== currentUserId}
                                compact={true}
                              />
                            </div>
                          ))}
                        </div>
                      ))
                    }
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>

        {showScrollToBottom && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-4 right-4 rounded-full shadow-lg"
            onClick={scrollToBottom}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  // Virtualized rendering for large lists
  return (
    <div className={cn("flex-1 relative", className)}>
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2 text-center text-sm text-muted-foreground z-10">
          Loading more messages...
        </div>
      )}

      <List
        ref={listRef}
        height={height}
        itemCount={itemCount}
        itemSize={itemHeight}
        itemData={itemData}
        onScroll={handleScroll}
        onItemsRendered={handleItemsRendered}
        className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {MessageItem}
      </List>

      {showScrollToBottom && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-4 right-4 rounded-full shadow-lg"
          onClick={scrollToBottom}
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}