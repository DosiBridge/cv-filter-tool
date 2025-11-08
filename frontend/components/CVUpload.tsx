'use client'

import { useCallback } from 'react'
import { Upload, X, FileText } from 'lucide-react'

interface CVUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  onRemoveFile: (index: number) => void
  disabled?: boolean
}

export default function CVUpload({
  files,
  onFilesChange,
  onRemoveFile,
  disabled = false,
}: CVUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (disabled) return

      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (file) =>
          file.type === 'application/pdf' ||
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )

      if (droppedFiles.length > 0) {
        onFilesChange([...files, ...droppedFiles])
      }
    },
    [files, onFilesChange, disabled]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return

      const selectedFiles = Array.from(e.target.files || []).filter(
        (file) =>
          file.type === 'application/pdf' ||
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )

      if (selectedFiles.length > 0) {
        onFilesChange([...files, ...selectedFiles])
      }

      // Reset input
      e.target.value = ''
    },
    [files, onFilesChange, disabled]
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Upload CVs
      </h2>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          disabled
            ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 cursor-not-allowed'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 bg-gray-50 dark:bg-gray-900/50 cursor-pointer'
        }`}
      >
      <input
        type="file"
        id="file-upload"
        multiple
        accept=".pdf,.docx"
        onChange={handleFileInput}
        disabled={disabled}
        className="hidden"
      />
        <label
          htmlFor="file-upload"
          className={`cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Drag and drop CV files here, or click to select
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supported formats: PDF, DOCX
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Uploaded Files ({files.length})
          </h3>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRemoveFile(index)}
                disabled={disabled}
                className="ml-4 p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

