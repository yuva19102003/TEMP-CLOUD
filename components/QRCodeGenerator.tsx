'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'
import { QrCodeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface QRCodeGeneratorProps {
  shareCode: string
  downloadUrl?: string
}

export default function QRCodeGenerator({ shareCode, downloadUrl }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = downloadUrl || `${window.location.origin}/download?code=${shareCode}`
        const qrUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: '#4f46e5',
            light: '#ffffff'
          }
        })
        setQrCodeUrl(qrUrl)
      } catch (error) {
        console.error('QR Code generation failed:', error)
      } finally {
        setLoading(false)
      }
    }

    if (shareCode) {
      generateQR()
    }
  }, [shareCode, downloadUrl])

  const downloadQR = () => {
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `tempcloud-${shareCode}.png`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-6 text-center shadow-lg"
    >
      <div className="flex items-center justify-center space-x-2 mb-4">
        <QrCodeIcon className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">QR Code</h3>
      </div>
      
      {qrCodeUrl && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 inline-block">
            <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
          </div>
          <button
            onClick={downloadQR}
            className="flex items-center justify-center space-x-2 text-sm text-indigo-600 hover:text-indigo-700 transition-colors mx-auto"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Download QR</span>
          </button>
        </div>
      )}
    </motion.div>
  )
}