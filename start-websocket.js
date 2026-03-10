#!/usr/bin/env node

// Simple script to start the WebSocket server
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Starting TempCloud WebSocket Server...')

// Check if websocket-server.js exists
const serverPath = path.join(__dirname, 'websocket-server.js')
if (!fs.existsSync(serverPath)) {
  console.error('❌ websocket-server.js not found!')
  console.log('💡 Make sure you have the websocket-server.js file in your project root')
  process.exit(1)
}

// Check if socket.io is installed
try {
  require.resolve('socket.io')
} catch (e) {
  console.error('❌ socket.io not installed!')
  console.log('💡 Run: npm install socket.io')
  console.log('💡 Or copy websocket-package.json to package.json and run npm install')
  process.exit(1)
}

// Start the server
const server = spawn('node', ['websocket-server.js'], {
  stdio: 'inherit',
  cwd: __dirname
})

server.on('error', (err) => {
  console.error('❌ Failed to start WebSocket server:', err.message)
  process.exit(1)
})

server.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ WebSocket server exited with code ${code}`)
  } else {
    console.log('✅ WebSocket server stopped')
  }
})

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...')
  server.kill('SIGINT')
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down WebSocket server...')
  server.kill('SIGTERM')
})

console.log('📡 WebSocket server starting on port 3001...')
console.log('🔗 Your Next.js app can now connect to ws://localhost:3001')
console.log('⚡ Real-time features are now available!')
console.log('🛑 Press Ctrl+C to stop the server')