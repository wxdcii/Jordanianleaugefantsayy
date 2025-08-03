'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import SimpleUserRankingCard from '@/components/SimpleUserRankingCard'
import SimpleLeaderboard from '@/components/SimpleLeaderboard'

export default function TestRankingsPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  type ApiResults = {
    count?: number;
    updated?: number;
    success?: boolean;
    error?: string;
    [key: string]: unknown;
  };
  const [results, setResults] = useState<ApiResults | null>(null)
  const [selectedGameweek, setSelectedGameweek] = useState(3)

  // Test functions
  const testCalculateRankings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/simple-rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calculate'
        })
      })

      const data = await response.json()
      setResults(data)
      alert(`Rankings calculated for ${data.count} users`)
    } catch (error) {
      console.error('Error calculating rankings:', error)
      alert('Error calculating rankings')
    } finally {
      setLoading(false)
    }
  }

  const testUpdateRankings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/simple-rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update'
        })
      })

      const data = await response.json()
      setResults(data)
      alert(`Updated ${data.updated} user rankings`)
    } catch (error) {
      console.error('Error updating rankings:', error)
      alert('Error updating rankings')
    } finally {
      setLoading(false)
    }
  }

  const testFetchUsersWithSquads = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/simple-rankings?action=users-with-squads')
      const data = await response.json()
      setResults(data)
      alert(`Found ${data.count} users with squads`)
    } catch (error) {
      console.error('Error fetching users with squads:', error)
      alert('Error fetching users with squads')
    } finally {
      setLoading(false)
    }
  }



  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to test rankings</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">
            {language === 'ar' ? 'اختبار نظام الترتيب' : 'Ranking System Test'}
          </h1>
          
          {/* Gameweek Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {language === 'ar' ? 'اختر الجولة:' : 'Select Gameweek:'}
            </label>
            <select 
              value={selectedGameweek}
              onChange={(e) => setSelectedGameweek(parseInt(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {[...Array(27)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  GW{i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={testFetchUsersWithSquads}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Fetching...' : 'Fetch Users with Squads'}
            </Button>

            <Button
              onClick={testCalculateRankings}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Calculating...' : 'Calculate Rankings'}
            </Button>

            <Button
              onClick={testUpdateRankings}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Updating...' : 'Update Rankings'}
            </Button>
          </div>

          {/* Results */}
          {results && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-medium mb-2">Last Test Results:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Ranking Components Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Ranking Card */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {language === 'ar' ? 'بطاقة ترتيب المستخدم' : 'User Ranking Card'}
            </h2>
            <SimpleUserRankingCard showDetails={true} />
          </div>

          {/* Overall Leaderboard */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {language === 'ar' ? 'قائمة المتصدرين العامة' : 'Overall Leaderboard'}
            </h2>
            <SimpleLeaderboard
              limit={10}
              showUserPosition={true}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold mb-3">
            {language === 'ar' ? 'تعليمات الاختبار:' : 'Test Instructions:'}
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              {language === 'ar'
                ? 'اضغط "Fetch Users with Squads" لجلب جميع المستخدمين الذين لديهم فرق محفوظة'
                : 'Click "Fetch Users with Squads" to get all users who have saved squads'
              }
            </li>
            <li>
              {language === 'ar'
                ? 'اضغط "Calculate Rankings" لحساب الترتيب بناءً على النقاط الفعلية للفرق'
                : 'Click "Calculate Rankings" to calculate rankings based on actual squad points'
              }
            </li>
            <li>
              {language === 'ar'
                ? 'اضغط "Update Rankings" لحفظ الترتيب المحسوب في قاعدة البيانات'
                : 'Click "Update Rankings" to save calculated rankings to the database'
              }
            </li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              {language === 'ar'
                ? 'ملاحظة: هذا النظام يحسب النقاط بناءً على الفرق المحفوظة فعلياً في قاعدة البيانات'
                : 'Note: This system calculates points based on actual saved squads in the database'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
