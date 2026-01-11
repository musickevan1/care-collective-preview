CREATE POLICY "Participants can view messages in their conversations" ON messages_v2
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations_v2
      WHERE id = conversation_id
      AND (auth.uid() = requester_id OR auth.uid() = helper_id)
    )
  );
