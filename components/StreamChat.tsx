'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  PaperAirplaneIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import websocketService from '@/lib/websocket'

interface Message {
  id: string
  user: string
  message: string
  timestamp: Date
  isSystem?: boolean
}

interface StreamChatProps {
  roomId: string
  userName: string
}

export default function StreamChat({ roomId, userName }: StreamChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      user: 'System',
      message: `Welcome to room ${roomId}! Chat with other viewers.`,
      timestamp: new Date(),
      isSystem: true
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([userName])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setupWebSocketListeners()
    scrollToBottom()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const setupWebSocketListeners = () => {
    // Listen for incoming messages
    websocketService.onMessage((data) => {
      const message: Message = {
        id: `${data.timestamp}-${Math.random()}`,
        user: data.userName,
        message: data.message,
        timestamp: new Date(data.timestamp)
      }
      setMessages(prev => [...prev, message])
    })

    // Listen for user join/leave events
    websocketService.onUserJoined((user) => {
      setOnlineUsers(prev => [...prev, user.userName])
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        user: 'System',
        message: `${user.userName} joined the stream`,
        timestamp: new Date(),
        isSystem: true
      }
      setMessages(prev => [...prev, systemMessage])
    })

    websocketService.onUserLeft((user) => {
      setOnlineUsers(prev => prev.filter(u => u !== user.userName))
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        user: 'System',
        message: `${user.userName} left the stream`,
        timestamp: new Date(),
        isSystem: true
      }
      setMessages(prev => [...prev, systemMessage])
    })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return

    try {
      // Send via WebSocket
      websocketService.sendMessage(roomId, newMessage.trim(), userName)
      
      // Add to local state immediately for better UX
      const message: Message = {
        id: `local-${Date.now()}`,
        user: userName,
        message: newMessage.trim(),
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, message])
      setNewMessage('')
      
      // Simulate demo responses occasionally
      if (Math.random() > 0.8) {
        setTimeout(() => {
          const responses = [
            'Great stream! 👍',
            'Hello everyone! 👋',
            'Thanks for sharing!',
            'Amazing quality!',
            'Keep it up! 🔥',
            'Nice setup! 💯',
            'Love this content! ❤️'
          ]
          const demoUsers = ['StreamFan', 'TechViewer', 'LiveWatcher', 'VideoLover', 'ChatUser']
          const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)]
          const randomResponse = responses[Math.floor(Math.random() * responses.length)]
          
          const demoMessage: Message = {
            id: `demo-${Date.now()}`,
            user: randomUser,
            message: randomResponse,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, demoMessage])
        }, 1000 + Math.random() * 4000)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="chat-container rounded-2xl shadow-2xl overflow-hidden border border-violet-500/20">
      {/* Chat Header */}
      <div 
        className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            <span className="font-semibold">Live Chat</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
              {messages.filter(m => !m.isSystem).length}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon className="w-4 h-4" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 400 }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* Online Users */}
            <div className="bg-slate-800/60 px-4 py-2 border-b border-violet-500/20">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-300">
                  {onlineUsers.length} online: {onlineUsers.slice(0, 3).join(', ')}
                  {onlineUsers.length > 3 && ` +${onlineUsers.length - 3} more`}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="h-72 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex items-start space-x-2 ${
                      message.isSystem ? 'justify-center' : ''
                    }`}
                  >
                    {!message.isSystem && (
                      <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div className={`flex-1 ${message.isSystem ? 'text-center' : ''}`}>
                      {message.isSystem ? (
                        <div className="bg-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 inline-block border border-violet-500/20">
                          {message.message}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`font-semibold text-sm ${
                              message.user === userName ? 'text-violet-300' : 'text-white'
                            }`}>
                              {message.user}
                              {message.user === userName && (
                                <span className="text-xs text-violet-400 ml-1">(You)</span>
                              )}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <div className={`chat-message ${
                            message.user === userName ? 'own' : ''
                          }`}>
                            {message.message}
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-violet-500/20 p-4 bg-slate-800/60">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-violet-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 text-white placeholder-slate-400"
                  maxLength={200}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-violet-600 hover:bg-violet-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="text-xs text-slate-500 mt-2 flex justify-between">
                <span>{newMessage.length}/200 characters</span>
                <span className="text-violet-400">Press Enter to send</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}