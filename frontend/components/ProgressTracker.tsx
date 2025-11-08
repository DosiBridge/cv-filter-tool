'use client'

import { ProgressUpdate } from '@/types'
import { FileText, CheckCircle2, XCircle, Loader2, File, AlertCircle } from 'lucide-react'
import { useMemo } from 'react'

interface ProgressTrackerProps {
  progress: Record<string, ProgressUpdate>
  files: File[]
}

export default function ProgressTracker({ progress, files }: ProgressTrackerProps) {
  // Calculate overall progress based on completed files
  const overallProgress = useMemo(() => {
    if (files.length === 0) return 0
    
    // Count completed files (100% progress)
    const completedFiles = files.filter(file => {
      const fileProgress = progress[file.name]
      return fileProgress?.status === 'completed' || fileProgress?.progress >= 100
    }).length
    
    // Calculate overall as: (completed files / total files) * 100
    // Plus average progress of files currently being processed
    const inProgressFiles = files.filter(file => {
      const fileProgress = progress[file.name]
      return fileProgress && 
             fileProgress.status !== 'completed' && 
             fileProgress.status !== 'error' &&
             fileProgress.progress < 100
    })
    
    const inProgressSum = inProgressFiles.reduce((sum, file) => {
      const fileProgress = progress[file.name]
      return sum + (fileProgress?.progress || 0)
    }, 0)
    
    const inProgressAvg = inProgressFiles.length > 0 ? inProgressSum / inProgressFiles.length : 0
    
    // Overall = (completed * 100 + in_progress * avg_progress) / total
    const totalProgress = (completedFiles * 100) + (inProgressAvg * inProgressFiles.length)
    return Math.round(totalProgress / files.length)
  }, [progress, files])

  // Get overall status
  const overallStatus = useMemo(() => {
    const statuses = files.map(file => progress[file.name]?.status || 'processing')
    if (statuses.every(s => s === 'completed')) return 'completed'
    if (statuses.some(s => s === 'error')) return 'error'
    if (statuses.some(s => s === 'analyzing')) return 'analyzing'
    return 'processing'
  }, [progress, files])

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

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'analyzing':
        return 'bg-blue-500'
      default:
        return 'bg-primary-500'
    }
  }

  const getOverallStatusText = () => {
    switch (overallStatus) {
      case 'completed':
        return 'All files processed successfully'
      case 'error':
        return 'Some files failed to process'
      case 'analyzing':
        return 'Analyzing CVs with AI...'
      default:
        return 'Processing files...'
    }
  }

  const completedCount = files.filter(
    file => progress[file.name]?.status === 'completed'
  ).length

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Processing Progress
      </h3>

      {/* Overall Progress Bar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {overallStatus === 'completed' ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : overallStatus === 'error' ? (
              <AlertCircle className="h-6 w-6 text-red-500" />
            ) : (
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Overall Progress
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getOverallStatusText()} ({completedCount}/{files.length} files completed)
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {overallProgress}%
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getOverallStatusColor()}`}
            style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
          />
        </div>
      </div>

      {/* Individual File Progress */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Individual Files ({completedCount}/{files.length} completed)
        </h4>
        {files.map((file, index) => {
          const fileProgress = progress[file.name] || {
            filename: file.name,
            status: 'processing',
            progress: 0,
            current_step: 'Waiting to process...'
          }

          // Determine if this file is currently being processed
          const isActive = fileProgress.status === 'processing' || fileProgress.status === 'analyzing'
          const isCompleted = fileProgress.status === 'completed' || fileProgress.progress >= 100
          const hasError = fileProgress.status === 'error'

          return (
            <div
              key={index}
              className={`border rounded-lg p-4 transition-all ${
                isActive
                  ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                  : isCompleted
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                  : hasError
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
              } hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getStatusIcon(fileProgress.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                        {isActive && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                            Processing...
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {fileProgress.current_step}
                    </p>
                  </div>
                </div>
                <div className="ml-4 text-right flex-shrink-0">
                  <span className={`text-sm font-semibold ${
                    isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : hasError
                      ? 'text-red-600 dark:text-red-400'
                      : isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {Math.round(Math.min(100, Math.max(0, fileProgress.progress)))}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mt-2">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ease-out ${getStatusColor(
                    fileProgress.status
                  )} ${
                    isActive ? 'animate-pulse' : ''
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, fileProgress.progress))}%` }}
                />
              </div>
              {isCompleted && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Analysis complete
                </p>
              )}
              {hasError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <XCircle className="h-3 w-3 mr-1" />
                  {fileProgress.current_step}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

