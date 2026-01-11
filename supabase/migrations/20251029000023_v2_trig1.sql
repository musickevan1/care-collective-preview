DROP TRIGGER IF EXISTS conversations_v2_updated_at ON conversations_v2;
CREATE TRIGGER conversations_v2_updated_at BEFORE UPDATE ON conversations_v2 FOR EACH ROW EXECUTE FUNCTION update_conversations_v2_updated_at();
