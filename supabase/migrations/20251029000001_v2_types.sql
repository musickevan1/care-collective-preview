DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_status') THEN
    CREATE TYPE conversation_status AS ENUM ('pending', 'active', 'accepted', 'rejected', 'closed');
  END IF;
END $$;
