-- Phase 1B Fix: Sync messages_v2 to messages table
-- CRITICAL: Fixes real-time message delivery (writes go to messages_v2, subscriptions listen to messages)
--
-- Strategy: Create trigger to sync messages_v2 → messages (Option A)
-- This maintains backward compatibility while we complete migration to single schema

BEGIN;

-- Step 1: Create sync function
CREATE OR REPLACE FUNCTION sync_messages_v2_to_messages()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation RECORD;
  v_recipient_id uuid;
BEGIN
  -- Get conversation details to determine recipient
  SELECT requester_id, helper_id
  INTO v_conversation
  FROM conversations_v2
  WHERE id = NEW.conversation_id;

  -- If conversation not found, skip sync (shouldn't happen but defensive)
  IF NOT FOUND THEN
    RAISE WARNING 'Conversation % not found for message %, skipping sync', NEW.conversation_id, NEW.id;
    RETURN NEW;
  END IF;

  -- Determine recipient (opposite of sender)
  IF NEW.sender_id = v_conversation.requester_id THEN
    v_recipient_id := v_conversation.helper_id;
  ELSE
    v_recipient_id := v_conversation.requester_id;
  END IF;

  -- Insert into messages table (V1) - use INSERT ... ON CONFLICT to handle re-runs
  INSERT INTO messages (
    id,
    conversation_id,
    sender_id,
    recipient_id,
    content,
    message_type,
    status,
    moderation_status,
    is_flagged,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.conversation_id,
    NEW.sender_id,
    v_recipient_id,
    NEW.content,
    'text', -- Default message type for V2 messages
    'sent', -- Default status
    'approved', -- Auto-approve V2 messages (moderation happens before insert)
    false, -- Not flagged by default
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Update if message already exists (idempotent)
    content = EXCLUDED.content,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

-- Step 2: Create trigger on messages_v2
DROP TRIGGER IF EXISTS sync_messages_v2_insert ON messages_v2;

CREATE TRIGGER sync_messages_v2_insert
  AFTER INSERT ON messages_v2
  FOR EACH ROW
  EXECUTE FUNCTION sync_messages_v2_to_messages();

-- Step 3: Backfill existing messages_v2 data into messages table
-- This ensures any messages created before trigger was added are also synced
DO $$
DECLARE
  v_count integer := 0;
  v_message RECORD;
  v_conversation RECORD;
  v_recipient_id uuid;
BEGIN
  RAISE NOTICE 'Starting backfill of messages_v2 to messages...';

  FOR v_message IN
    SELECT * FROM messages_v2
    WHERE NOT EXISTS (
      SELECT 1 FROM messages WHERE messages.id = messages_v2.id
    )
    ORDER BY created_at
  LOOP
    -- Get conversation details
    SELECT requester_id, helper_id
    INTO v_conversation
    FROM conversations_v2
    WHERE id = v_message.conversation_id;

    -- Skip if conversation not found
    CONTINUE WHEN NOT FOUND;

    -- Determine recipient
    IF v_message.sender_id = v_conversation.requester_id THEN
      v_recipient_id := v_conversation.helper_id;
    ELSE
      v_recipient_id := v_conversation.requester_id;
    END IF;

    -- Insert into messages table
    INSERT INTO messages (
      id,
      conversation_id,
      sender_id,
      recipient_id,
      content,
      message_type,
      status,
      moderation_status,
      is_flagged,
      created_at,
      updated_at
    ) VALUES (
      v_message.id,
      v_message.conversation_id,
      v_message.sender_id,
      v_recipient_id,
      v_message.content,
      'text',
      'sent',
      'approved',
      false,
      v_message.created_at,
      v_message.updated_at
    )
    ON CONFLICT (id) DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % messages synced from messages_v2 to messages', v_count;
END $$;

-- Step 4: Add helpful comment
COMMENT ON FUNCTION sync_messages_v2_to_messages() IS 'Phase 1B: Syncs messages from messages_v2 to messages table for backward compatibility. Ensures real-time subscriptions (listening to messages) receive updates written to messages_v2. TODO: Remove after full migration to single schema in Phase 2.';

COMMENT ON TRIGGER sync_messages_v2_insert ON messages_v2 IS
  'Phase 1B: Auto-sync trigger for backward compatibility. Remove after schema consolidation.';

COMMIT;
