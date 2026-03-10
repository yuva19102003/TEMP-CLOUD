'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'
import {
  VideoCameraIcon,
  EyeIcon,
  PlayIcon,
  ArrowLeftIcon,
  SparklesIcon,
  UserGroupIcon,
  ClockIcon,
  ShareIcon
} from '@heroicons/react/24/outline'

export default function StreamPage() {
  const [userName, setUserName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const router = useRouter()

  const createRoom = () => {
    if (!userName.trim()) {
      toast.error('Please enter your name')
      return
    }

    const newRoomId = uuidv4().slice(0, 8).toUpperCase()
    router.push(`/stream/room/${newRoomId}?host=true&name=${encodeURIComponent(userName)}`)
  }

  const joinRoom = () => {
    if (!userName.trim()) {
      toast.error('Please enter your name')
      return
    }
    
    if (!roomId.trim()) {
      toast.error('Please enter a room ID')
      return
    }

    router.push(`/stream/room/${roomId.toUpperCase()}?host=false&name=${encodeURIComponent(userName)}`)
  }

  const quickJoinDemo = () => {
    const demoRoomId = 'DEMO1234'
    const demoName = `Viewer${Math.floor(Math.random() * 1000)}`
    router.push(`/stream/room/${demoRoomId}?host=false&name=${encodeURIComponent(demoName)}`)
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="glass-effect border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                <VideoCameraIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">TempStream</h1>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.push('/')}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to Files</span>
            </motion.button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
            >
              <SparklesIcon className="w-8 h-8 text-white" />
            </motion.div>
          </div>
          <h2 className="text-5xl font-bold text-white mb-6">
            Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">Video Streaming</span>
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Start your own live stream or join others. Share moments in real-time with HD video quality and interactive chat.
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Create Stream */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="card-header">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <VideoCameraIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Start Streaming</h3>
              </div>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="input-field"
                  maxLength={50}
                />
              </div>

              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
                <h4 className="font-semibold text-gray-900 mb-2">🔴 Go Live Features:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• HD video streaming</li>
                  <li>• Real-time chat with viewers</li>
                  <li>• Screen sharing capability</li>
                  <li>• Viewer count & analytics</li>
                </ul>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={createRoom}
                disabled={!userName.trim()}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <PlayIcon className="w-5 h-5" />
                <span>Start Live Stream</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Join Stream */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="card-header">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <EyeIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Join Stream</h3>
              </div>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="input-field"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter room ID (e.g., ABC12345)"
                  className="input-field font-mono tracking-wider"
                  maxLength={8}
                />
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-2">👁️ Viewer Features:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Watch HD live streams</li>
                  <li>• Interactive chat participation</li>
                  <li>• Real-time viewer reactions</li>
                  <li>• Mobile & desktop support</li>
                </ul>
              </div>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={joinRoom}
                  disabled={!userName.trim() || !roomId.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <EyeIcon className="w-5 h-5" />
                  <span>Join Stream</span>
                </motion.button>

                <button
                  onClick={quickJoinDemo}
                  className="w-full text-indigo-600 hover:text-indigo-700 font-medium py-2 transition-colors text-sm"
                >
                  Quick Join Demo Room →
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: UserGroupIcon,
              title: '🎥 Multi-User Streaming',
              description: 'Host streams for unlimited viewers with real-time interaction',
              color: 'from-purple-400 to-purple-600',
              delay: 0.3
            },
            {
              icon: ClockIcon,
              title: '⚡ Instant Connection',
              description: 'No downloads required. Start streaming in seconds',
              color: 'from-green-400 to-green-600',
              delay: 0.4
            },
            {
              icon: ShareIcon,
              title: '🔗 Easy Sharing',
              description: 'Share room codes via QR, links, or social media',
              color: 'from-blue-400 to-blue-600',
              delay: 0.5
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: feature.delay }}
              whileHover={{ y: -5 }}
              className="feature-card"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">{feature.title}</h3>
              <p className="text-gray-600 text-center">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Live Streams Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card"
        >
          <div className="card-header">
            <h3 className="text-xl font-bold text-gray-900">🔴 Live Now</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'DEMO1234', title: 'Demo Stream', viewers: 42, host: 'TempCloud' },
                { id: 'LIVE5678', title: 'Tech Talk', viewers: 128, host: 'DevUser' },
                { id: 'SHOW9012', title: 'Music Session', viewers: 89, host: 'Musician' }
              ].map((stream) => (
                <div key={stream.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg mb-3 flex items-center justify-center">
                    <PlayIcon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{stream.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">by {stream.host}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Room: {stream.id}</span>
                    <span>{stream.viewers} viewers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}