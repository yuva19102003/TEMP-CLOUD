# TempCloud - Temporary File Sharing

A secure temporary file sharing service built with Next.js 14 and Supabase. Upload files, get unique share codes, and allow others to download them with automatic expiry and download limits.

## Features

- 🔒 **Secure File Upload**: Upload files up to 100MB with encryption
- 🔑 **Unique Share Codes**: 6-character codes for easy sharing
- ⏰ **Auto Expiry**: Set custom expiration times (1 hour to 1 week)
- 📊 **Download Limits**: Control how many times files can be downloaded
- 🗑️ **Auto Cleanup**: Files automatically delete after expiry
- 📱 **Responsive Design**: Works on all devices
- 🚀 **Fast & Reliable**: Built on Supabase infrastructure

## How It Works

1. **Upload**: Drag & drop or select a file (max 100MB)
2. **Configure**: Set download limits and expiry time
3. **Share**: Get a unique 6-character code
4. **Download**: Others use the code to download the file
5. **Auto-Delete**: Files are automatically removed after expiry

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **File Upload**: React Dropzone
- **Notifications**: React Hot Toast
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone and install**
   ```bash
   git clone <your-repo-url>
   cd tempcloud-file-sharing
   npm install
   ```

2. **Environment Setup**
   Your `.env` file is configured with Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://orymjolwomwjcsccuccq.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Set up Supabase Database**
   
   Run this SQL in your Supabase SQL Editor:
   
   ```sql
   -- Create file_shares table
   CREATE TABLE file_shares (
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

   -- Create index for faster lookups
   CREATE INDEX idx_file_shares_code ON file_shares(share_code);
   CREATE INDEX idx_file_shares_expires ON file_shares(expires_at);

   -- Set up Row Level Security (RLS)
   ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;

   -- Allow anyone to read file shares (for downloads)
   CREATE POLICY "Anyone can read file shares" ON file_shares
     FOR SELECT USING (true);

   -- Allow anyone to insert file shares (for uploads)
   CREATE POLICY "Anyone can insert file shares" ON file_shares
     FOR INSERT WITH CHECK (true);

   -- Allow anyone to update download count
   CREATE POLICY "Anyone can update download count" ON file_shares
     FOR UPDATE USING (true);
   ```

4. **Set up Supabase Storage Bucket**
   
   In your Supabase dashboard:
   - Go to **Storage** → **Buckets**
   - Create a new bucket called `temp-cloud` (matching your S3_BUCKET_NAME)
   - Make it **Public** ✅
   - The app will use your S3-compatible credentials for direct storage access

   **Note**: The application now uses your S3-compatible storage credentials directly via AWS SDK for better performance and control.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── download/
│   │   └── page.tsx            # Download page with code input
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout with toast provider
│   └── page.tsx                # Upload page (homepage)
├── lib/
│   ├── auth.ts                 # File upload/download functions
│   └── supabase.ts             # Supabase client & utilities
└── .env                        # Environment variables
```

## Key Features Explained

### File Upload
- Drag & drop interface with React Dropzone
- File size validation (max 100MB)
- Automatic file type detection
- Progress indicators during upload

### Share Codes
- 6-character alphanumeric codes (A-Z, 0-9)
- Guaranteed uniqueness
- Easy to share via text/email

### Download Management
- Configurable download limits (1-50 downloads)
- Real-time download counter
- Progress bars showing usage

### Auto Expiry
- Flexible expiry times (1 hour to 1 week)
- Automatic file cleanup
- Visual countdown timers

### Security
- Files stored in Supabase Storage with encryption
- No authentication required (anonymous sharing)
- Automatic cleanup prevents storage bloat
- Row Level Security policies

## API Endpoints

The app uses Supabase's built-in APIs:

- **Upload**: `supabase.storage.from('temp-files').upload()`
- **Download**: `supabase.storage.from('temp-files').createSignedUrl()`
- **Database**: `supabase.from('file_shares').select/insert/update()`

## Customization

### File Size Limits
Update the limit in `app/page.tsx`:
```typescript
// Change 100MB limit
if (file.size > 100 * 1024 * 1024) {
```

### Share Code Length
Modify `generateShareCode()` in `lib/supabase.ts`:
```typescript
// Change from 6 to 8 characters
for (let i = 0; i < 8; i++) {
```

### Expiry Options
Update options in `app/page.tsx`:
```typescript
<option value={720}>30 days</option> // Add new option
```

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy automatically

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Cleanup Job (Optional)

For production, set up a cron job to clean expired files:

```sql
-- Function to clean up expired files
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS void AS $$
BEGIN
  DELETE FROM file_shares 
  WHERE expires_at < NOW() 
     OR (max_downloads IS NOT NULL AND download_count >= max_downloads);
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
SELECT cron.schedule('cleanup-expired-files', '0 * * * *', 'SELECT cleanup_expired_files();');
```

## Security Considerations

- Files are automatically deleted after expiry
- No user authentication required (anonymous)
- Rate limiting should be implemented for production
- Consider adding virus scanning for uploaded files
- Monitor storage usage and costs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ using Next.js and Supabase