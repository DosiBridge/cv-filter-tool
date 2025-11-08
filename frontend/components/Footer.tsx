'use client'

import { Sparkles } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-dosiai-primary to-dosiai-secondary rounded-lg shadow-md">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Dosiai
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  CV Filter Tool
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered CV filtering solution to help you find the best candidates faster.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Features
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>AI-Powered Analysis</li>
              <li>Real-time Progress Tracking</li>
              <li>Granular Skill Matching</li>
              <li>PDF & DOCX Support</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Powered by Dosiai
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Advanced AI technology for intelligent CV filtering and candidate matching.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://dosiai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-dosiai-primary transition-colors"
                aria-label="Dosiai Website"
              >
                <Sparkles className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
              © {new Date().getFullYear()} Dosiai. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Built with AI for smarter hiring
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

