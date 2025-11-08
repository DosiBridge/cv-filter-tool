'use client'

import { useState } from 'react'
import { CVMatchResult } from '@/types'
import { CheckCircle2, XCircle, ArrowUp, ArrowDown, Star, TrendingUp } from 'lucide-react'

interface ResultsDisplayProps {
  results: CVMatchResult[]
  onResultsChange: (results: CVMatchResult[]) => void
}

export default function ResultsDisplay({
  results,
  onResultsChange,
}: ResultsDisplayProps) {
  const [sortBy, setSortBy] = useState<'match' | 'skills' | 'experience' | 'education'>('match')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400'
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400'
    if (percentage >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getMatchBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/30'
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30'
    if (percentage >= 40) return 'bg-orange-100 dark:bg-orange-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'match':
        return b.match_percentage - a.match_percentage
      case 'skills':
        return b.skills_match - a.skills_match
      case 'experience':
        return b.experience_match - a.experience_match
      case 'education':
        return b.education_match - a.education_match
      default:
        return 0
    }
  })

  const moveResult = (index: number, direction: 'up' | 'down') => {
    const newResults = [...results]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= results.length) return

    ;[newResults[index], newResults[newIndex]] = [newResults[newIndex], newResults[index]]
    onResultsChange(newResults)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Filter Results ({results.length} CVs)
        </h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as 'match' | 'skills' | 'experience' | 'education'
              )
            }
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="match">Match %</option>
            <option value="skills">Skills</option>
            <option value="experience">Experience</option>
            <option value="education">Education</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {sortedResults.map((result, index) => {
          const originalIndex = results.findIndex((r) => r.filename === result.filename)
          return (
            <div
              key={result.filename}
              className={`border rounded-lg p-6 transition-all ${
                selectedIndex === index
                  ? 'border-primary-500 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 shadow-sm'
              } bg-white dark:bg-gray-800 hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {result.filename}
                    </h3>
                    {result.match_percentage >= 80 && (
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div
                    className={`inline-flex items-center px-4 py-2 rounded-full ${getMatchBgColor(
                      result.match_percentage
                    )}`}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span
                      className={`text-2xl font-bold ${getMatchColor(
                        result.match_percentage
                      )}`}
                    >
                      {result.match_percentage.toFixed(1)}%
                    </span>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      Match
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveResult(originalIndex, 'up')}
                    disabled={originalIndex === 0}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => moveResult(originalIndex, 'down')}
                    disabled={originalIndex === results.length - 1}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ArrowDown className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Skills Match
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {result.skills_match.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Experience Match
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {result.experience_match.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Education Match
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {result.education_match.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {result.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.strengths.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Strengths
                      </h4>
                    </div>
                    <ul className="space-y-1">
                      {result.strengths.map((strength, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-600 dark:text-gray-400 flex items-start"
                        >
                          <span className="mr-2">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.weaknesses.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Areas for Improvement
                      </h4>
                    </div>
                    <ul className="space-y-1">
                      {result.weaknesses.map((weakness, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-600 dark:text-gray-400 flex items-start"
                        >
                          <span className="mr-2">•</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No results to display. Upload CVs and click "Filter CVs" to get started.
          </p>
        </div>
      )}
    </div>
  )
}

