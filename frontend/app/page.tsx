'use client'

import CVUpload from '@/components/CVUpload'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import ProgressTracker from '@/components/ProgressTracker'
import RequirementsInput from '@/components/RequirementsInput'
import ResultsDisplay from '@/components/ResultsDisplay'
import { CVMatchResult, ProgressUpdate } from '@/types'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function Home() {
  const [files, setFiles] = useState<File[]>([])
  const [requirements, setRequirements] = useState('')
  const [results, setResults] = useState<CVMatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<Record<string, ProgressUpdate>>({})
  const [showProgress, setShowProgress] = useState(false)

  const handleFilter = async () => {
    if (files.length === 0) {
      setError('Please upload at least one CV file')
      return
    }

    if (!requirements.trim()) {
      setError('Please enter job requirements')
      return
    }

    setLoading(true)
    setError(null)
    setShowProgress(true)
    setProgress({})
    setResults([])

    try {
      const formData = new FormData()
      formData.append('requirements', requirements)

      files.forEach((file) => {
        formData.append('files', file)
      })

      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

      // Use SSE endpoint for progress updates
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
      })

      if (!response.ok) {
        throw new Error('Failed to start processing')
      }

      // Handle Server-Sent Events
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'progress') {
                const update: ProgressUpdate = data.data
                setProgress((prev) => {
                  const updated = {
                    ...prev,
                    [update.filename]: update
                  }
                  return updated
                })
              } else if (data.type === 'results') {
                setResults(data.data.results || [])
                setLoading(false)
                // Keep progress visible for a moment, then hide
                setTimeout(() => {
                  setShowProgress(false)
                }, 2000)
              } else if (data.type === 'error') {
                throw new Error(data.message || 'An error occurred')
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setResults([])
      setLoading(false)
      setShowProgress(false)
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleClearAll = () => {
    setFiles([])
    setRequirements('')
    setResults([])
    setError(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />

      <main className="flex-1 py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-dosiai-primary to-dosiai-secondary rounded-2xl shadow-lg mb-4">
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
              AI-Powered CV Filter
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Upload multiple CVs and filter them against job requirements using advanced AI technology
            </p>
            <p className="text-sm sm:text-base text-dosiai-primary dark:text-dosiai-accent mt-2 font-medium">
              Powered by <a href="https://dosibridge.com" target="_blank" rel="noopener noreferrer" className="hover:underline">dosibridge.com</a>
            </p>
          </div>

          {/* Requirements Input */}
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
            <RequirementsInput
              value={requirements}
              onChange={setRequirements}
              disabled={loading}
            />
          </div>

          {/* File Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
            <CVUpload
              files={files}
              onFilesChange={setFiles}
              onRemoveFile={handleRemoveFile}
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button
              onClick={handleFilter}
              disabled={loading || files.length === 0 || !requirements.trim()}
              className="flex-1 bg-gradient-to-r from-dosiai-primary to-dosiai-secondary hover:from-dosiai-primary/90 hover:to-dosiai-secondary/90 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Filter CVs'
              )}
            </button>
            {(files.length > 0 || results.length > 0) && (
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors duration-200"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Progress Tracker */}
          {showProgress && files.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <ProgressTracker progress={progress} files={files} />
            </div>
          )}

          {/* Results Display */}
          {results.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
              <ResultsDisplay
                results={results}
                onResultsChange={setResults}
              />
            </div>
          )}

          {/* Loading Overlay */}
          {loading && !showProgress && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-xl max-w-sm w-full">
                <div className="flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dosiai-primary"></div>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    Processing CVs...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

