CREATE TABLE IF NOT EXISTS messages_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations_v2(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
