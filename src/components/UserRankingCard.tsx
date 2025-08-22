'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

interface UserRankingData {
  userId: string
  displayName: string
  teamName: string
  totalPoints: number
  rank: number
  lastUpdated: Date
}

interface UserRankingStats {
  gameweeksPlayed: number
  averagePoints: number
}

interface UserRankingCardProps {
  className?: string
  showDetails?: boolean
}

export default function UserRankingCard({ className = '', showDetails = true }: UserRankingCardProps) {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [ranking, setRanking] = useState<UserRankingData | null>(null)
  const [stats, setStats] = useState<UserRankingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserRanking = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/rankings?type=user&userId=${user.uid}`)
      const data = await response.json()

      if (data.success) {
        setRanking(data.data)
        setStats(data.stats)
      } else {
        setError(data.message || 'Failed to fetch ranking')
      }
    } catch (error) {
      console.error('Error fetching user ranking:', error)
      setError('Failed to load ranking data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchUserRanking()
    }
  }, [user, fetchUserRanking])

  const getRankDisplay = (rank: number) => {
    if (rank === 0) return language === 'ar' ? 'غير مصنف' : 'Unranked'
    
    const suffix = language === 'ar' ? '' : getRankSuffix(rank)
    return language === 'ar' ? `المركز ${rank}` : `${rank}${suffix}`
  }

  const getRankSuffix = (rank: number) => {
    if (rank >= 11 && rank <= 13) return 'th'
    const lastDigit = rank % 10
    switch (lastDigit) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  const getRankColor = (rank: number) => {
    if (rank === 0) return 'text-gray-500'
    if (rank === 1) return 'text-yellow-600' // Gold
    if (rank === 2) return 'text-gray-400' // Silver
    if (rank === 3) return 'text-amber-600' // Bronze
    if (rank <= 10) return 'text-green-600' // Top 10
    if (rank <= 100) return 'text-blue-600' // Top 100
    return 'text-gray-600' // Others
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    if (rank <= 10) return '🏆'
    if (rank <= 100) return '⭐'
    return '📊'
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-red-600 text-sm">
          {language === 'ar' ? 'خطأ في تحميل الترتيب' : 'Error loading ranking'}
        </div>
        <button 
          onClick={fetchUserRanking}
          className="text-red-700 text-xs underline mt-1"
        >
          {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    )
  }

  if (!ranking) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-gray-600 text-sm text-center">
          {language === 'ar' ? 'لا توجد بيانات ترتيب' : 'No ranking data available'}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">
          {language === 'ar' ? 'ترتيبك العام' : 'Your Overall Ranking'}
        </h3>
        <button 
          onClick={fetchUserRanking}
          className="text-gray-400 hover:text-gray-600 text-xs"
        >
          🔄
        </button>
      </div>

      {/* Main Ranking Display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-2xl">{getRankIcon(ranking.rank)}</span>
          <div>
            <div className={`text-xl font-bold ${getRankColor(ranking.rank)}`}>
              {getRankDisplay(ranking.rank)}
            </div>
            <div className="text-sm text-gray-500">
              {ranking.totalPoints} {language === 'ar' ? 'نقطة' : 'points'}
            </div>
          </div>
        </div>
        
        {showDetails && stats && (
          <div className="text-right rtl:text-left">
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'متوسط النقاط' : 'Avg Points'}
            </div>
            <div className="text-lg font-semibold text-blue-600">
              {stats.averagePoints}
            </div>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      {showDetails && stats && (
        <div className="border-t pt-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">
                {language === 'ar' ? 'الجولات المشاركة' : 'Gameweeks Played'}
              </div>
              <div className="font-medium">{stats.gameweeksPlayed}</div>
            </div>
            <div>
              <div className="text-gray-500">
                {language === 'ar' ? 'اسم الفريق' : 'Team Name'}
              </div>
              <div className="font-medium text-xs truncate" title={ranking.teamName}>
                {ranking.teamName}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-xs text-gray-400 mt-2 text-center">
        {language === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}
        {new Date(ranking.lastUpdated).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
      </div>
    </div>
  )
}
