CREATE TABLE IF NOT EXISTS conversations_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  help_request_id uuid NOT NULL REFERENCES help_requests(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id),
  helper_id uuid NOT NULL REFERENCES auth.users(id),
  initial_message text NOT NULL CHECK (length(initial_message) >= 10 AND length(initial_message) <= 1000),
  status conversation_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_participants CHECK (requester_id != helper_id),
  CONSTRAINT unique_help_request_helper UNIQUE (help_request_id, helper_id)
);
