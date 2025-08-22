'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

interface LeaderboardEntry {
  userId: string
  displayName: string
  teamName: string
  totalPoints: number
  rank: number
  gameweeksPlayed: number
  averagePoints: number
}

interface LeaderboardProps {
  type?: 'overall' | 'gameweek'
  gameweekNumber?: number
  limit?: number
  showUserPosition?: boolean
  className?: string
}

export default function Leaderboard({ 
  type = 'overall', 
  gameweekNumber, 
  limit = 10, 
  showUserPosition = true,
  className = '' 
}: LeaderboardProps) {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userPosition, setUserPosition] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let url = `/api/rankings?type=leaderboard&limit=${limit}`
      if (type === 'gameweek' && gameweekNumber) {
        url += `&gameweek=${gameweekNumber}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.success && data.data) {
        const topUsers = data.data.topUsers || []
        setLeaderboard(topUsers.slice(0, limit))

        // Find user position if showing user position
        if (showUserPosition && user) {
          const userEntry = topUsers.find((entry: LeaderboardEntry) => entry.userId === user.uid)
          setUserPosition(userEntry || null)
        }
      } else {
        setError(data.message || 'Failed to fetch leaderboard')
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setError('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }, [type, gameweekNumber, limit, showUserPosition, user])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return ''
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50'
    if (rank === 2) return 'text-gray-600 bg-gray-50'
    if (rank === 3) return 'text-amber-600 bg-amber-50'
    return 'text-gray-700'
  }

  const isCurrentUser = (userId: string) => user?.uid === userId

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-red-600 text-sm mb-2">
          {language === 'ar' ? 'خطأ في تحميل قائمة المتصدرين' : 'Error loading leaderboard'}
        </div>
        <button 
          onClick={fetchLeaderboard}
          className="text-red-700 text-xs underline"
        >
          {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {type === 'gameweek' 
              ? (language === 'ar' ? `متصدرو الجولة ${gameweekNumber}` : `GW${gameweekNumber} Leaders`)
              : (language === 'ar' ? 'قائمة المتصدرين العامة' : 'Overall Leaderboard')
            }
          </h3>
          <button 
            onClick={fetchLeaderboard}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="p-4">
        {leaderboard.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {language === 'ar' ? 'لا توجد بيانات متاحة' : 'No data available'}
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div 
                key={entry.userId}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  isCurrentUser(entry.userId) 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50'
                } ${getRankColor(entry.rank)}`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8 h-8 mr-3 rtl:ml-3 rtl:mr-0">
                  {getRankIcon(entry.rank) ? (
                    <span className="text-xl">{getRankIcon(entry.rank)}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-600">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="font-medium text-gray-900 truncate">
                      {entry.displayName}
                    </span>
                    {isCurrentUser(entry.userId) && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {language === 'ar' ? 'أنت' : 'You'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {entry.teamName}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right rtl:text-left">
                  <div className="font-bold text-gray-900">
                    {entry.totalPoints}
                  </div>
                  <div className="text-xs text-gray-500">
                    {language === 'ar' ? 'نقطة' : 'pts'}
                  </div>
                </div>

                {/* Average */}
                {type === 'overall' && (
                  <div className="text-right rtl:text-left ml-4 rtl:mr-4 rtl:ml-0">
                    <div className="text-sm font-medium text-gray-700">
                      {entry.averagePoints}
                    </div>
                    <div className="text-xs text-gray-500">
                      {language === 'ar' ? 'متوسط' : 'avg'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* User Position (if not in top list) */}
        {showUserPosition && userPosition && !leaderboard.find(entry => entry.userId === userPosition.userId) && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500 mb-2">
              {language === 'ar' ? 'موقعك:' : 'Your position:'}
            </div>
            <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 mr-3 rtl:ml-3 rtl:mr-0">
                <span className="text-sm font-bold text-blue-600">
                  {userPosition.rank}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">
                  {userPosition.displayName}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {userPosition.teamName}
                </div>
              </div>
              <div className="text-right rtl:text-left">
                <div className="font-bold text-gray-900">
                  {userPosition.totalPoints}
                </div>
                <div className="text-xs text-gray-500">
                  {language === 'ar' ? 'نقطة' : 'pts'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
