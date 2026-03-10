'use client'

import { io, Socket } from 'socket.io-client'

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false

  connect(roomId?: string): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    if (this.isConnecting) {
      return this.socket || ({} as Socket)
    }

    this.isConnecting = true

    try {
      // Try to connect to WebSocket server, fallback to mock if not available
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-websocket-server.com' 
        : 'ws://localhost:3001'

      console.log('🔗 Attempting WebSocket connection to:', socketUrl)

      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true,
        query: roomId ? { roomId } : undefined
      })

      this.setupEventListeners()
      
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!this.socket?.connected) {
          console.log('📱 WebSocket connection timeout, using fallback mode')
          this.socket?.disconnect()
          this.socket = null
          this.isConnecting = false
          // Return mock socket for demo purposes
          return this.createMockSocket()
        }
      }, 3000)

      this.socket.on('connect', () => {
        clearTimeout(connectionTimeout)
        this.isConnecting = false
        console.log('🔗 WebSocket connected successfully')
        this.reconnectAttempts = 0
        
        if (roomId) {
          this.socket?.emit('join-room', { roomId, userName: 'User' })
        }
      })

      this.socket.on('connect_error', () => {
        clearTimeout(connectionTimeout)
        this.isConnecting = false
        console.log('📱 WebSocket connection failed, using fallback mode')
        this.socket = this.createMockSocket()
      })
      
      if (roomId) {
        // Wait a bit for connection then join room
        setTimeout(() => {
          if (this.socket?.connected) {
            this.socket.emit('join-room', { roomId, userName: 'User' })
          }
        }, 100)
      }

      return this.socket

    } catch (error) {
      console.error('🚫 WebSocket connection error:', error)
      this.isConnecting = false
      this.socket = this.createMockSocket()
      return this.socket
    }
  }

  private createMockSocket(): Socket {
    console.log('📱 Creating mock WebSocket for demo mode')
    
    const mockSocket = {
      connected: true,
      emit: (event: string, data?: any) => {
        console.log(`📤 Mock emit: ${event}`, data)
        
        // Simulate responses for demo
        if (event === 'join-room') {
          setTimeout(() => {
            this.simulateViewerUpdate(Math.floor(Math.random() * 10) + 1)
          }, 500)
        }
        
        if (event === 'chat-message') {
          setTimeout(() => {
            this.simulateMessage(data.roomId, data.message, data.userName)
          }, 100)
        }
      },
      on: (event: string, callback: Function) => {
        // Store callbacks for mock events
        if (!this.mockListeners) {
          this.mockListeners = {}
        }
        if (!this.mockListeners[event]) {
          this.mockListeners[event] = []
        }
        this.mockListeners[event].push(callback)
      },
      disconnect: () => {
        console.log('📱 Mock WebSocket disconnected')
      }
    } as Socket

    // Start demo simulation
    this.startDemoSimulation()
    
    return mockSocket
  }

  private mockListeners: { [key: string]: Function[] } = {}

  private startDemoSimulation() {
    // Simulate periodic viewer updates
    setInterval(() => {
      this.simulateViewerUpdate(Math.floor(Math.random() * 15) + 1)
    }, 10000)

    // Simulate occasional chat messages
    setInterval(() => {
      const demoMessages = [
        'Hello everyone! 👋',
        'Great stream! 🔥',
        'Thanks for sharing!',
        'Amazing content! 💯',
        'Keep it up! 👍'
      ]
      const demoUsers = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']
      const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)]
      const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)]
      
      this.simulateMessage('demo', randomMessage, randomUser)
    }, 15000 + Math.random() * 20000)
  }

  private simulateMessage(roomId: string, message: string, userName: string) {
    const callbacks = this.mockListeners['chat-message'] || []
    callbacks.forEach(cb => cb({ 
      roomId, 
      message, 
      userName, 
      timestamp: new Date().toISOString() 
    }))
  }

  private simulateViewerUpdate(count: number) {
    const callbacks = this.mockListeners['viewer-count'] || []
    callbacks.forEach(cb => cb(count))
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('🔗 WebSocket connected')
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason)
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('🚫 WebSocket connection error:', error)
      this.handleReconnect()
    })
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.socket?.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.log('📱 Max reconnection attempts reached, switching to fallback mode')
      this.socket = this.createMockSocket()
    }
  }

  // Stream Events
  joinRoom(roomId: string, userName: string) {
    this.socket?.emit('join-room', { roomId, userName })
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave-room', roomId)
  }

  sendMessage(roomId: string, message: string, userName: string) {
    this.socket?.emit('chat-message', { roomId, message, userName })
  }

  updateViewerCount(roomId: string, count: number) {
    this.socket?.emit('viewer-count', { roomId, count })
  }

  startRecording(roomId: string) {
    this.socket?.emit('start-recording', roomId)
  }

  stopRecording(roomId: string) {
    this.socket?.emit('stop-recording', roomId)
  }

  // Event Listeners
  onMessage(callback: (data: any) => void) {
    this.socket?.on('chat-message', callback)
  }

  onViewerUpdate(callback: (count: number) => void) {
    this.socket?.on('viewer-count', callback)
  }

  onUserJoined(callback: (user: any) => void) {
    this.socket?.on('user-joined', callback)
  }

  onUserLeft(callback: (user: any) => void) {
    this.socket?.on('user-left', callback)
  }

  onRecordingStarted(callback: (data: any) => void) {
    this.socket?.on('recording-started', callback)
  }

  onRecordingStopped(callback: (data: any) => void) {
    this.socket?.on('recording-stopped', callback)
  }

  // WebRTC Signaling
  sendOffer(roomId: string, offer: RTCSessionDescriptionInit, targetId: string) {
    this.socket?.emit('webrtc-offer', { roomId, offer, targetId })
  }

  sendAnswer(roomId: string, answer: RTCSessionDescriptionInit, targetId: string) {
    this.socket?.emit('webrtc-answer', { roomId, answer, targetId })
  }

  sendIceCandidate(roomId: string, candidate: RTCIceCandidate, targetId: string) {
    this.socket?.emit('webrtc-ice-candidate', { roomId, candidate, targetId })
  }

  onWebRTCOffer(callback: (data: any) => void) {
    this.socket?.on('webrtc-offer', callback)
  }

  onWebRTCAnswer(callback: (data: any) => void) {
    this.socket?.on('webrtc-answer', callback)
  }

  onWebRTCIceCandidate(callback: (data: any) => void) {
    this.socket?.on('webrtc-ice-candidate', callback)
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

// Singleton instance
const websocketService = new WebSocketService()
export default websocketService