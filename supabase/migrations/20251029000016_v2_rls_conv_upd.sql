CREATE POLICY "Participants can update conversation status" ON conversations_v2
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = helper_id);
