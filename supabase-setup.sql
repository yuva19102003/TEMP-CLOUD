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

-- 2. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_file_shares_code ON file_shares(share_code);
CREATE INDEX IF NOT EXISTS idx_file_shares_expires ON file_shares(expires_at);

-- 3. Set up Row Level Security (RLS)
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for file_shares table
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

-- 5. Storage policies (run these after creating the 'temp-cloud' bucket)
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

-- 6. Optional: Function to clean up expired files (for cron job)
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

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON file_shares TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;