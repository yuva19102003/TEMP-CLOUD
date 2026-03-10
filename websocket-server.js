// Simple WebSocket Server for TempCloud Streaming
// Run this with: node websocket-server.js

const { Server } = require('socket.io')
const http = require('http')

const server = http.createServer()
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://your-domain.com", "*"],
    methods: ["GET", "POST"]
  }
})

// Store room information
const rooms = new Map()
const userSockets = new Map()

io.on('connection', (socket) => {
  console.log(`🔗 User connected: ${socket.id}`)

  // Join room
  socket.on('join-room', (data) => {
    const { roomId, userName } = data
    
    socket.join(roomId)
    socket.roomId = roomId
    socket.userName = userName
    
    userSockets.set(socket.id, { roomId, userName })
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        users: new Set(),
        messages: [],
        isRecording: false
      })
    }
    
    const room = rooms.get(roomId)
    room.users.add(userName)
    
    // Notify others about new user
    socket.to(roomId).emit('user-joined', { userName })
    
    // Send current viewer count
    io.to(roomId).emit('viewer-count', room.users.size)
    
    console.log(`👤 ${userName} joined room ${roomId}`)
  })

  // Leave room
  socket.on('leave-room', (roomId) => {
    handleUserLeave(socket, roomId)
  })

  // Chat message
  socket.on('chat-message', (data) => {
    const { roomId, message, userName } = data
    
    const messageData = {
      id: `${Date.now()}-${Math.random()}`,
      roomId,
      message,
      userName,
      timestamp: new Date().toISOString()
    }
    
    // Store message in room
    const room = rooms.get(roomId)
    if (room) {
      room.messages.push(messageData)
      // Keep only last 100 messages
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100)
      }
    }
    
    // Broadcast to all users in room
    io.to(roomId).emit('chat-message', messageData)
    
    console.log(`💬 ${userName} in ${roomId}: ${message}`)
  })

  // Recording events
  socket.on('start-recording', (roomId) => {
    const room = rooms.get(roomId)
    if (room) {
      room.isRecording = true
      io.to(roomId).emit('recording-started', { roomId })
      console.log(`🎥 Recording started in room ${roomId}`)
    }
  })

  socket.on('stop-recording', (roomId) => {
    const room = rooms.get(roomId)
    if (room) {
      room.isRecording = false
      io.to(roomId).emit('recording-stopped', { roomId })
      console.log(`🛑 Recording stopped in room ${roomId}`)
    }
  })

  // WebRTC Signaling
  socket.on('webrtc-offer', (data) => {
    socket.to(data.targetId).emit('webrtc-offer', {
      offer: data.offer,
      senderId: socket.id
    })
  })

  socket.on('webrtc-answer', (data) => {
    socket.to(data.targetId).emit('webrtc-answer', {
      answer: data.answer,
      senderId: socket.id
    })
  })

  socket.on('webrtc-ice-candidate', (data) => {
    socket.to(data.targetId).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      senderId: socket.id
    })
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    const userData = userSockets.get(socket.id)
    if (userData) {
      handleUserLeave(socket, userData.roomId)
    }
    console.log(`❌ User disconnected: ${socket.id}`)
  })
})

function handleUserLeave(socket, roomId) {
  if (!roomId) return
  
  const userData = userSockets.get(socket.id)
  if (!userData) return
  
  const { userName } = userData
  const room = rooms.get(roomId)
  
  if (room) {
    room.users.delete(userName)
    
    // Notify others about user leaving
    socket.to(roomId).emit('user-left', { userName })
    
    // Send updated viewer count
    io.to(roomId).emit('viewer-count', room.users.size)
    
    // Clean up empty rooms
    if (room.users.size === 0) {
      rooms.delete(roomId)
      console.log(`🗑️ Cleaned up empty room ${roomId}`)
    }
  }
  
  socket.leave(roomId)
  userSockets.delete(socket.id)
  
  console.log(`👋 ${userName} left room ${roomId}`)
}

// Cleanup function
setInterval(() => {
  // Clean up old messages and empty rooms
  for (const [roomId, room] of rooms.entries()) {
    if (room.users.size === 0) {
      rooms.delete(roomId)
    }
  }
}, 60000) // Every minute

const PORT = process.env.WS_PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`)
  console.log(`📡 Ready for real-time streaming connections`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 WebSocket server shutting down...')
  server.close(() => {
    console.log('✅ WebSocket server closed')
    process.exit(0)
  })
})

module.exports = { io, server }