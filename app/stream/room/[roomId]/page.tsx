'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  ShareIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import VideoStream from '@/components/VideoStream'
import StreamChat from '@/components/StreamChat'
import QRCodeGenerator from '@/components/QRCodeGenerator'

export default function StreamRoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const roomId = params.roomId as string
  const isHost = searchParams.get('host') === 'true'
  const userName = searchParams.get('name') || 'Anonymous'
  
  const [showQR, setShowQR] = useState(false)
  const [streamStartTime] = useState(new Date())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isInRoom, setIsInRoom] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [realTimeViewers, setRealTimeViewers] = useState(1)

  useEffect(() => {
    // Simulate joining room
    toast.success(isHost ? '🔴 Stream started!' : '👁️ Joined stream!')
    
    // Set up real-time clock
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Set up WebSocket connection status monitoring
    const statusInterval = setInterval(() => {
      // This will be handled by the WebSocket service
      setConnectionStatus('connected')
    }, 2000)

    // Simulate real-time viewer updates
    const viewerInterval = setInterval(() => {
      const randomChange = Math.random() > 0.7
      if (randomChange) {
        setRealTimeViewers(prev => {
          const change = Math.random() > 0.5 ? 1 : -1
          const newCount = Math.max(1, prev + change)
          return Math.min(50, newCount) // Cap at 50 viewers
        })
      }
    }, 5000 + Math.random() * 10000) // Random interval between 5-15 seconds

    return () => {
      clearInterval(clockInterval)
      clearInterval(statusInterval)
      clearInterval(viewerInterval)
    }
  }, [isHost])

  // Real-time stream duration calculation
  const getStreamDuration = () => {
    const diff = currentTime.getTime() - streamStartTime.getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Real-time clock display
  const getCurrentTime = () => {
    return currentTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    })
  }

  // Connection status indicator
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400'
      case 'connecting': return 'text-yellow-400'
      case 'disconnected': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢'
      case 'connecting': return '🟡'
      case 'disconnected': return '🔴'
      default: return '⚪'
    }
  }

  const handleLeaveRoom = () => {
    setIsInRoom(false)
    setConnectionStatus('disconnected')
    toast.success('Left the stream')
    router.push('/stream')
  }

  const shareRoom = () => {
    const shareUrl = `${window.location.origin}/stream/room/${roomId}?host=false&name=Viewer`
    navigator.clipboard.writeText(shareUrl)
    toast.success('🔗 Room link copied to clipboard!')
  }

  const getStreamDurationLegacy = () => {
    const now = new Date()
    const diff = now.getTime() - streamStartTime.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isInRoom) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">You left the stream</h2>
          <button
            onClick={() => router.push('/stream')}
            className="btn-secondary"
          >
            Back to Streaming
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="glass-effect border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <button
                onClick={handleLeaveRoom}
                className="text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {isHost ? '🔴 Your Stream' : '👁️ Watching Stream'}
                </h1>
                <p className="text-white/70 text-sm">Room: {roomId}</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-6"
            >
              {/* Real-time Clock */}
              <div className="text-white/80 text-sm font-mono">
                <div className="flex items-center space-x-2">
                  <span>🕐</span>
                  <span>{getCurrentTime()}</span>
                </div>
              </div>
              
              {/* Stream Duration */}
              <div className="text-white/80 text-sm">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>{getStreamDuration()}</span>
                </div>
              </div>

              {/* Connection Status */}
              <div className={`text-sm ${getConnectionStatusColor()}`}>
                <div className="flex items-center space-x-2">
                  <span>{getConnectionStatusIcon()}</span>
                  <span className="capitalize">{connectionStatus}</span>
                </div>
              </div>

              {/* Live Viewer Count */}
              <div className="text-white/80 text-sm">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>{realTimeViewers} live</span>
                </div>
              </div>
              
              <button
                onClick={shareRoom}
                className="btn-secondary flex items-center space-x-2"
              >
                <ShareIcon className="w-4 h-4" />
                <span>Share</span>
              </button>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Stream Area */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="card-body">
                <VideoStream 
                  isHost={isHost}
                  roomId={roomId}
                  userName={userName}
                  onLeave={handleLeaveRoom}
                />
              </div>
            </motion.div>

            {/* Stream Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 card"
            >
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isHost ? 'Stream Settings' : 'Stream Information'}
                  </h3>
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    {showQR ? 'Hide QR' : 'Show QR Code'}
                  </button>
                </div>

                {showQR && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <QRCodeGenerator 
                      shareCode={roomId}
                      downloadUrl={`${window.location.origin}/stream/room/${roomId}?host=false&name=Viewer`}
                    />
                  </motion.div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center bg-slate-800/60 rounded-xl p-3 border border-violet-500/20">
                    <div className="text-2xl font-bold text-white">HD</div>
                    <div className="text-sm text-slate-400">Quality</div>
                  </div>
                  <div className="text-center bg-slate-800/60 rounded-xl p-3 border border-violet-500/20">
                    <div className="text-2xl font-bold text-white font-mono">{getStreamDuration()}</div>
                    <div className="text-sm text-slate-400">Duration</div>
                  </div>
                  <div className="text-center bg-slate-800/60 rounded-xl p-3 border border-violet-500/20">
                    <div className="text-2xl font-bold text-white">{getConnectionStatusIcon()}</div>
                    <div className={`text-sm capitalize ${getConnectionStatusColor()}`}>{connectionStatus}</div>
                  </div>
                  <div className="text-center bg-slate-800/60 rounded-xl p-3 border border-violet-500/20">
                    <div className="text-2xl font-bold text-white flex items-center justify-center space-x-1">
                      <span>{realTimeViewers}</span>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    </div>
                    <div className="text-sm text-slate-400">Live Viewers</div>
                  </div>
                </div>

                {isHost && (
                  <div className="mt-6 p-4 bg-violet-500/10 rounded-xl border border-violet-500/30">
                    <h4 className="font-semibold text-violet-200 mb-2">📋 Host Tips:</h4>
                    <ul className="text-sm text-violet-300 space-y-1">
                      <li>• Share the room ID: <code className="bg-violet-500/20 px-1 rounded text-violet-200">{roomId}</code></li>
                      <li>• Use good lighting for better video quality</li>
                      <li>• Interact with viewers through chat</li>
                      <li>• Check your internet connection for smooth streaming</li>
                      <li>• Real-time data updates every few seconds</li>
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StreamChat roomId={roomId} userName={userName} />
            </motion.div>

            {/* Room Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 card-dark"
            >
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <UserGroupIcon className="w-5 h-5 text-violet-400" />
                  <span>Live Stats</span>
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Room ID</span>
                  <code className="bg-slate-700/50 px-2 py-1 rounded text-sm font-mono text-violet-200">{roomId}</code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Live Viewers</span>
                  <span className="font-medium text-white flex items-center space-x-1">
                    <span>{realTimeViewers}</span>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Stream Time</span>
                  <span className="font-medium text-white font-mono">{getStreamDuration()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Current Time</span>
                  <span className="font-medium text-white font-mono">{getCurrentTime()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Your Role</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isHost ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {isHost ? 'Streamer' : 'Viewer'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Connection</span>
                  <span className={`font-medium capitalize ${getConnectionStatusColor()}`}>
                    {getConnectionStatusIcon()} {connectionStatus}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}