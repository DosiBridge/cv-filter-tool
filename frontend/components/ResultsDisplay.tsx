'use client'

import { useState } from 'react'
import { CVMatchResult, SkillMatch } from '@/types'
import {
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Star,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Award,
  GraduationCap,
  Briefcase,
  Users,
  MessageSquare,
  Code,
  Filter,
  X,
} from 'lucide-react'

interface ResultsDisplayProps {
  results: CVMatchResult[]
  onResultsChange: (results: CVMatchResult[]) => void
}

export default function ResultsDisplay({
  results,
  onResultsChange,
}: ResultsDisplayProps) {
  const [sortBy, setSortBy] = useState<
    'match' | 'skills' | 'experience' | 'education' | 'technical' | 'soft'
  >('match')
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [skillFilter, setSkillFilter] = useState<string>('')
  const [minMatchFilter, setMinMatchFilter] = useState<number>(0)

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

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'expert':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'proficient':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'beginner':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'high':
        return 'text-red-600 dark:text-red-400 font-semibold'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedCards(newExpanded)
  }

  const sortedResults = [...results]
    .filter((result) => {
      // Filter by minimum match percentage
      if (result.match_percentage < minMatchFilter) return false

      // Filter by skill name
      if (skillFilter) {
        const hasSkill = result.skill_breakdown.some((skill) =>
          skill.skill_name.toLowerCase().includes(skillFilter.toLowerCase())
        )
        if (!hasSkill) return false
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'match':
          return b.match_percentage - a.match_percentage
        case 'skills':
          return b.skills_match - a.skills_match
        case 'experience':
          return b.experience_match - a.experience_match
        case 'education':
          return b.education_match - a.education_match
        case 'technical':
          return b.technical_skills_score - a.technical_skills_score
        case 'soft':
          return b.soft_skills_score - a.soft_skills_score
        default:
          return 0
      }
    })

  const moveResult = (index: number, direction: 'up' | 'down') => {
    const newResults = [...results]
    const sortedIndex = sortedResults.findIndex(
      (r) => r.filename === results[index].filename
    )
    const newIndex = direction === 'up' ? sortedIndex - 1 : sortedIndex + 1

    if (newIndex < 0 || newIndex >= sortedResults.length) return

    const originalIndex1 = results.findIndex(
      (r) => r.filename === sortedResults[sortedIndex].filename
    )
    const originalIndex2 = results.findIndex(
      (r) => r.filename === sortedResults[newIndex].filename
    )

    ;[newResults[originalIndex1], newResults[originalIndex2]] = [
      newResults[originalIndex2],
      newResults[originalIndex1],
    ]
    onResultsChange(newResults)
  }

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Filter Results ({sortedResults.length} of {results.length} CVs)
          </h2>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="inline h-4 w-4 mr-1" />
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | 'match'
                    | 'skills'
                    | 'experience'
                    | 'education'
                    | 'technical'
                    | 'soft'
                )
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="match">Overall Match %</option>
              <option value="skills">Skills Match</option>
              <option value="experience">Experience</option>
              <option value="education">Education</option>
              <option value="technical">Technical Skills</option>
              <option value="soft">Soft Skills</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Skill:
            </label>
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Search skills..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Min Match %:
            </label>
            <input
              type="number"
              value={minMatchFilter}
              onChange={(e) => setMinMatchFilter(Number(e.target.value))}
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedResults.map((result, index) => {
          const isExpanded = expandedCards.has(index)
          const originalIndex = results.findIndex(
            (r) => r.filename === result.filename
          )

          return (
            <div
              key={result.filename}
              className="border rounded-lg p-6 transition-all border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {result.filename}
                    </h3>
                    {result.match_percentage >= 80 && (
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>

                  {/* Main Match Score */}
                  <div
                    className={`inline-flex items-center px-4 py-2 rounded-full mb-3 ${getMatchBgColor(
                      result.match_percentage
                    )}`}
                  >
                    <TrendingUp className="h-5 w-5 mr-2" />
                    <span
                      className={`text-3xl font-bold ${getMatchColor(
                        result.match_percentage
                      )}`}
                    >
                      {result.match_percentage.toFixed(1)}%
                    </span>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      Match
                    </span>
                  </div>

                  {/* Granular Scores Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Code className="h-4 w-4 text-blue-500" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Technical
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.technical_skills_score.toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Users className="h-4 w-4 text-purple-500" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Soft Skills
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.soft_skills_score.toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Briefcase className="h-4 w-4 text-green-500" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Experience
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.experience_match.toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <GraduationCap className="h-4 w-4 text-indigo-500" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Education
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.education_match.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {result.years_of_experience && (
                      <span>
                        <Briefcase className="inline h-4 w-4 mr-1" />
                        {result.years_of_experience} years
                      </span>
                    )}
                    {result.education_level && (
                      <span>
                        <GraduationCap className="inline h-4 w-4 mr-1" />
                        {result.education_level}
                      </span>
                    )}
                    {result.certifications.length > 0 && (
                      <span>
                        <Award className="inline h-4 w-4 mr-1" />
                        {result.certifications.length} certifications
                      </span>
                    )}
                    {result.languages.length > 0 && (
                      <span>
                        <MessageSquare className="inline h-4 w-4 mr-1" />
                        {result.languages.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => moveResult(originalIndex, 'up')}
                    disabled={index === 0}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => moveResult(originalIndex, 'down')}
                    disabled={index === sortedResults.length - 1}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ArrowDown className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => toggleExpand(index)}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {result.summary}
                </p>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
                  {/* Skill Breakdown */}
                  {result.skill_breakdown.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                        Skill Breakdown
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {result.skill_breakdown.map((skill, skillIndex) => (
                          <div
                            key={skillIndex}
                            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {skill.skill_name}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${getLevelColor(
                                  skill.level
                                )}`}
                              >
                                {skill.level}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 mr-2">
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      skill.match_percentage >= 70
                                        ? 'bg-green-500'
                                        : skill.match_percentage >= 40
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{
                                      width: `${skill.match_percentage}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <span
                                className={`text-xs font-medium ${getRelevanceColor(
                                  skill.relevance
                                )}`}
                              >
                                {skill.match_percentage.toFixed(0)}%
                              </span>
                            </div>
                            <span
                              className={`text-xs mt-1 ${getRelevanceColor(
                                skill.relevance
                              )}`}
                            >
                              {skill.relevance} relevance
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {result.required_skills_missing.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-red-600 dark:text-red-400 mb-2">
                        Missing Required Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.required_skills_missing.map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths and Weaknesses */}
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
                              <span className="mr-2 text-green-500">•</span>
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
                              <span className="mr-2 text-red-500">•</span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {sortedResults.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No results match the current filters. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  )
}
