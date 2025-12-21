-- Supabase Schema for Multiplayer Sessions and Messages
-- Run this in your Supabase SQL Editor to create the necessary tables

-- Multiplayer Sessions table
CREATE TABLE IF NOT EXISTS multiplayer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  title TEXT,
  participant_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Multiplayer Messages table
CREATE TABLE IF NOT EXISTS multiplayer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'question', 'answer', 'system', 'emoji', 'image', 'game')),
  question_number INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  image_data TEXT,
  image_url TEXT,
  image_type TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_multiplayer_sessions_session_id ON multiplayer_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_sessions_is_active ON multiplayer_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_multiplayer_sessions_last_activity ON multiplayer_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_multiplayer_messages_session_id ON multiplayer_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_messages_timestamp ON multiplayer_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_multiplayer_messages_sender ON multiplayer_messages(sender);

-- Enable Row Level Security
ALTER TABLE multiplayer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_messages ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, customize based on your needs)
CREATE POLICY "Allow all operations on multiplayer_sessions" ON multiplayer_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on multiplayer_messages" ON multiplayer_messages FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_multiplayer_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_multiplayer_sessions_updated_at 
  BEFORE UPDATE ON multiplayer_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_multiplayer_session_updated_at();

