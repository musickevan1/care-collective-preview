CREATE POLICY "Participants can send messages in their conversations" ON messages_v2
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations_v2
      WHERE id = conversation_id
      AND status = 'active'
      AND (auth.uid() = requester_id OR auth.uid() = helper_id)
    )
  );
