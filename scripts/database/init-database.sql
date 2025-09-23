-- Care Collective Database Initialization Script
-- Run this in your Supabase SQL Editor to set up the database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create help_requests table
CREATE TABLE IF NOT EXISTS help_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('groceries', 'transport', 'household', 'medical', 'other')),
  urgency TEXT CHECK (urgency IN ('normal', 'urgent', 'critical')),
  status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table (for future use)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES help_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_created_at ON help_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(recipient_id, read);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create RLS policies for help_requests
CREATE POLICY "Help requests are viewable by everyone" 
  ON help_requests FOR SELECT 
  USING (true);

CREATE POLICY "Users can create help requests" 
  ON help_requests FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own help requests" 
  ON help_requests FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own help requests" 
  ON help_requests FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages they sent or received" 
  ON messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" 
  ON messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" 
  ON messages FOR UPDATE 
  USING (auth.uid() = sender_id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.created_at
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert demo data (optional - comment out if not needed)
-- Note: These require corresponding auth.users entries to work properly
/*
INSERT INTO profiles (id, name, location, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Demo User 1', 'Springfield, MO', NOW() - INTERVAL '30 days'),
  ('22222222-2222-2222-2222-222222222222', 'Demo User 2', 'Branson, MO', NOW() - INTERVAL '15 days'),
  ('33333333-3333-3333-3333-333333333333', 'Demo User 3', 'Joplin, MO', NOW() - INTERVAL '7 days');

INSERT INTO help_requests (user_id, title, description, category, urgency, status, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Need groceries picked up', 'I am recovering from surgery and need someone to pick up groceries from Walmart.', 'groceries', 'urgent', 'open', NOW() - INTERVAL '2 days'),
  ('22222222-2222-2222-2222-222222222222', 'Help moving furniture', 'Moving to a new apartment this weekend and need help with heavy furniture.', 'household', 'normal', 'open', NOW() - INTERVAL '1 day'),
  ('33333333-3333-3333-3333-333333333333', 'Ride to medical appointment', 'Need transportation to doctor appointment on Friday at 2 PM.', 'transport', 'urgent', 'open', NOW() - INTERVAL '3 hours');
*/

-- Verify tables were created
SELECT 
  'Tables created successfully!' as message,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'help_requests', 'messages')) as table_count;