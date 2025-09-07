/**
 * @fileoverview Message input component with sending functionality
 * Accessible message composition with character limits and send controls
 */

'use client';

import { ReactElement, useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = \"Type your message...\",
  maxLength = 1000,
  className
}: MessageInputProps): ReactElement {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const characterCount = message.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;
  const canSend = !disabled && !sending && message.trim().length > 0 && !isOverLimit;

  const handleSend = async () => {
    if (!canSend) return;

    const content = message.trim();
    if (!content) return;

    setSending(true);
    setError(null);

    try {
      await onSendMessage(content);
      setMessage('');
      
      // Focus back to textarea for continued typing
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        // Send message with Enter
        e.preventDefault();
        handleSend();
      }
    }
  };

  const handleTextareaChange = (value: string) => {
    setMessage(value);
    setError(null); // Clear error when user starts typing
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className={cn(\"space-y-3\", className)}>
      {/* Error Alert */}
      {error && (
        <Alert variant=\"destructive\" className=\"py-2\">
          <AlertCircle className=\"w-4 h-4\" />
          <AlertDescription className=\"text-sm\">{error}</AlertDescription>
        </Alert>
      )}

      {/* Input Area */}
      <div className=\"relative\">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => handleTextareaChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          className={cn(
            \"min-h-[44px] max-h-[120px] resize-none pr-16 text-sm\",
            \"border-gray-200 focus:border-sage focus:ring-sage\",
            \"placeholder:text-gray-400\",
            isOverLimit && \"border-red-300 focus:border-red-500 focus:ring-red-500\"
          )}
          style={{
            minHeight: '44px', // Ensure minimum touch target
            maxHeight: '120px'
          }}
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size=\"sm\"
          className={cn(
            \"absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full\",
            \"bg-sage hover:bg-sage-dark focus:bg-sage-dark\",
            \"disabled:bg-gray-300 disabled:cursor-not-allowed\",
            \"transition-all duration-200\"
          )}
          aria-label=\"Send message\"
        >
          {sending ? (
            <Loader2 className=\"w-4 h-4 animate-spin\" />
          ) : (
            <Send className={cn(
              \"w-4 h-4\",
              canSend ? \"text-white\" : \"text-gray-500\"
            )} />
          )}
        </Button>
      </div>

      {/* Character Count & Hints */}
      <div className=\"flex items-center justify-between text-xs\">
        <div className=\"text-muted-foreground\">
          <kbd className=\"px-1.5 py-0.5 bg-gray-100 border rounded text-xs\">
            Enter
          </kbd>
          {' '}to send, {' '}
          <kbd className=\"px-1.5 py-0.5 bg-gray-100 border rounded text-xs\">
            Shift+Enter
          </kbd>
          {' '}for new line
        </div>
        
        {(isNearLimit || isOverLimit) && (
          <div className={cn(
            \"font-medium\",
            isOverLimit ? \"text-red-600\" : \"text-yellow-600\"
          )}>
            {characterCount}/{maxLength}
          </div>
        )}
      </div>

      {/* Over Limit Warning */}
      {isOverLimit && (
        <Alert variant=\"destructive\" className=\"py-2\">
          <AlertCircle className=\"w-4 h-4\" />
          <AlertDescription className=\"text-sm\">
            Message is too long. Please shorten it by {characterCount - maxLength} characters.
          </AlertDescription>
        </Alert>
      )}

      {/* Community Guidelines Reminder */}
      <div className=\"text-xs text-muted-foreground\">
        💡 Keep conversations respectful and helpful. Need urgent help?{' '}
        <button 
          className=\"text-sage hover:underline font-medium\"
          onClick={() => window.open('/help/emergency', '_blank')}
        >
          View emergency resources
        </button>
      </div>
    </div>
  );
}