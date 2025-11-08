'use client'

import { Sparkles } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-dosiai-primary to-dosiai-secondary rounded-lg shadow-md">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                Dosiai
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                CV Filter Tool
              </p>
            </div>
          </div>

          {/* Navigation or Info */}
          <div className="hidden sm:flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              AI-Powered CV Filtering
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

