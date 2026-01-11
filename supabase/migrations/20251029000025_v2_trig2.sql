DROP TRIGGER IF EXISTS messages_v2_updated_at ON messages_v2;
CREATE TRIGGER messages_v2_updated_at BEFORE UPDATE ON messages_v2 FOR EACH ROW EXECUTE FUNCTION update_messages_v2_updated_at();
