'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Header } from '@/components/Header'
import UserPointsDisplay from '@/components/UserPointsDisplay'
import ProtectedRoute from '@/components/ProtectedRoute'
import { isAdminUser } from '@/lib/adminAuth'

export default function MyPointsPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [refreshing, setRefreshing] = useState(false)

  const isArabic = language === 'ar'
  const isAdmin = isAdminUser(user)

  const handleRefreshRanks = async () => {
    if (!user) return

    // Check if user is admin
    if (!isAdmin) {
      alert(isArabic 
        ? '❌ غير مصرح لك بهذا الإجراء - مخصص للإدارة فقط' 
        : '❌ Access denied - Admin only action')
      return
    }

    // Confirmation dialog
    const confirmMessage = isArabic 
      ? 'هل أنت متأكد من تحديث نقاط جميع اللاعبين؟ هذا الإجراء قد يستغرق بعض الوقت.'
      : 'Are you sure you want to update all players points? This action may take some time.'
    
    if (!confirm(confirmMessage)) {
      return
    }

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
        const successMessage = isArabic 
          ? `✅ تم تحديث نقاط جميع اللاعبين بنجاح!\n\n📊 تم تحديث ${result.data.totalUsersUpdated} لاعب\n🏆 عبر ${result.data.gameweeksUpdated} جولة\n\n⚡ العملية مكتملة بواسطة الإدارة`
          : `✅ All players points updated successfully!\n\n📊 Updated ${result.data.totalUsersUpdated} players\n🏆 Across ${result.data.gameweeksUpdated} gameweeks\n\n⚡ Admin operation completed`
        
        alert(successMessage)

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

              {/* Update Rank Button - Only show for admin */}
              {isAdmin && (
                <div className="text-center mt-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-yellow-800">
                        {isArabic ? 'لوحة الإدارة' : 'Admin Panel'}
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700">
                      {isArabic 
                        ? 'أنت مسؤول - يمكنك تحديث نقاط جميع اللاعبين' 
                        : 'You are an admin - you can update all players points'}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleRefreshRanks}
                    disabled={refreshing}
                    className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg"
                  >
                    {refreshing
                      ? isArabic
                        ? '🔄 جاري التحديث...'
                        : '🔄 Updating...'
                      : isArabic
                        ? '⚡ تحديث نقاط جميع اللاعبين'
                        : '⚡ Update All Players Points'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    {isArabic 
                      ? 'سيتم تحديث نقاط وترتيب جميع اللاعبين في النظام' 
                      : 'Will update points and rankings for all players in the system'}
                  </p>
                </div>
              )}

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
