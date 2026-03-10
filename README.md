# TempCloud - Advanced File Sharing & Live Streaming Platform

A modern, feature-rich file sharing and live streaming platform built with Next.js, Supabase, and WebSocket technology. Features include temporary file sharing, live video streaming with screen sharing, real-time chat, video recording, and a comprehensive playlist system.

## ✨ Features

### 📁 File Sharing
- **Temporary File Upload**: Upload files up to 100MB with automatic expiry
- **Secure Sharing**: Generate unique codes for secure file access
- **Download Tracking**: Monitor download counts and analytics
- **QR Code Generation**: Easy sharing via QR codes
- **File Preview**: Preview various file types before download

### 🎥 Live Streaming
- **HD Video Streaming**: High-quality camera and screen sharing
- **Real-time Chat**: Interactive chat with WebSocket integration
- **Screen Sharing**: Share entire screen, windows, or browser tabs
- **Video Recording**: Automatically save streams to S3 storage
- **Viewer Management**: Real-time viewer count and user tracking

### 📺 Playlist & Recordings
- **Video Playlist**: Browse and play recorded streams
- **Search & Filter**: Find recordings by title, host, or duration
- **Video Player**: Built-in video player with full controls
- **Recording Management**: Delete, share, and organize recordings
- **Analytics Dashboard**: View streaming statistics and metrics

### 🎨 Modern UI/UX
- **Dark Violet Theme**: Modern aesthetic with glass morphism effects
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Smooth Animations**: Framer Motion powered transitions
- **Real-time Updates**: Live notifications and status indicators

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- S3-compatible storage (Supabase Storage or AWS S3)

### 1. Clone and Install
```bash
git clone <repository-url>
cd tempcloud
npm install
```

### 2. Environment Setup
Create a `.env.local` file:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# S3 Storage Configuration (if using external S3)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket_name
```

### 3. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL commands from `supabase-setup.sql`
4. Create a storage bucket named `temp-cloud`

### 4. WebSocket Server (Optional for Real-time Features)
```bash
# In a separate terminal
cp websocket-package.json package.json
npm install
npm start
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📋 Database Schema

### Core Tables
- **file_shares**: Temporary file sharing records
- **stream_rooms**: Live streaming room management
- **stream_messages**: Real-time chat messages
- **stream_recordings**: Saved video recordings

### Key Features
- Row Level Security (RLS) enabled
- Automatic cleanup functions
- Optimized indexes for performance
- Public access policies for demo usage

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **React Player**: Video playback
- **Socket.io Client**: Real-time communication

### Backend
- **Supabase**: Database and authentication
- **S3 Storage**: File and video storage
- **WebSocket Server**: Real-time features
- **RecordRTC**: Video recording
- **Next.js API Routes**: Server-side logic

### Key Libraries
- `@supabase/supabase-js`: Database integration
- `socket.io-client`: WebSocket client
- `recordrtc`: Video recording
- `react-player`: Video playback
- `react-dropzone`: File upload UI
- `qrcode`: QR code generation

## 🎯 Usage Guide

### File Sharing
1. **Upload**: Drag & drop files or click to browse
2. **Configure**: Set expiry time and download limits
3. **Share**: Copy the generated code or QR code
4. **Download**: Recipients enter the code to download

### Live Streaming
1. **Create Room**: Enter your name and start streaming
2. **Share Room**: Share the room ID with viewers
3. **Controls**: Toggle camera, microphone, and screen sharing
4. **Record**: Host can record streams for later viewing
5. **Chat**: Interact with viewers in real-time

### Playlist Management
1. **Browse**: View all recorded streams
2. **Search**: Find specific recordings
3. **Play**: Watch recordings with full video controls
4. **Manage**: Delete or share recordings
5. **Analytics**: View streaming statistics

## 🔧 Configuration

### WebSocket Server
The WebSocket server enables real-time features:
- Real-time chat messaging
- Live viewer count updates
- User join/leave notifications
- Recording status updates

### Storage Configuration
Supports both Supabase Storage and external S3:
- **Supabase Storage**: Built-in, easy setup
- **AWS S3**: External storage for larger scale
- **File Types**: Supports all common file formats
- **Size Limits**: Configurable upload limits

### Security Features
- Row Level Security (RLS) on all tables
- Secure file access with expiring URLs
- Input validation and sanitization
- CORS protection for API endpoints

## 📊 Analytics & Monitoring

### Built-in Analytics
- File upload/download statistics
- Streaming session metrics
- User engagement tracking
- Storage usage monitoring

### Performance Monitoring
- Real-time connection status
- Video quality indicators
- Chat message delivery
- Recording success rates

## 🚀 Deployment

### Vercel Deployment
```bash
npm run build
vercel --prod
```

### Environment Variables
Set the following in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Storage credentials (if using external S3)

### WebSocket Server Deployment
Deploy the WebSocket server separately:
- Use services like Railway, Render, or DigitalOcean
- Update the WebSocket URL in the client configuration
- Ensure CORS settings allow your domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the setup guide
- Open an issue on GitHub
- Join our community discussions

## 🎉 Acknowledgments

- Supabase for the excellent backend platform
- Vercel for seamless deployment
- The open-source community for amazing libraries
- Contributors and testers

---

**TempCloud** - Secure, temporary, and feature-rich file sharing with live streaming capabilities.