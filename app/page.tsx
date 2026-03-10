'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import { uploadFile } from '@/lib/auth'
import { formatFileSize } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  CloudArrowUpIcon, 
  ClockIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  SparklesIcon,
  RocketLaunchIcon,
  Cog6ToothIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import FilePreview from '@/components/FilePreview'
import UploadProgress from '@/components/UploadProgress'
import ShareOptions from '@/components/ShareOptions'

export default function HomePage() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [shareCode, setShareCode] = useState('')
  const [maxDownloads, setMaxDownloads] = useState<number>(10)
  const [expiryHours, setExpiryHours] = useState<number>(24)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0]
    
    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('📁 File size must be less than 100MB')
      return
    }

    setSelectedFile(file)
    toast.success(`📁 ${file.name} selected for upload`)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB
    accept: {
      '*/*': []
    }
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadProgress(0)

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 200)

    try {
      const result = await uploadFile(selectedFile, maxDownloads, expiryHours)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      if (result.success && result.shareCode) {
        setTimeout(() => {
          setShareCode(result.shareCode!)
          setShowConfetti(true)
          toast.success('🎉 File uploaded successfully!')
          
          // Stop confetti after 3 seconds
          setTimeout(() => setShowConfetti(false), 3000)
        }, 500)
      } else {
        toast.error(result.error || 'Upload failed')
        setUploading(false)
        setUploadProgress(0)
      }
    } catch (error) {
      clearInterval(progressInterval)
      toast.error('Upload failed')
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setShareCode('')
    setUploading(false)
    setUploadProgress(0)
    setShowConfetti(false)
  }

  const removeFile = () => {
    setSelectedFile(null)
    toast.success('File removed')
  }

  if (shareCode) {
    return (
      <div className="min-h-screen gradient-bg relative">
        {showConfetti && typeof window !== 'undefined' && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
          />
        )}
        
        <div className="max-w-2xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <ShieldCheckIcon className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              Upload Complete! 🎉
            </h1>
            <p className="text-white/80 text-lg">
              Your file is ready to share securely
            </p>
          </motion.div>

          <div className="card">
            <div className="card-body">
              <ShareOptions shareCode={shareCode} fileName={selectedFile?.name || 'Unknown'} />
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="font-semibold text-gray-900">File Size</div>
                    <div>{selectedFile ? formatFileSize(selectedFile.size) : 'Unknown'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="font-semibold text-gray-900">Max Downloads</div>
                    <div>{maxDownloads}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="font-semibold text-gray-900">Expires In</div>
                    <div>{expiryHours}h</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="font-semibold text-gray-900">File Type</div>
                    <div>{selectedFile?.type || 'Unknown'}</div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push(`/download?code=${shareCode}`)}
                    className="flex-1 btn-success flex items-center justify-center"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    Test Download
                  </button>
                  <button
                    onClick={resetUpload}
                    className="flex-1 btn-secondary"
                  >
                    Upload Another
                  </button>
                </div>
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
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
                <CloudArrowUpIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">TempCloud</h1>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <button
                onClick={() => router.push('/stream')}
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                Live Stream
              </button>
              <button
                onClick={() => router.push('/playlist')}
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                Playlist
              </button>
              <button
                onClick={() => router.push('/analytics')}
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                Analytics
              </button>
              <button
                onClick={() => router.push('/download')}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <motion.div 
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
            >
              <SparklesIcon className="w-8 h-8 text-white" />
            </motion.div>
          </div>
          <h2 className="text-5xl font-bold text-white mb-6">
            Share Files <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Instantly</span> & Securely
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Upload any file, get a unique code, and share it safely. Files auto-delete after expiry for maximum security.
          </p>
        </motion.div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="card-header">
                <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <RocketLaunchIcon className="w-6 h-6 text-indigo-600" />
                  <span>Upload Your File</span>
                </h3>
              </div>
              <div className="card-body">
                {!selectedFile ? (
                  <div
                    {...getRootProps()}
                    className={`upload-zone ${isDragActive ? 'active' : ''}`}
                  >
                    <input {...getInputProps()} />
                    
                    <motion.div 
                      animate={{ y: isDragActive ? -5 : 0 }}
                      className="space-y-6"
                    >
                      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                        <CloudArrowUpIcon className="w-10 h-10 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900 mb-2">
                          {isDragActive ? '🎯 Drop your file here!' : '📁 Drag & drop your file here'}
                        </p>
                        <p className="text-gray-600">or click to browse • Max 100MB</p>
                      </div>
                    </motion.div>
                  </div>
                ) : uploading ? (
                  <UploadProgress 
                    progress={uploadProgress} 
                    fileName={selectedFile.name}
                    isComplete={uploadProgress >= 100}
                  />
                ) : (
                  <div className="space-y-4">
                    <FilePreview file={selectedFile} onRemove={removeFile} />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpload}
                      className="w-full btn-primary text-lg py-4 flex items-center justify-center"
                    >
                      <CloudArrowUpIcon className="w-6 h-6 mr-2" />
                      Upload & Generate Share Code
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                    <Cog6ToothIcon className="w-5 h-5 text-indigo-600" />
                    <span>Settings</span>
                  </h3>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {showAdvanced ? 'Simple' : 'Advanced'}
                  </button>
                </div>
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
                    {showAdvanced && <option value={100}>100 downloads</option>}
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
                    {showAdvanced && (
                      <>
                        <option value={336}>2 weeks</option>
                        <option value={720}>30 days</option>
                      </>
                    )}
                  </select>
                </div>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-4 border-t border-gray-200"
                    >
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-blue-700">
                            <p className="font-medium mb-1">Advanced Settings</p>
                            <p>Higher limits available for power users. Files are automatically encrypted and secured.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: ShieldCheckIcon,
              title: '🔒 Secure & Private',
              description: 'Files are encrypted and automatically deleted after expiry',
              color: 'from-emerald-400 to-emerald-600',
              delay: 0.3
            },
            {
              icon: ClockIcon,
              title: '⏰ Temporary Storage',
              description: 'Set custom expiry times and download limits',
              color: 'from-blue-400 to-blue-600',
              delay: 0.4
            },
            {
              icon: SparklesIcon,
              title: '🚀 Easy Sharing',
              description: 'Share files with QR codes, links, and social media',
              color: 'from-purple-400 to-purple-600',
              delay: 0.5
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: feature.delay }}
              whileHover={{ y: -5 }}
              className="feature-card"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">{feature.title}</h3>
              <p className="text-gray-600 text-center">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}