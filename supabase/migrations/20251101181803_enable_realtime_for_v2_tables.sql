-- Enable realtime for messages_v2 and conversations_v2 tables
-- This allows WebSocket subscriptions to receive live updates

-- Enable realtime for messages_v2
ALTER PUBLICATION supabase_realtime ADD TABLE messages_v2;

-- Enable realtime for conversations_v2  
ALTER PUBLICATION supabase_realtime ADD TABLE conversations_v2;

-- Verify the tables are now published (for migration verification)
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables
-- WHERE pubname = 'supabase_realtime'
--   AND tablename IN ('messages_v2', 'conversations_v2')
-- ORDER BY tablename;
