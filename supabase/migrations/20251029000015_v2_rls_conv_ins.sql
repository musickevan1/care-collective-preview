CREATE POLICY "Users can create conversations for help requests" ON conversations_v2
  FOR INSERT WITH CHECK (
    auth.uid() = helper_id AND
    EXISTS (
      SELECT 1 FROM help_requests
      WHERE id = help_request_id
      AND status IN ('open', 'in_progress')
    )
  );
