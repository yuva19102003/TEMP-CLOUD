'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  XMarkIcon,
  PhoneXMarkIcon,
  UserIcon,
  ComputerDesktopIcon,
  StopIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import websocketService from '@/lib/websocket'
import videoRecorder from '@/lib/video-recorder'

interface VideoStreamProps {
  isHost: boolean
  roomId: string
  userName: string
  onLeave: () => void
}

export default function VideoStream({ isHost, roomId, userName, onLeave }: VideoStreamProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const pipVideoRef = useRef<HTMLVideoElement>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [combinedStream, setCombinedStream] = useState<MediaStream | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [viewerCount, setViewerCount] = useState(1)
  const [error, setError] = useState('')
  const [streamType, setStreamType] = useState<'camera' | 'screen' | 'both'>('camera')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [showPiP, setShowPiP] = useState(false)

  useEffect(() => {
    startLocalStream()
    setupWebSocket()
    
    return () => {
      stopAllStreams()
      websocketService.disconnect()
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(videoRecorder.getRecordingDuration())
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  // Update PiP video when local stream changes
  useEffect(() => {
    if (pipVideoRef.current && localStream && isScreenSharing) {
      pipVideoRef.current.srcObject = localStream
    }
  }, [localStream, isScreenSharing])

  const setupWebSocket = () => {
    try {
      const socket = websocketService.connect(roomId)
      
      websocketService.joinRoom(roomId, userName)
      
      websocketService.onViewerUpdate((count) => {
        setViewerCount(count)
        console.log(`👥 Viewer count updated: ${count}`)
      })

      websocketService.onUserJoined((user) => {
        toast.success(`${user.userName} joined the stream`)
        console.log(`👤 User joined: ${user.userName}`)
      })

      websocketService.onUserLeft((user) => {
        toast(`${user.userName} left the stream`)
        console.log(`👋 User left: ${user.userName}`)
      })

      websocketService.onRecordingStarted(() => {
        toast.success('🎥 Recording started')
      })

      websocketService.onRecordingStopped(() => {
        toast.success('🛑 Recording saved')
      })

      // Simulate periodic viewer updates for demo
      const viewerUpdateInterval = setInterval(() => {
        const randomChange = Math.random() > 0.7
        if (randomChange) {
          const newCount = Math.max(1, viewerCount + (Math.random() > 0.5 ? 1 : -1))
          setViewerCount(Math.min(25, newCount))
        }
      }, 8000 + Math.random() * 12000)

      setIsConnected(websocketService.isConnected())
      
      return () => {
        clearInterval(viewerUpdateInterval)
      }
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      // Continue without WebSocket
      setIsConnected(true)
    }
  }

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      setIsConnected(true)
      setStreamType('camera')
      setError('') // Clear any previous errors
    } catch (err: any) {
      console.error('Error accessing media devices:', err)
      
      let errorMessage = 'Failed to access camera/microphone.'
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera and microphone access denied. Please allow permissions and try again.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect a device and try again.'
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera or microphone is already in use by another application.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera settings not supported. Trying with basic settings...'
        
        // Try with basic settings
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          })
          
          setLocalStream(basicStream)
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = basicStream
          }
          setIsConnected(true)
          setStreamType('camera')
          toast.success('Connected with basic camera settings')
          return
        } catch (basicErr) {
          errorMessage = 'Failed to access camera/microphone with any settings.'
        }
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const startScreenShare = async () => {
    try {
      const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })

      // Handle screen share ending (user clicks "Stop sharing" in browser)
      screenShareStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare()
      })

      setScreenStream(screenShareStream)
      
      // Show screen in main video
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenShareStream
      }
      
      setIsScreenSharing(true)
      setStreamType('screen')
      setError('') // Clear any camera errors since screen sharing works
      setIsConnected(true) // Mark as connected since we have a stream
      
      // Only show PiP if we have camera stream
      if (localStream) {
        setShowPiP(true)
        setStreamType('both')
        // Create combined stream for recording
        createCombinedStream(localStream, screenShareStream)
      }
      
      toast.success('🖥️ Screen sharing started')
      
    } catch (err: any) {
      console.error('Error starting screen share:', err)
      
      let errorMessage = 'Failed to start screen sharing.'
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Screen sharing permission denied. Please allow screen access and try again.'
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Screen sharing is not supported in this browser. Try Chrome, Firefox, or Edge.'
      } else if (err.name === 'AbortError') {
        errorMessage = 'Screen sharing was cancelled.'
      }
      
      toast.error(errorMessage)
    }
  }

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
      setScreenStream(null)
    }
    
    setIsScreenSharing(false)
    setShowPiP(false)
    setStreamType('camera')
    setCombinedStream(null)
    
    toast('📹 Screen sharing stopped')
  }

  const createCombinedStream = (cameraStream: MediaStream | null, screenStream: MediaStream) => {
    if (!cameraStream) return

    try {
      // Create canvas for combining streams
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 1920
      canvas.height = 1080

      // Create video elements for processing
      const screenVideo = document.createElement('video')
      const cameraVideo = document.createElement('video')
      
      screenVideo.srcObject = screenStream
      cameraVideo.srcObject = cameraStream
      
      screenVideo.play()
      cameraVideo.play()

      // Combine streams on canvas
      const drawFrame = () => {
        if (!ctx) return
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Draw screen share (full background)
        if (screenVideo.readyState >= 2) {
          ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)
        }
        
        // Draw camera (picture-in-picture, bottom-right corner)
        if (cameraVideo.readyState >= 2) {
          const pipWidth = 320
          const pipHeight = 240
          const pipX = canvas.width - pipWidth - 20
          const pipY = canvas.height - pipHeight - 20
          
          // Add border/shadow for PiP
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
          ctx.fillRect(pipX - 2, pipY - 2, pipWidth + 4, pipHeight + 4)
          
          ctx.drawImage(cameraVideo, pipX, pipY, pipWidth, pipHeight)
        }
        
        requestAnimationFrame(drawFrame)
      }
      
      drawFrame()
      
      // Create stream from canvas
      const combinedMediaStream = canvas.captureStream(30)
      
      // Add audio from both sources
      if (screenStream.getAudioTracks().length > 0) {
        screenStream.getAudioTracks().forEach(track => {
          combinedMediaStream.addTrack(track)
        })
      }
      if (cameraStream.getAudioTracks().length > 0) {
        cameraStream.getAudioTracks().forEach(track => {
          combinedMediaStream.addTrack(track)
        })
      }
      
      setCombinedStream(combinedMediaStream)
      
    } catch (error) {
      console.error('Error creating combined stream:', error)
    }
  }

  const stopAllStreams = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
      setScreenStream(null)
    }
    if (combinedStream) {
      combinedStream.getTracks().forEach(track => track.stop())
      setCombinedStream(null)
    }
    if (isRecording) {
      stopRecording()
    }
  }

  const toggleVideo = () => {
    const currentStream = isScreenSharing ? screenStream : localStream
    if (currentStream) {
      const videoTrack = currentStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    // Always control audio from the camera stream
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const handleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare()
    } else {
      startScreenShare()
    }
  }

  const startRecording = async () => {
    if (!isHost) {
      toast.error('Only the host can start recording')
      return
    }

    // Use combined stream if both camera and screen are active, otherwise use any available stream
    const recordingStream = combinedStream || screenStream || localStream
    if (!recordingStream) {
      toast.error('No active stream to record. Start camera or screen sharing first.')
      return
    }

    // Determine recording type
    const recordingType = combinedStream ? 'combined' : 
                         screenStream && !localStream ? 'screen' : 
                         localStream && !screenStream ? 'camera' : 'screen'

    try {
      const success = await videoRecorder.startRecording(
        recordingStream,
        roomId,
        userName,
        {},
        recordingType
      )

      if (success) {
        setIsRecording(true)
        setRecordingDuration(0)
        websocketService.startRecording(roomId)
        
        const typeLabel = recordingType === 'combined' ? 'Screen + Camera' : 
                         recordingType === 'screen' ? 'Screen Share' : 'Camera'
        toast.success(`🎥 Recording started (${typeLabel})`)
      } else {
        toast.error('Failed to start recording')
      }
    } catch (error) {
      console.error('Recording error:', error)
      toast.error('Failed to start recording')
    }
  }

  const stopRecording = async () => {
    try {
      const metadata = await videoRecorder.stopRecording()
      setIsRecording(false)
      setRecordingDuration(0)
      
      if (metadata) {
        websocketService.stopRecording(roomId)
        toast.success(`🎬 Recording saved: ${metadata.title}`)
      } else {
        toast.error('Failed to save recording')
      }
    } catch (error) {
      console.error('Stop recording error:', error)
      toast.error('Failed to stop recording')
    }
  }

  const handleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleLeave = () => {
    websocketService.leaveRoom(roomId)
    stopAllStreams()
    onLeave()
  }

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Stream Status */}
        <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-violet-500/20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-white font-medium">MEDIA ACCESS REQUIRED</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <UserIcon className="w-4 h-4" />
              <span>{viewerCount} viewer{viewerCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="text-slate-400 text-sm">
            Room: {roomId}
          </div>
        </div>

        {/* Error Display with Screen Share Option */}
        <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video border border-violet-500/20">
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white max-w-md mx-auto p-6">
              <XMarkIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-lg font-medium mb-2">Media Access Required</p>
              <p className="text-slate-400 mb-6 text-sm leading-relaxed">{error}</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setError('')
                    startLocalStream()
                  }}
                  className="btn-primary w-full"
                >
                  Try Camera & Microphone Again
                </button>
                
                {/* Screen Share Option - Available Even Without Camera */}
                <button
                  onClick={handleScreenShare}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex items-center justify-center space-x-2"
                >
                  <ComputerDesktopIcon className="w-5 h-5" />
                  <span>Share Screen Instead</span>
                </button>
                
                <div className="text-xs text-slate-500 space-y-1">
                  <p>💡 <strong>Options:</strong></p>
                  <p>• Use "Share Screen" to stream without camera</p>
                  <p>• Click camera icon in browser address bar for permissions</p>
                  <p>• Make sure no other apps are using your camera</p>
                  <p>• Try refreshing the page if issues persist</p>
                </div>
              </div>
            </div>
          </div>

          {/* Screen Share Controls Overlay - Always Available */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
          >
            <div className="flex items-center space-x-3 video-controls rounded-full px-6 py-3 border border-violet-500/30">
              {/* Screen Share Toggle - Always Available */}
              <button
                onClick={handleScreenShare}
                className={`control-btn ${isScreenSharing ? 'active' : 'neutral'}`}
                title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
              >
                {isScreenSharing ? (
                  <StopIcon className="w-5 h-5" />
                ) : (
                  <ComputerDesktopIcon className="w-5 h-5" />
                )}
              </button>

              {/* Recording Toggle (Host only) */}
              {isHost && (
                <button
                  onClick={handleRecording}
                  className={`control-btn ${isRecording ? 'inactive' : 'neutral'}`}
                  title={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isRecording ? (
                    <StopIcon className="w-5 h-5" />
                  ) : (
                    <PlayIcon className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Leave Call */}
              <button
                onClick={handleLeave}
                className="control-btn inactive"
                title="Leave stream"
              >
                <PhoneXMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Stream Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-violet-500/20">
            <div className="text-2xl font-bold text-white">{viewerCount}</div>
            <div className="text-sm text-slate-400">Viewers</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-violet-500/20">
            <div className="text-2xl font-bold text-white">HD</div>
            <div className="text-sm text-slate-400">Quality</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-violet-500/20">
            <div className="text-2xl font-bold text-white">🔴</div>
            <div className="text-sm text-slate-400">Status</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-violet-500/20">
            <div className="text-2xl font-bold text-white">
              {isScreenSharing ? '🖥️' : '📹'}
            </div>
            <div className="text-sm text-slate-400">
              {isScreenSharing ? 'Screen' : 'Camera'}
            </div>
          </div>
        </div>

        {/* Screen Share Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30"
        >
          <div className="flex items-start space-x-3">
            <ComputerDesktopIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">💡 Screen Sharing Available</p>
              <p>You can still share your screen even without camera access. Click "Share Screen" to stream your desktop, window, or browser tab.</p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stream Status */}
      <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-violet-500/20">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
            <span className="text-white font-medium">
              {isConnected ? (isHost ? 'LIVE' : 'WATCHING') : 'CONNECTING...'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <UserIcon className="w-4 h-4" />
            <span>{viewerCount} viewer{viewerCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            {isScreenSharing ? (
              <ComputerDesktopIcon className="w-4 h-4" />
            ) : (
              <VideoCameraIcon className="w-4 h-4" />
            )}
            <span>{streamType === 'screen' ? 'Screen Share' : 'Camera'}</span>
          </div>
          {isRecording && (
            <div className="flex items-center space-x-2 text-red-400">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-mono">{formatRecordingTime(recordingDuration)}</span>
            </div>
          )}
        </div>
        <div className="text-slate-400 text-sm">
          Room: {roomId}
        </div>
      </div>

      {/* Video Container */}
      <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video border border-violet-500/20">
        {/* Main Video Display */}
        {isScreenSharing ? (
          // Screen sharing mode - show screen as main video
          <video
            ref={screenVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : localStream ? (
          // Camera only mode (if available)
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          // No video available - show placeholder
          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <VideoCameraSlashIcon className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">No video source</p>
              <p className="text-sm">Use screen sharing or enable camera</p>
            </div>
          </div>
        )}

        {/* Picture-in-Picture Camera (when screen sharing and camera available) */}
        {isScreenSharing && showPiP && localStream && (
          <div className="absolute bottom-20 right-4 w-64 h-48 bg-slate-800 rounded-lg overflow-hidden border-2 border-violet-500/50 shadow-2xl">
            <video
              ref={pipVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              Camera
            </div>
          </div>
        )}
        
        {/* Video Overlay */}
        {!isVideoEnabled && (isScreenSharing || localStream) && (
          <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center">
            <div className="text-center text-white">
              {isScreenSharing ? (
                <ComputerDesktopIcon className="w-16 h-16 mx-auto mb-4 text-slate-500" />
              ) : (
                <VideoCameraSlashIcon className="w-16 h-16 mx-auto mb-4 text-slate-500" />
              )}
              <p className="text-lg">
                {isScreenSharing ? 'Screen sharing paused' : 'Camera is off'}
              </p>
            </div>
          </div>
        )}

        {/* Controls Overlay - Always show screen share and basic controls */}
        {(isConnected || isScreenSharing) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
          >
            <div className="flex items-center space-x-3 video-controls rounded-full px-6 py-3 border border-violet-500/30">
              {/* Camera Toggle - Only show if camera is available */}
              {localStream && (
                <button
                  onClick={toggleVideo}
                  className={`control-btn ${isVideoEnabled ? 'active' : 'inactive'}`}
                  title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoEnabled ? (
                    <VideoCameraIcon className="w-5 h-5" />
                  ) : (
                    <VideoCameraSlashIcon className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Audio Toggle - Only show if microphone is available */}
              {localStream && (
                <button
                  onClick={toggleAudio}
                  className={`control-btn ${isAudioEnabled ? 'active' : 'inactive'}`}
                  title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {isAudioEnabled ? (
                    <MicrophoneIcon className="w-5 h-5" />
                  ) : (
                    <SpeakerXMarkIcon className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Screen Share Toggle - Always available */}
              <button
                onClick={handleScreenShare}
                className={`control-btn ${isScreenSharing ? 'active' : 'neutral'}`}
                title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
              >
                {isScreenSharing ? (
                  <StopIcon className="w-5 h-5" />
                ) : (
                  <ComputerDesktopIcon className="w-5 h-5" />
                )}
              </button>

              {/* Recording Toggle (Host only) - Show if any stream is available */}
              {isHost && (localStream || screenStream) && (
                <button
                  onClick={handleRecording}
                  className={`control-btn ${isRecording ? 'inactive' : 'neutral'}`}
                  title={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isRecording ? (
                    <StopIcon className="w-5 h-5" />
                  ) : (
                    <PlayIcon className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Leave Call */}
              <button
                onClick={handleLeave}
                className="control-btn inactive"
                title="Leave stream"
              >
                <PhoneXMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Stream Info */}
        {(isConnected || isScreenSharing) && (
          <div className="absolute top-4 left-4">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-violet-500/20">
              <p className="text-white text-sm font-medium flex items-center space-x-2">
                {streamType === 'both' ? (
                  <>
                    <ComputerDesktopIcon className="w-4 h-4" />
                    <span>Screen + Camera</span>
                  </>
                ) : isScreenSharing ? (
                  <>
                    <ComputerDesktopIcon className="w-4 h-4" />
                    <span>Screen sharing</span>
                  </>
                ) : localStream ? (
                  <>
                    <VideoCameraIcon className="w-4 h-4" />
                    <span>{isHost ? 'You are streaming' : 'Watching stream'}</span>
                  </>
                ) : (
                  <>
                    <XMarkIcon className="w-4 h-4" />
                    <span>No media source</span>
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 border border-red-400"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>REC {formatRecordingTime(recordingDuration)}</span>
            </motion.div>
          </div>
        )}
      </div>

      {/* Stream Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-violet-500/20">
          <div className="text-2xl font-bold text-white">{viewerCount}</div>
          <div className="text-sm text-slate-400">Viewers</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-violet-500/20">
          <div className="text-2xl font-bold text-white">HD</div>
          <div className="text-sm text-slate-400">Quality</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-violet-500/20">
          <div className="text-2xl font-bold text-white">
            {isConnected ? '🟢' : '🔴'}
          </div>
          <div className="text-sm text-slate-400">Status</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 text-center border border-violet-500/20">
          <div className="text-2xl font-bold text-white">
            {isRecording ? '🎥' : streamType === 'both' ? '🖥️📹' : (isScreenSharing ? '🖥️' : '📹')}
          </div>
          <div className="text-sm text-slate-400">
            {isRecording ? 'Recording' : streamType === 'both' ? 'Screen+Cam' : (isScreenSharing ? 'Screen' : 'Camera')}
          </div>
        </div>
      </div>

      {/* Feature Instructions */}
      {!isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-violet-500/10 rounded-xl p-4 border border-violet-500/30"
        >
          <div className="flex items-start space-x-3">
            <ComputerDesktopIcon className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-violet-200">
              <p className="font-medium mb-1">💡 Advanced Streaming Features</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Camera & Mic:</strong> Toggle your video and audio independently</li>
                <li>• <strong>Screen Share:</strong> Share your screen while keeping camera in picture-in-picture</li>
                {isHost && <li>• <strong>Recording:</strong> Save streams with both camera and screen content combined</li>}
                <li>• <strong>Multi-source:</strong> Stream camera + screen simultaneously for professional presentations</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}