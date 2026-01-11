CREATE POLICY "Users can view conversations they participate in" ON conversations_v2
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = helper_id);
