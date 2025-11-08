'use client'

import { FileText } from 'lucide-react'

interface RequirementsInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function RequirementsInput({
  value,
  onChange,
  disabled = false,
}: RequirementsInputProps) {
  return (
    <div>
      <label
        htmlFor="requirements"
        className="block text-xl font-semibold text-gray-900 dark:text-white mb-4"
      >
        Job Requirements
      </label>
      <div className="relative">
        <textarea
          id="requirements"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter job requirements, qualifications, skills, experience, and other criteria here..."
          rows={6}
          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-dosiai-primary focus:border-dosiai-primary dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none ${
            disabled
              ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
              : 'bg-white'
          }`}
        />
        <div className="absolute top-3 right-3">
          <FileText className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Be specific about skills, experience level, education, and other requirements for better matching results.
      </p>
    </div>
  )
}

