'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Header } from '@/components/Header'
import UserPointsDisplay from '@/components/UserPointsDisplay'
import ProtectedRoute from '@/components/ProtectedRoute'
import Top50Leaderboard from '@/components/Top50Leaderboard'
import { isAdminUser } from '@/lib/adminAuth'

export default function MyPointsPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [refreshing, setRefreshing] = useState(false)
  const [updateStatus, setUpdateStatus] = useState('')

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
    setUpdateStatus(isArabic ? 'جاري الاتصال بالخادم...' : 'Connecting to server...')

    try {
      setUpdateStatus(isArabic ? 'جاري إرسال طلب التحديث...' : 'Sending update request...')
      
      const response = await fetch('/api/refresh-all-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      setUpdateStatus(isArabic ? 'جاري معالجة الاستجابة...' : 'Processing response...')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Update result:', result) // Debug log

      setUpdateStatus(isArabic ? 'تم استلام النتيجة...' : 'Result received...')

      if (result.success) {
        setUpdateStatus(isArabic ? 'تم التحديث بنجاح!' : 'Update successful!')
        
        const successMessage = isArabic 
          ? `✅ تم تحديث نقاط جميع اللاعبين بنجاح!\n\n📊 تم تحديث ${result.data?.totalUsersUpdated || 0} لاعب\n🏆 عبر ${result.data?.gameweeksUpdated || 0} جولة\n\n⚡ العملية مكتملة بواسطة الإدارة`
          : `✅ All players points updated successfully!\n\n📊 Updated ${result.data?.totalUsersUpdated || 0} players\n🏆 Across ${result.data?.gameweeksUpdated || 0} gameweeks\n\n⚡ Admin operation completed`
        
        alert(successMessage)

        // Refresh the page to show updated points
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        const errorMessage = isArabic
          ? `❌ خطأ في تحديث النقاط: ${result.message || 'خطأ غير معروف'}`
          : `❌ Error updating points: ${result.message || 'Unknown error'}`
        alert(errorMessage)
        console.error('Update failed:', result)
      }
    } catch (error) {
      console.error('Error refreshing points:', error)
      const errorMessage = isArabic
        ? `❌ حدث خطأ في الاتصال بالخادم: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
        : `❌ Server connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      alert(errorMessage)
    } finally {
      setRefreshing(false)
      setUpdateStatus('')
    }
  }

  const handleResetTotalPoints = async () => {
    if (!user || !isAdmin) {
      alert(isArabic 
        ? '❌ غير مصرح لك بهذا الإجراء - مخصص للإدارة فقط' 
        : '❌ Access denied - Admin only action')
      return
    }

    // Double confirmation for this dangerous action
    const confirmMessage1 = isArabic 
      ? '⚠️ تحذير: هذا الإجراء سيؤدي إلى إعادة تعيين جميع النقاط الإجمالية للاعبين إلى صفر!\n\nهل أنت متأكد تماماً؟'
      : '⚠️ WARNING: This action will reset ALL users total points to ZERO!\n\nAre you absolutely sure?'
    
    if (!confirm(confirmMessage1)) {
      return
    }

    const confirmMessage2 = isArabic 
      ? 'تأكيد أخير: سيتم حذف جميع النقاط الإجمالية نهائياً. هل تريد المتابعة؟'
      : 'Final confirmation: All total points will be permanently reset. Continue?'
    
    if (!confirm(confirmMessage2)) {
      return
    }

    setRefreshing(true)
    setUpdateStatus(isArabic ? 'جاري إعادة تعيين النقاط...' : 'Resetting points...')

    try {
      const response = await fetch('/api/reset-total-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Reset result:', result)

      if (result.success) {
        const successMessage = isArabic 
          ? `✅ تم إعادة تعيين النقاط بنجاح!\n\n📊 تم إعادة تعيين ${result.data?.successfulUpdates || 0} لاعب\n🔄 جميع النقاط الإجمالية أصبحت صفر`
          : `✅ Points reset successfully!\n\n📊 Reset ${result.data?.successfulUpdates || 0} players\n🔄 All total points are now zero`
        
        alert(successMessage)
        
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        const errorMessage = isArabic
          ? `❌ خطأ في إعادة تعيين النقاط: ${result.message || 'خطأ غير معروف'}`
          : `❌ Error resetting points: ${result.message || 'Unknown error'}`
        alert(errorMessage)
        console.error('Reset failed:', result)
      }
    } catch (error) {
      console.error('Error resetting points:', error)
      const errorMessage = isArabic
        ? `❌ حدث خطأ في الاتصال بالخادم: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
        : `❌ Server connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      alert(errorMessage)
    } finally {
      setRefreshing(false)
      setUpdateStatus('')
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
                  
                  <div className="space-y-3">
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

                    <button
                      onClick={handleResetTotalPoints}
                      disabled={refreshing}
                      className="bg-gray-800 text-white px-8 py-3 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg ml-4"
                    >
                      {isArabic
                        ? '🔄 إعادة تعيين جميع النقاط'
                        : '🔄 Reset All Total Points'}
                    </button>
                  </div>
                  
                  {/* Status display */}
                  {refreshing && updateStatus && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 font-medium">
                        {updateStatus}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {isArabic 
                      ? 'سيتم تحديث نقاط وترتيب جميع اللاعبين في النظام' 
                      : 'Will update points and rankings for all players in the system'}
                  </p>
                </div>
              )}

              {/* Top 50 Leaderboard */}
              <div className="max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  {isArabic ? '🏆 أفضل 50 لاعب في الدوري' : '🏆 Top 50 Players in the League'}
                </h3>
                <Top50Leaderboard />
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
