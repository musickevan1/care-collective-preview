-- Fix infinite recursion in conversation_participants RLS policy
-- The original policy queried conversation_participants FROM WITHIN itself,
-- causing "infinite recursion detected in policy" error
-- Root cause of React Error #419 on /requests/[id] pages

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view conversation participants for their conversations"
  ON conversation_participants;

-- Create fixed policy without recursion
-- Simplified: Users can only view themselves or participants in conversations they created
CREATE POLICY "Users can view conversation participants for their conversations"
  ON conversation_participants
  FOR SELECT USING (
    -- User can always see themselves as a participant
    user_id = auth.uid()
    OR
    -- User can see other participants in conversations they created
    conversation_id IN (
      SELECT id FROM conversations
      WHERE created_by = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view conversation participants for their conversations"
  ON conversation_participants IS
  'Fixed recursion: Users can view participants in their conversations';
