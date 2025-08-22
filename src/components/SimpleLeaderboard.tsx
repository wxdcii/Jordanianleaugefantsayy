'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'

interface SimpleRanking {
  userId: string
  displayName: string
  teamName: string
  totalPoints: number
  rank: number
  gameweeksPlayed: number
  averagePoints: number
}

interface SimpleLeaderboardProps {
  limit?: number
  showUserPosition?: boolean
  className?: string
}

export default function SimpleLeaderboard({ 
  limit = 20, 
  showUserPosition = true,
  className = '' 
}: SimpleLeaderboardProps) {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [rankings, setRankings] = useState<SimpleRanking[]>([])
  const [userRanking, setUserRanking] = useState<SimpleRanking | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRankings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/simple-rankings?action=all')
      const data = await response.json()

      if (data.success) {
        const allRankings = data.data || []
        setRankings(allRankings)
      } else {
        setError(data.message || 'Failed to fetch rankings')
      }
    } catch (error) {
      console.error('Error fetching rankings:', error)
      setError('Failed to load rankings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRankings()
  }, [fetchRankings])

  const updateRankings = async () => {
    try {
      setUpdating(true)
      
      const response = await fetch('/api/simple-rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update' })
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh rankings after update
        await fetchRankings()
        alert(`Updated ${data.updated} user rankings`)
      } else {
        alert(`Failed to update rankings: ${data.message}`)
      }
    } catch (error) {
      console.error('Error updating rankings:', error)
      alert('Error updating rankings')
    } finally {
      setUpdating(false)
    }
  }

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
        <div className="text-red-500 text-xs mb-3">{error}</div>
        <Button 
          onClick={fetchRankings}
          size="sm"
          variant="outline"
        >
          {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
        </Button>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {language === 'ar' ? 'قائمة المتصدرين' : 'Leaderboard'}
          </h3>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={updateRankings}
              disabled={updating}
              size="sm"
              variant="outline"
            >
              {updating 
                ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') 
                : (language === 'ar' ? 'تحديث' : 'Update')
              }
            </Button>
            <button 
              onClick={fetchRankings}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              🔄
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {language === 'ar' 
            ? `${rankings.length} مستخدم` 
            : `${rankings.length} users`
          }
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="p-4">
        {rankings.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {language === 'ar' ? 'لا توجد بيانات متاحة' : 'No data available'}
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((entry, index) => (
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

                {/* Gameweeks & Average */}
                <div className="text-right rtl:text-left ml-4 rtl:mr-4 rtl:ml-0">
                  <div className="text-sm font-medium text-gray-700">
                    {entry.averagePoints}
                  </div>
                  <div className="text-xs text-gray-500">
                    {language === 'ar' ? `${entry.gameweeksPlayed} جولة` : `${entry.gameweeksPlayed} GWs`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Position (if not in top list) */}
        {showUserPosition && userRanking && !rankings.find(entry => entry.userId === userRanking.userId) && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500 mb-2">
              {language === 'ar' ? 'موقعك:' : 'Your position:'}
            </div>
            <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 mr-3 rtl:ml-3 rtl:mr-0">
                <span className="text-sm font-bold text-blue-600">
                  {userRanking.rank}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">
                  {userRanking.displayName}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {userRanking.teamName}
                </div>
              </div>
              <div className="text-right rtl:text-left">
                <div className="font-bold text-gray-900">
                  {userRanking.totalPoints}
                </div>
                <div className="text-xs text-gray-500">
                  {language === 'ar' ? 'نقطة' : 'pts'}
                </div>
              </div>
              <div className="text-right rtl:text-left ml-4 rtl:mr-4 rtl:ml-0">
                <div className="text-sm font-medium text-gray-700">
                  {userRanking.averagePoints}
                </div>
                <div className="text-xs text-gray-500">
                  {language === 'ar' ? `${userRanking.gameweeksPlayed} جولة` : `${userRanking.gameweeksPlayed} GWs`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
