'use client'

import { X, Download, FileText } from 'lucide-react'

interface PDFPreviewProps {
  fileId: string
  filename: string
  onClose: () => void
}

export default function PDFPreview({ fileId, filename, onClose }: PDFPreviewProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const previewUrl = `${apiUrl}/api/file/${fileId}/preview`
  const downloadUrl = `${apiUrl}/api/file/${fileId}`
  const isWordFile = filename.toLowerCase().endsWith('.docx') || filename.toLowerCase().endsWith('.doc')
  const isPdfFile = filename.toLowerCase().endsWith('.pdf')

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preview: {filename}
            </h3>
            {isWordFile && (
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                Word Document
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              title="Download file"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative">
          {isWordFile ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 max-w-2xl shadow-lg">
                <div className="text-center mb-6">
                  <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Word Document Preview
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Word documents (.docx) cannot be previewed directly in the browser. 
                    Please download the file to view it in Microsoft Word, Google Docs, or another compatible application.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download File</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                    <span>Close</span>
                  </button>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    File: {filename}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title={`Preview of ${filename}`}
            />
          )}
        </div>
      </div>
    </div>
  )
}

