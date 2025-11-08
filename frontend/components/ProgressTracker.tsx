'use client'

import { ProgressUpdate } from '@/types'
import { FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface ProgressTrackerProps {
  progress: Record<string, ProgressUpdate>
  files: File[]
}

export default function ProgressTracker({ progress, files }: ProgressTrackerProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'analyzing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'analyzing':
        return 'bg-blue-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Processing Progress
      </h3>
      {files.map((file, index) => {
        const fileProgress = progress[file.name] || {
          filename: file.name,
          status: 'processing',
          progress: 0,
          current_step: 'Waiting to process...'
        }

        return (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getStatusIcon(fileProgress.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {fileProgress.current_step}
                  </p>
                </div>
              </div>
              <div className="ml-4 text-right">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {Math.round(fileProgress.progress)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mt-2">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${getStatusColor(
                  fileProgress.status
                )}`}
                style={{ width: `${Math.min(100, Math.max(0, fileProgress.progress))}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

