'use client'

import { motion } from 'framer-motion'
import { CheckCircleIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'

interface UploadProgressProps {
  progress: number
  fileName: string
  isComplete: boolean
}

export default function UploadProgress({ progress, fileName, isComplete }: UploadProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg"
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isComplete ? 'bg-green-100' : 'bg-indigo-100'
        }`}>
          {isComplete ? (
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          ) : (
            <CloudArrowUpIcon className="w-6 h-6 text-indigo-600" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">
            {isComplete ? 'Upload Complete!' : 'Uploading...'}
          </h3>
          <p className="text-sm text-gray-500 truncate">{fileName}</p>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">{Math.round(progress)}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isComplete 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : 'bg-gradient-to-r from-indigo-500 to-purple-600'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Upload Speed & ETA */}
      {!isComplete && (
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Uploading to secure cloud storage...</span>
          <span>{progress < 100 ? 'Processing...' : 'Finalizing...'}</span>
        </div>
      )}
    </motion.div>
  )
}