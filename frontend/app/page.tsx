'use client'

import { useState } from 'react'
import CVUpload from '@/components/CVUpload'
import RequirementsInput from '@/components/RequirementsInput'
import ResultsDisplay from '@/components/ResultsDisplay'
import { CVMatchResult } from '@/types'

export default function Home() {
  const [files, setFiles] = useState<File[]>([])
  const [requirements, setRequirements] = useState('')
  const [results, setResults] = useState<CVMatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    try {
      const formData = new FormData()
      formData.append('requirements', requirements)
      
      files.forEach((file) => {
        formData.append('files', file)
      })

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to process CVs')
      }

      const data = await response.json()
      setResults(data.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setResults([])
    } finally {
      setLoading(false)
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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            CV Filter Tool
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Upload CVs and filter them against job requirements using AI
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <RequirementsInput
            value={requirements}
            onChange={setRequirements}
            disabled={loading}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <CVUpload
            files={files}
            onFilesChange={setFiles}
            onRemoveFile={handleRemoveFile}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleFilter}
            disabled={loading || files.length === 0 || !requirements.trim()}
            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            {loading ? 'Processing...' : 'Filter CVs'}
          </button>
          {(files.length > 0 || results.length > 0) && (
            <button
              onClick={handleClearAll}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors duration-200"
            >
              Clear All
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <ResultsDisplay
              results={results}
              onResultsChange={setResults}
            />
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Processing CVs...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

