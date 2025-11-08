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
        return 'bg-gradient-to-r from-green-500 to-green-600'
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600'
      case 'analyzing':
        return 'bg-gradient-to-r from-dosiai-primary to-dosiai-secondary'
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500'
    }
  }

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'completed':
        return 'bg-gradient-to-r from-green-500 to-green-600'
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600'
      case 'analyzing':
        return 'bg-gradient-to-r from-dosiai-primary to-dosiai-secondary'
      default:
        return 'bg-gradient-to-r from-dosiai-primary to-dosiai-secondary'
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          Processing Progress
        </h3>
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Powered by <a href="https://dosibridge.com" target="_blank" rel="noopener noreferrer" className="text-dosiai-primary hover:underline">dosibridge.com</a>
        </span>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-3">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {overallStatus === 'completed' ? (
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0" />
            ) : overallStatus === 'error' ? (
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0" />
            ) : (
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-dosiai-primary animate-spin flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                Overall Progress
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {getOverallStatusText()} ({completedCount}/{files.length} files completed)
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {overallProgress}%
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 sm:h-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-linear ${getOverallStatusColor()}`}
            style={{ 
              width: `${Math.min(100, Math.max(0, overallProgress))}%`,
              minWidth: overallProgress > 0 ? '2px' : '0px',
              transition: 'width 0.3s linear'
            }}
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
            current_step: 'Queued for processing...'
          }

          // Determine if this file is currently being processed
          const isActive = fileProgress.status === 'processing' || fileProgress.status === 'analyzing'
          const isCompleted = fileProgress.status === 'completed' || fileProgress.progress >= 100
          const hasError = fileProgress.status === 'error'

          return (
            <div
              key={index}
              className={`border rounded-lg p-3 sm:p-4 transition-all ${
                isActive
                  ? 'border-dosiai-primary/30 dark:border-dosiai-primary/50 bg-dosiai-light/50 dark:bg-dosiai-primary/10 shadow-sm'
                  : isCompleted
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                  : hasError
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
              } hover:shadow-md`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                    {getStatusIcon(fileProgress.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <File className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">
                        {file.name}
                      </p>
                      {isActive && (
                        <span className="text-xs text-dosiai-primary dark:text-dosiai-accent animate-pulse whitespace-nowrap">
                          Processing...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 sm:line-clamp-1">
                      {fileProgress.current_step}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-left sm:text-right">
                  <span className={`text-base sm:text-lg font-bold ${
                    isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : hasError
                      ? 'text-red-600 dark:text-red-400'
                      : isActive
                      ? 'text-dosiai-primary dark:text-dosiai-accent'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {Math.round(Math.min(100, Math.max(0, fileProgress.progress)))}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 sm:h-3 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-linear ${getStatusColor(
                    fileProgress.status
                  )} ${
                    isActive ? '' : ''
                  }`}
                  style={{ 
                    width: `${Math.min(100, Math.max(0, fileProgress.progress))}%`,
                    minWidth: fileProgress.progress > 0 ? '2px' : '0px',
                    transition: 'width 0.3s linear'
                  }}
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

