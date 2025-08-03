'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Header } from '@/components/Header'
import UserPointsDisplay from '@/components/UserPointsDisplay'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function MyPointsPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [refreshing, setRefreshing] = useState(false)

  const isArabic = language === 'ar'

  const handleRefreshRanks = async () => {
    if (!user) return

    setRefreshing(true)

    try {
      const response = await fetch('/api/refresh-all-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ تم تحديث الترتيب بنجاح!\n\nتم تحديث ${result.data.totalUsersUpdated} مستخدم\nعبر ${result.data.gameweeksUpdated} جولة`)

        // Refresh the page to show updated points
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        alert(`❌ خطأ في تحديث الترتيب: ${result.message}`)
      }
    } catch (error) {
      console.error('Error refreshing ranks:', error)
      alert('❌ حدث خطأ في تحديث الترتيب')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {isArabic ? 'نقاطي وترتيبي' : 'My Points & Ranking'}
              </h1>
              <p className="text-gray-600">
                {isArabic
                  ? 'تابع نقاطك وترتيبك في الدوري الخيالي'
                  : 'Track your points and ranking in the fantasy league'}
              </p>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Main Points Display */}
              <UserPointsDisplay
                showRanking={true}
                showGameweekBreakdown={true}
              />

              {/* Update Rank Button */}
              <div className="text-center mt-6">
                <button
                  onClick={handleRefreshRanks}
                  disabled={refreshing}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {refreshing
                    ? isArabic
                      ? 'جاري التحديث...'
                      : 'Updating...'
                    : isArabic
                      ? 'تحديث الترتيب'
                      : 'Update Ranks'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  {isArabic ? 'تحديث جميع النقاط والترتيب' : 'Refresh all points and rankings'}
                </p>
              </div>

              {/* Points Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">
                  {isArabic ? 'كيف يتم حساب النقاط؟' : 'How are points calculated?'}
                </h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div><strong>{isArabic ? 'المشاركة:' : 'Playing:'}</strong> 2 {isArabic ? 'نقطة' : 'points'}</div>
                    <div><strong>{isArabic ? 'المباراة كاملة:' : 'Full game:'}</strong> +1 {isArabic ? 'نقطة' : 'point'}</div>
                    <div><strong>{isArabic ? 'هدف (مهاجم):' : 'Goal (FWD):'}</strong> 4 {isArabic ? 'نقاط' : 'points'}</div>
                    <div><strong>{isArabic ? 'هدف (وسط):' : 'Goal (MID):'}</strong> 5 {isArabic ? 'نقاط' : 'points'}</div>
                    <div><strong>{isArabic ? 'هدف (دفاع/حارس):' : 'Goal (DEF/GKP):'}</strong> 6 {isArabic ? 'نقاط' : 'points'}</div>
                    <div><strong>{isArabic ? 'تمريرة حاسمة:' : 'Assist:'}</strong> 3 {isArabic ? 'نقاط' : 'points'}</div>
                    <div><strong>{isArabic ? 'شباك نظيفة:' : 'Clean sheet:'}</strong> 4 {isArabic ? 'نقاط' : 'points'}</div>
                    <div><strong>{isArabic ? 'القائد:' : 'Captain:'}</strong> {isArabic ? 'ضعف النقاط' : 'Double points'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
