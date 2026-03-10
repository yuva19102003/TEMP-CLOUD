'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { uploadFile } from '@/lib/auth'
import { formatFileSize } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  CloudArrowUpIcon, 
  ClockIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  RocketLaunchIcon 
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [shareCode, setShareCode] = useState('')
  const [maxDownloads, setMaxDownloads] = useState<number>(10)
  const [expiryHours, setExpiryHours] = useState<number>(24)
  const router = useRouter()

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0]
    
    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size must be less than 100MB')
      return
    }

    setUploadedFile(file)
    setUploading(true)

    try {
      const result = await uploadFile(file, maxDownloads, expiryHours)
      
      if (result.success && result.shareCode) {
        setShareCode(result.shareCode)
        toast.success('🎉 File uploaded successfully!')
      } else {
        toast.error(result.error || 'Upload failed')
      }
    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareCode)
    toast.success('📋 Share code copied to clipboard!')
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setShareCode('')
  }

  if (shareCode) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="max-w-lg w-full animate-fade-in">
          <div className="card">
            <div className="card-body text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-gentle">
                <ShieldCheckIcon className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Upload Complete! 🎉</h2>
              <p className="text-gray-600 mb-8">Your file is ready to share securely</p>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8">
                <p className="text-sm font-medium text-gray-700 mb-3">Share Code</p>
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="code-display">
                    {shareCode}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-indigo-600 hover:text-indigo-700"
                    title="Copy to clipboard"
                  >
                    <ShareIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">File</div>
                    <div className="truncate">{uploadedFile?.name}</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">Size</div>
                    <div>{uploadedFile ? formatFileSize(uploadedFile.size) : ''}</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">Max Downloads</div>
                    <div>{maxDownloads}</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">Expires</div>
                    <div>{expiryHours}h</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/download?code=${shareCode}`)}
                  className="w-full btn-success flex items-center justify-center space-x-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span>Test Download</span>
                </button>
                <button
                  onClick={resetUpload}
                  className="w-full btn-secondary"
                >
                  Upload Another File
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="glass-effect border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <CloudArrowUpIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">TempCloud</h1>
            </div>
            <button
              onClick={() => router.push('/download')}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-pulse-slow">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-5xl font-bold text-white mb-6">
            Share Files <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Instantly</span> & Securely
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Upload any file, get a unique code, and share it safely. Files auto-delete after expiry for maximum security.
          </p>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Upload Area */}
          <div className="lg:col-span-2">
            <div className="card animate-slide-up">
              <div className="card-header">
                <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <RocketLaunchIcon className="w-6 h-6 text-indigo-600" />
                  <span>Upload Your File</span>
                </h3>
              </div>
              <div className="card-body">
                <div
                  {...getRootProps()}
                  className={`upload-zone ${isDragActive ? 'active' : ''}`}
                >
                  <input {...getInputProps()} />
                  
                  {uploading ? (
                    <div className="space-y-6">
                      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-indigo-900 mb-2">Uploading your file...</p>
                        <div className="progress-bar">
                          <div className="progress-fill w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                        <CloudArrowUpIcon className="w-10 h-10 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900 mb-2">
                          {isDragActive ? '🎯 Drop your file here!' : '📁 Drag & drop your file here'}
                        </p>
                        <p className="text-gray-600">or click to browse • Max 100MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-bold text-gray-900">⚙️ Settings</h3>
              </div>
              <div className="card-body space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Max Downloads
                  </label>
                  <select
                    value={maxDownloads}
                    onChange={(e) => setMaxDownloads(Number(e.target.value))}
                    className="input-field"
                  >
                    <option value={1}>1 download</option>
                    <option value={5}>5 downloads</option>
                    <option value={10}>10 downloads</option>
                    <option value={25}>25 downloads</option>
                    <option value={50}>50 downloads</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Expires After
                  </label>
                  <select
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(Number(e.target.value))}
                    className="input-field"
                  >
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={72}>3 days</option>
                    <option value={168}>1 week</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="feature-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">🔒 Secure & Private</h3>
            <p className="text-gray-600 text-center">Files are encrypted and automatically deleted after expiry</p>
          </div>
          
          <div className="feature-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">⏰ Temporary Storage</h3>
            <p className="text-gray-600 text-center">Set custom expiry times and download limits</p>
          </div>
          
          <div className="feature-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShareIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">🚀 Easy Sharing</h3>
            <p className="text-gray-600 text-center">Share files with simple 6-character codes</p>
          </div>
        </div>
      </div>
    </div>
  )
}