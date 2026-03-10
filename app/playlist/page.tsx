'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import ReactPlayer from 'react-player'
import toast from 'react-hot-toast'
import {
  PlayIcon,
  PauseIcon,
  ArrowLeftIcon,
  EyeIcon,
  ClockIcon,
  CalendarIcon,
  TrashIcon,
  ShareIcon,
  DownloadIcon,
  VideoCameraIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { videoRecorder, RecordingMetadata } from '@/lib/video-recorder'

export default function PlaylistPage() {
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([])
  const [selectedRecording, setSelectedRecording] = useState<RecordingMetadata | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'views'>('date')
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'long'>('all')
  const router = useRouter()

  useEffect(() => {
    loadRecordings()
  }, [])

  const loadRecordings = async () => {
    setIsLoading(true)
    try {
      const data = await videoRecorder.getRecordings()
      setRecordings(data)
    } catch (error) {
      console.error('Failed to load recordings:', error)
      toast.error('Failed to load recordings')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAndSortedRecordings = recordings
    .filter(recording => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          recording.title.toLowerCase().includes(query) ||
          recording.hostName.toLowerCase().includes(query) ||
          recording.roomId.toLowerCase().includes(query)
        )
      }
      return true
    })
    .filter(recording => {
      // Category filter
      switch (filterBy) {
        case 'recent':
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          return recording.createdAt > oneDayAgo
        case 'long':
          return recording.duration > 300 // 5+ minutes
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'duration':
          return b.duration - a.duration
        case 'views':
          return (b as any).views - (a as any).views || 0
        default:
          return b.createdAt.getTime() - a.createdAt.getTime()
      }
    })

  const handlePlayRecording = (recording: RecordingMetadata) => {
    setSelectedRecording(recording)
    setIsPlaying(true)
  }

  const handleDeleteRecording = async (recordingId: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return

    try {
      const success = await videoRecorder.deleteRecording(recordingId)
      if (success) {
        setRecordings(prev => prev.filter(r => r.id !== recordingId))
        if (selectedRecording?.id === recordingId) {
          setSelectedRecording(null)
          setIsPlaying(false)
        }
        toast.success('Recording deleted successfully')
      } else {
        toast.error('Failed to delete recording')
      }
    } catch (error) {
      console.error('Error deleting recording:', error)
      toast.error('Failed to delete recording')
    }
  }

  const shareRecording = (recording: RecordingMetadata) => {
    const shareUrl = `${window.location.origin}/playlist?play=${recording.id}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('🔗 Recording link copied to clipboard!')
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="glass-effect border-b border-violet-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
                <VideoCameraIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Stream Playlist</h1>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.push('/stream')}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to Streaming</span>
            </motion.button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-dark rounded-2xl overflow-hidden"
            >
              {selectedRecording ? (
                <div className="aspect-video bg-black relative">
                  <ReactPlayer
                    url={`/api/recordings/${selectedRecording.id}`}
                    width="100%"
                    height="100%"
                    playing={isPlaying}
                    controls
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-slate-800 flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <VideoCameraIcon className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg font-medium">Select a recording to play</p>
                    <p className="text-sm">Choose from your saved streams below</p>
                  </div>
                </div>
              )}

              {selectedRecording && (
                <div className="p-6 border-t border-violet-500/20">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">
                        {selectedRecording.title}
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span className="flex items-center space-x-1">
                          <EyeIcon className="w-4 h-4" />
                          <span>Host: {selectedRecording.hostName}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{videoRecorder.formatDuration(selectedRecording.duration)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{formatDate(selectedRecording.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => shareRecording(selectedRecording)}
                        className="control-btn neutral"
                        title="Share recording"
                      >
                        <ShareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecording(selectedRecording.id)}
                        className="control-btn inactive"
                        title="Delete recording"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-white">
                        {videoRecorder.formatFileSize(selectedRecording.fileSize)}
                      </div>
                      <div className="text-xs text-slate-400">File Size</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-white">HD</div>
                      <div className="text-xs text-slate-400">Quality</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-white">
                        {selectedRecording.roomId}
                      </div>
                      <div className="text-xs text-slate-400">Room ID</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-white">WebM</div>
                      <div className="text-xs text-slate-400">Format</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Playlist Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card-dark"
            >
              <div className="card-header">
                <h3 className="text-lg font-bold text-white">Recordings</h3>
                
                {/* Search and Filters */}
                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search recordings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-violet-500/30 rounded-lg text-white placeholder-slate-400 text-sm"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="flex-1 px-3 py-2 bg-slate-800/50 border border-violet-500/30 rounded-lg text-white text-sm"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="duration">Sort by Duration</option>
                      <option value="views">Sort by Views</option>
                    </select>
                    
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as any)}
                      className="flex-1 px-3 py-2 bg-slate-800/50 border border-violet-500/30 rounded-lg text-white text-sm"
                    >
                      <option value="all">All</option>
                      <option value="recent">Recent</option>
                      <option value="long">Long (5+ min)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card-body max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading recordings...</p>
                  </div>
                ) : filteredAndSortedRecordings.length === 0 ? (
                  <div className="text-center py-8">
                    <VideoCameraIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">No recordings found</p>
                    <p className="text-sm text-slate-500">
                      {searchQuery ? 'Try a different search term' : 'Start streaming to create recordings'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAndSortedRecordings.map((recording, index) => (
                      <motion.div
                        key={recording.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handlePlayRecording(recording)}
                        className={`playlist-item ${
                          selectedRecording?.id === recording.id ? 'playing' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                              {selectedRecording?.id === recording.id && isPlaying ? (
                                <PauseIcon className="w-4 h-4 text-violet-400" />
                              ) : (
                                <PlayIcon className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white truncate">
                              {recording.title}
                            </h4>
                            <p className="text-xs text-slate-400 truncate">
                              by {recording.hostName}
                            </p>
                            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500">
                              <span>{videoRecorder.formatDuration(recording.duration)}</span>
                              <span>•</span>
                              <span>{formatDate(recording.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 card-dark"
            >
              <div className="card-header">
                <h3 className="text-lg font-bold text-white">Statistics</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Recordings</span>
                  <span className="font-bold text-white">{recordings.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Duration</span>
                  <span className="font-bold text-white">
                    {videoRecorder.formatDuration(
                      recordings.reduce((sum, r) => sum + r.duration, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Size</span>
                  <span className="font-bold text-white">
                    {videoRecorder.formatFileSize(
                      recordings.reduce((sum, r) => sum + r.fileSize, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Latest Recording</span>
                  <span className="font-bold text-white">
                    {recordings.length > 0 
                      ? formatDate(recordings[0].createdAt).split(',')[0]
                      : 'None'
                    }
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