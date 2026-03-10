'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getFileByCode, downloadFile, FileShareData } from '@/lib/auth'
import { formatFileSize } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  CloudArrowDownIcon, 
  DocumentIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline'

export default function DownloadPage() {
  const [shareCode, setShareCode] = useState('')
  const [fileData, setFileData] = useState<FileShareData | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setShareCode(code.toUpperCase())
      handleSearch(code)
    }
  }, [searchParams])

  const handleSearch = async (code: string) => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-character code')
      return
    }

    setLoading(true)
    setError('')
    setFileData(null)

    try {
      const data = await getFileByCode(code.toUpperCase())
      
      if (data) {
        setFileData(data)
      } else {
        setError('File not found, expired, or download limit reached')
      }
    } catch (err) {
      setError('Failed to find file')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!fileData) return

    setDownloading(true)
    
    try {
      const result = await downloadFile(fileData.share_code)
      
      if (result.success && result.url) {
        // Automatically trigger download
        const link = document.createElement('a')
        link.href = result.url
        link.download = fileData.file_name
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        setDownloadSuccess(true)
        toast.success('🎉 Download started successfully!')
        
        // Refresh file data to show updated download count
        setTimeout(() => {
          handleSearch(fileData.share_code)
        }, 1000)
      } else {
        toast.error(result.error || 'Download failed')
      }
    } catch (err) {
      toast.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="glass-effect border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <CloudArrowDownIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">TempCloud</h1>
            </div>
            <button
              onClick={() => router.push('/')}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Upload File</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-pulse-slow">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Download Your File
          </h2>
          <p className="text-white/80 text-lg">
            Enter the 6-character share code to access your file
          </p>
        </div>

        {/* Search Form */}
        <div className="card mb-8 animate-slide-up">
          <div className="card-body">
            <div className="space-y-6">
              <div>
                <label htmlFor="shareCode" className="block text-sm font-semibold text-gray-700 mb-3">
                  Share Code
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    id="shareCode"
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    className="flex-1 input-field font-mono text-lg text-center tracking-wider"
                  />
                  <button
                    onClick={() => handleSearch(shareCode)}
                    disabled={loading || shareCode.length !== 6}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-8"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Searching...</span>
                      </div>
                    ) : (
                      'Find File'
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 animate-fade-in">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* File Info */}
        {fileData && (
          <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="card-body">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <DocumentIcon className="w-8 h-8 text-indigo-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 truncate mb-2">
                    {fileData.file_name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {formatFileSize(fileData.file_size)} • {fileData.file_type || 'Unknown type'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-sm font-medium text-gray-700 mb-1">Downloads</div>
                      <div className="text-lg font-bold text-gray-900">
                        {fileData.download_count}
                        {fileData.max_downloads && ` / ${fileData.max_downloads}`}
                      </div>
                    </div>
                    
                    {fileData.expires_at && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-sm font-medium text-gray-700 mb-1">Expires</div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatTimeRemaining(fileData.expires_at)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Download Progress */}
                  {fileData.max_downloads && (
                    <div className="mb-6">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Download Progress</span>
                        <span>{Math.round((fileData.download_count / fileData.max_downloads) * 100)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min((fileData.download_count / fileData.max_downloads) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {downloadSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center space-x-3 mb-6 animate-fade-in">
                      <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                      <span className="text-emerald-700 font-medium">Download completed successfully! 🎉</span>
                    </div>
                  )}

                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Preparing Download...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <CloudArrowDownIcon className="w-5 h-5" />
                        <span>Download File Automatically</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="bg-blue-50/90 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50">
            <div className="flex items-start space-x-3">
              <ClockIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">⏰ Temporary Files</h4>
                <p className="text-sm text-blue-700">
                  Files are automatically deleted after they expire or reach their download limit. 
                  The download will start automatically when you click the button above!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}