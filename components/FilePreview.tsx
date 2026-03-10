'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  DocumentTextIcon, 
  PhotoIcon, 
  FilmIcon, 
  MusicalNoteIcon,
  DocumentIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface FilePreviewProps {
  file: File
  onRemove: () => void
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return PhotoIcon
    if (type.startsWith('video/')) return FilmIcon
    if (type.startsWith('audio/')) return MusicalNoteIcon
    if (type.includes('text') || type.includes('json') || type.includes('xml')) return DocumentTextIcon
    return DocumentIcon
  }

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'text-green-600 bg-green-100'
    if (type.startsWith('video/')) return 'text-blue-600 bg-blue-100'
    if (type.startsWith('audio/')) return 'text-purple-600 bg-purple-100'
    if (type.includes('text')) return 'text-orange-600 bg-orange-100'
    return 'text-gray-600 bg-gray-100'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handlePreview = () => {
    if (file.type.startsWith('image/') || file.type.startsWith('text/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setShowPreview(true)
    }
  }

  const FileIcon = getFileIcon(file.type)
  const colorClass = getFileTypeColor(file.type)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
      >
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
            <FileIcon className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">{file.name}</h4>
            <p className="text-xs text-gray-500 mt-1">
              {formatFileSize(file.size)} • {file.type || 'Unknown type'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {(file.type.startsWith('image/') || file.type.startsWith('text/')) && (
              <button
                onClick={handlePreview}
                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-gray-50"
                title="Preview file"
              >
                <EyeIcon className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={onRemove}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-50"
              title="Remove file"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Preview Modal */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{file.name}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            {file.type.startsWith('image/') ? (
              <img src={previewUrl} alt={file.name} className="max-w-full h-auto rounded-lg" />
            ) : file.type.startsWith('text/') ? (
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm max-h-96 overflow-auto">
                <pre>{previewUrl}</pre>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </>
  )
}