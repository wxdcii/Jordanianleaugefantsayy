'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import UserSquadModal from './UserSquadModalNew'

interface TopUser {
  userId: string
  displayName: string
  teamName: string
  totalPoints: number
  rank: number
  gameweeksPlayed: number
  averagePoints: number
}

interface Top50LeaderboardProps {
  className?: string
}

export default function Top50Leaderboard({ className = '' }: Top50LeaderboardProps) {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<TopUser | null>(null)
  const [isSquadModalOpen, setIsSquadModalOpen] = useState(false)

  const isArabic = language === 'ar'

  useEffect(() => {
    fetchTop50Users()
  }, [])

  const fetchTop50Users = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/rankings?type=top&limit=50')
      const data = await response.json()

      if (data.success) {
        setTopUsers(data.data || [])
      } else {
        setError(data.message || 'Failed to fetch top 50 users')
      }
    } catch (error) {
      console.error('Error fetching top 50 users:', error)
      setError('Failed to load top 50 rankings')
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return ''
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (rank === 2) return 'text-gray-600 bg-gray-50 border-gray-200'
    if (rank === 3) return 'text-amber-600 bg-amber-50 border-amber-200'
    if (rank <= 10) return 'text-green-600 bg-green-50 border-green-200'
    if (rank <= 25) return 'text-blue-600 bg-blue-50 border-blue-200'
    return 'text-gray-700 bg-white border-gray-200'
  }

  const isCurrentUser = (userId: string) => user?.uid === userId

  const handleUserClick = (clickedUser: TopUser) => {
    setSelectedUser(clickedUser)
    setIsSquadModalOpen(true)
  }

  const closeSquadModal = () => {
    setIsSquadModalOpen(false)
    setSelectedUser(null)
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 mb-4">
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
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="text-red-600 text-sm mb-3">
          {isArabic ? 'خطأ في تحميل قائمة أفضل 50 لاعب' : 'Error loading Top 50 rankings'}
        </div>
        <div className="text-red-500 text-xs mb-4">{error}</div>
        <button 
          onClick={fetchTop50Users}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
        >
          {isArabic ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    )
  }

  if (topUsers.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-gray-500 py-8">
          {isArabic ? 'لا توجد بيانات متاحة' : 'No ranking data available'}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {isArabic ? '🏆 أفضل 50 لاعب' : '🏆 Top 50 Players'}
          </h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={fetchTop50Users}
              className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
            >
              🔄
            </button>
            <span className="text-xs text-gray-500">
              {topUsers.length} {isArabic ? 'لاعب' : 'players'}
            </span>
          </div>
        </div>
      </div>

      {/* Rankings List */}
      <div className="max-h-96 overflow-y-auto">
        {topUsers.map((topUser, index) => (
          <div 
            key={topUser.userId}
            onClick={() => handleUserClick(topUser)}
            className={`flex items-center p-3 border-b transition-colors hover:bg-gray-50 cursor-pointer ${
              isCurrentUser(topUser.userId) 
                ? 'bg-blue-50 border-l-4 border-l-blue-500 font-medium' 
                : ''
            } ${getRankColor(topUser.rank)}`}
            title={isArabic ? 'انقر لعرض التشكيلة' : 'Click to view squad'}
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-12 mr-3">
              {getRankIcon(topUser.rank) ? (
                <span className="text-2xl">{getRankIcon(topUser.rank)}</span>
              ) : (
                <span className="text-lg font-bold text-gray-700">
                  {topUser.rank}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 truncate">
                  {topUser.displayName}
                </span>
                {isCurrentUser(topUser.userId) && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {isArabic ? 'أنت' : 'You'}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {topUser.teamName}
              </div>
            </div>

            {/* Points */}
            <div className="text-right">
              <div className="font-bold text-gray-900">
                {topUser.totalPoints}
              </div>
              <div className="text-xs text-gray-500">
                {isArabic ? 'نقطة' : 'pts'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          {isArabic 
            ? `يتم عرض أفضل ${topUsers.length} لاعب من إجمالي المشاركين`
            : `Showing top ${topUsers.length} players from all participants`
          }
        </div>
        <div className="text-xs text-gray-400 text-center mt-1">
          {isArabic 
            ? 'انقر على أي لاعب لعرض تشكيلته'
            : 'Click on any player to view their squad'
          }
        </div>
      </div>

      {/* Squad Modal */}
      {selectedUser && (
        <UserSquadModal
          isOpen={isSquadModalOpen}
          onClose={closeSquadModal}
          userId={selectedUser.userId}
          userName={selectedUser.displayName}
          userRank={selectedUser.rank}
          totalPoints={selectedUser.totalPoints}
        />
      )}
    </div>
  )
}
