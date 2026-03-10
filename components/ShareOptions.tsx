'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import toast from 'react-hot-toast'
import {
  ShareIcon,
  LinkIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  QrCodeIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import QRCodeGenerator from './QRCodeGenerator'

interface ShareOptionsProps {
  shareCode: string
  fileName: string
}

export default function ShareOptions({ shareCode, fileName }: ShareOptionsProps) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const shareUrl = `${window.location.origin}/download?code=${shareCode}`

  const handleCopy = () => {
    setCopied(true)
    toast.success('🔗 Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareViaEmail = () => {
    const subject = `File Shared: ${fileName}`
    const body = `Hi! I've shared a file with you using TempCloud.\n\nFile: ${fileName}\nShare Code: ${shareCode}\n\nDownload Link: ${shareUrl}\n\nThis link will expire automatically for security.`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  const shareViaWhatsApp = () => {
    const message = `📁 *File Shared via TempCloud*\n\n*File:* ${fileName}\n*Code:* ${shareCode}\n\n🔗 ${shareUrl}\n\n_This link expires automatically for security._`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`)
  }

  const shareViaTelegram = () => {
    const message = `📁 File Shared: ${fileName}\n\n🔑 Code: ${shareCode}\n🔗 ${shareUrl}\n\n⏰ This link expires automatically for security.`
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      {/* Share Code Display */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Code</h3>
          <div className="code-display inline-block">
            {shareCode}
          </div>
        </div>

        {/* Copy Link Button */}
        <CopyToClipboard text={shareUrl} onCopy={handleCopy}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
              copied 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-900 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            {copied ? (
              <>
                <CheckIcon className="w-5 h-5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-5 h-5" />
                <span>Copy Download Link</span>
              </>
            )}
          </motion.button>
        </CopyToClipboard>
      </div>

      {/* Share Options */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={shareViaEmail}
          className="flex flex-col items-center space-y-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <EnvelopeIcon className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">Email</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={shareViaWhatsApp}
          className="flex flex-col items-center space-y-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">WhatsApp</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={shareViaTelegram}
          className="flex flex-col items-center space-y-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <ShareIcon className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">Telegram</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowQR(!showQR)}
          className="flex flex-col items-center space-y-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
        >
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <QrCodeIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">QR Code</span>
        </motion.button>
      </div>

      {/* QR Code */}
      {showQR && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <QRCodeGenerator shareCode={shareCode} downloadUrl={shareUrl} />
        </motion.div>
      )}
    </motion.div>
  )
}