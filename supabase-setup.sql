-- TempCloud Database Setup
-- Run these commands in your Supabase SQL Editor

-- 1. Create file_shares table
CREATE TABLE IF NOT EXISTS file_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_code TEXT UNIQUE NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT,
  file_path TEXT NOT NULL,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  uploader_ip TEXT
);

-- 2. Create stream_rooms table for live streaming
CREATE TABLE IF NOT EXISTS stream_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT UNIQUE NOT NULL,
  host_name TEXT NOT NULL,
  room_title TEXT,
  is_active BOOLEAN DEFAULT true,
  viewer_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  max_viewers INTEGER DEFAULT 0
);

-- 3. Create stream_messages table for chat
CREATE TABLE IF NOT EXISTS stream_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  FOREIGN KEY (room_id) REFERENCES stream_rooms(room_id) ON DELETE CASCADE
);

-- 4. Create stream_recordings table for saved videos
CREATE TABLE IF NOT EXISTS stream_recordings (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  file_size BIGINT NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  host_name TEXT NOT NULL,
  recording_type TEXT DEFAULT 'camera',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  views INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true
);

-- 4. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_file_shares_code ON file_shares(share_code);
CREATE INDEX IF NOT EXISTS idx_file_shares_expires ON file_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_stream_rooms_room_id ON stream_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_stream_rooms_active ON stream_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_stream_messages_room_id ON stream_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_stream_messages_created_at ON stream_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_stream_recordings_room_id ON stream_recordings(room_id);
CREATE INDEX IF NOT EXISTS idx_stream_recordings_created_at ON stream_recordings(created_at);
CREATE INDEX IF NOT EXISTS idx_stream_recordings_public ON stream_recordings(is_public);

-- 5. Set up Row Level Security (RLS)
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_recordings ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for file_shares table
-- Allow anyone to read file shares (for downloads)
DROP POLICY IF EXISTS "Anyone can read file shares" ON file_shares;
CREATE POLICY "Anyone can read file shares" ON file_shares
  FOR SELECT USING (true);

-- Allow anyone to insert file shares (for uploads)
DROP POLICY IF EXISTS "Anyone can insert file shares" ON file_shares;
CREATE POLICY "Anyone can insert file shares" ON file_shares
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update download count
DROP POLICY IF EXISTS "Anyone can update download count" ON file_shares;
CREATE POLICY "Anyone can update download count" ON file_shares
  FOR UPDATE USING (true);

-- 7. Create RLS policies for stream_rooms table
-- Allow anyone to read active stream rooms
DROP POLICY IF EXISTS "Anyone can read stream rooms" ON stream_rooms;
CREATE POLICY "Anyone can read stream rooms" ON stream_rooms
  FOR SELECT USING (true);

-- Allow anyone to create stream rooms
DROP POLICY IF EXISTS "Anyone can create stream rooms" ON stream_rooms;
CREATE POLICY "Anyone can create stream rooms" ON stream_rooms
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update stream rooms (for viewer count, etc.)
DROP POLICY IF EXISTS "Anyone can update stream rooms" ON stream_rooms;
CREATE POLICY "Anyone can update stream rooms" ON stream_rooms
  FOR UPDATE USING (true);

-- 8. Create RLS policies for stream_messages table
-- Allow anyone to read messages in any room
DROP POLICY IF EXISTS "Anyone can read stream messages" ON stream_messages;
CREATE POLICY "Anyone can read stream messages" ON stream_messages
  FOR SELECT USING (true);

-- Allow anyone to insert messages
DROP POLICY IF EXISTS "Anyone can insert stream messages" ON stream_messages;
CREATE POLICY "Anyone can insert stream messages" ON stream_messages
  FOR INSERT WITH CHECK (true);

-- 9. Create RLS policies for stream_recordings table
-- Allow anyone to read public recordings
DROP POLICY IF EXISTS "Anyone can read public recordings" ON stream_recordings;
CREATE POLICY "Anyone can read public recordings" ON stream_recordings
  FOR SELECT USING (is_public = true);

-- Allow anyone to insert recordings
DROP POLICY IF EXISTS "Anyone can insert recordings" ON stream_recordings;
CREATE POLICY "Anyone can insert recordings" ON stream_recordings
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update recordings (for view count, etc.)
DROP POLICY IF EXISTS "Anyone can update recordings" ON stream_recordings;
CREATE POLICY "Anyone can update recordings" ON stream_recordings
  FOR UPDATE USING (true);

-- Allow anyone to delete their own recordings (you might want to restrict this)
DROP POLICY IF EXISTS "Anyone can delete recordings" ON stream_recordings;
CREATE POLICY "Anyone can delete recordings" ON stream_recordings
  FOR DELETE USING (true);

-- 10. Storage policies (run these after creating the 'temp-cloud' bucket)
-- Allow anyone to upload files
DROP POLICY IF EXISTS "Anyone can upload files" ON storage.objects;
CREATE POLICY "Anyone can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'temp-cloud');

-- Allow anyone to read files
DROP POLICY IF EXISTS "Anyone can read files" ON storage.objects;
CREATE POLICY "Anyone can read files" ON storage.objects
  FOR SELECT USING (bucket_id = 'temp-cloud');

-- Allow anyone to delete files (for cleanup)
DROP POLICY IF EXISTS "Anyone can delete files" ON storage.objects;
CREATE POLICY "Anyone can delete files" ON storage.objects
  FOR DELETE USING (bucket_id = 'temp-cloud');

-- 11. Functions for cleanup and management
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS void AS $$
BEGIN
  -- Delete expired files from database
  DELETE FROM file_shares 
  WHERE expires_at < NOW() 
     OR (max_downloads IS NOT NULL AND download_count >= max_downloads);
  
  -- Note: You'll need to set up a separate process to delete files from storage
  -- This can be done via a serverless function or cron job
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup inactive stream rooms
CREATE OR REPLACE FUNCTION cleanup_inactive_streams()
RETURNS void AS $$
BEGIN
  -- Mark rooms as inactive if no activity for 1 hour
  UPDATE stream_rooms 
  SET is_active = false, ended_at = NOW()
  WHERE is_active = true 
    AND created_at < NOW() - INTERVAL '1 hour'
    AND ended_at IS NULL;
    
  -- Delete old stream messages (older than 24 hours)
  DELETE FROM stream_messages 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON file_shares TO anon, authenticated;
GRANT ALL ON stream_rooms TO anon, authenticated;
GRANT ALL ON stream_messages TO anon, authenticated;
GRANT ALL ON stream_recordings TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;