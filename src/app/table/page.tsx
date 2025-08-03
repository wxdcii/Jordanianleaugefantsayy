'use client'
import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useLanguage } from '@/contexts/LanguageContext'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Club {
  id: string
  position: number
  name_en: string
  name_ar: string
  played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_diff: number
  points: number
}

export default function TablePage() {
  const { language, isRTL } = useLanguage()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true)
        const clubsRef = collection(db, 'clubs')
        // Order by position ascending from Firestore
        const q = query(clubsRef, orderBy('position', 'asc'))
        const snapshot = await getDocs(q)
        
        const clubsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Club[]
        
        setClubs(clubsData)
      } catch (err) {
        console.error('Error fetching clubs:', err)
        setError('Failed to load clubs data')
      } finally {
        setLoading(false)
      }
    }

    fetchClubs()
  }, [])

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'bg-green-100'
    if (position >= 9) return 'bg-red-100'
    return 'bg-blue-50'
  }

  const getClubName = (club: Club) => {
    return language === 'ar' ? club.name_ar : club.name_en
  }

  const getClubLogo = (club: Club) => {
    const clubLogos: { [key: string]: string } = {
      'Al-Faisaly SC': 'https://tmssl.akamaized.net//images/wappen/head/13592.png?lm=1684147693',
      'الفيصلي': 'https://tmssl.akamaized.net//images/wappen/head/13592.png?lm=1684147693',
      'Al-Wehdat SC': 'https://tmssl.akamaized.net//images/wappen/head/15796.png?lm=1740340001',
      'الوحدات': 'https://tmssl.akamaized.net//images/wappen/head/15796.png?lm=1740340001',
      'Al-Hussein SC (Irbid)': 'https://tmssl.akamaized.net//images/wappen/head/15795.png?lm=1750956848',
      'الحسين إربد': 'https://tmssl.akamaized.net//images/wappen/head/15795.png?lm=1750956848',
      'Al-Ramtha SC': 'https://tmssl.akamaized.net//images/wappen/head/31180.png?lm=1416237505',
      'الرمثا': 'https://tmssl.akamaized.net//images/wappen/head/31180.png?lm=1416237505',
      'Al-Ahli (Amman)': 'https://tmssl.akamaized.net//images/wappen/head/22722.png?lm=1680282945',
      'الأهلي عمان': 'https://tmssl.akamaized.net//images/wappen/head/22722.png?lm=1680282945',
      'Al-Jazeera ': 'https://tmssl.akamaized.net//images/wappen/head/34471.png?lm=1740339716',
      'الجزيرة ': 'https://tmssl.akamaized.net//images/wappen/head/34471.png?lm=1740339716',
      'Shabab Al-Ordon': 'https://tmssl.akamaized.net//images/wappen/head/15832.png?lm=1416235940g',
      'شباب الأردن': 'https://tmssl.akamaized.net//images/wappen/head/15832.png?lm=1416235940',
      'Al-Salt SC': 'https://tmssl.akamaized.net//images/wappen/head/69471.png?lm=1701013200',
      'السلط': 'https://tmssl.akamaized.net//images/wappen/head/69471.png?lm=1701013200',
      'Al-Baqaa': 'https://tmssl.akamaized.net//images/wappen/head/22797.png?lm=1666352020',
      'البقعه': 'https://tmssl.akamaized.net//images/wappen/head/22797.png?lm=1666352020',
      'Sama Al-Sarhan SC': 'https://tmssl.akamaized.net//images/wappen/head/93417.png?lm=1637243754',
      'سما السرحان': 'https://tmssl.akamaized.net//images/wappen/head/93417.png?lm=1637243754'
    }
    
    return clubLogos[club.name_en] || clubLogos[club.name_ar] || '/default-club-logo.png'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className={`text-center mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isRTL ? 'جدول الترتيب' : 'League Table'}
          </h1>
          <p className="text-xl text-gray-600">
            {isRTL ? 'ترتيب فرق الدوري الأردني للمحترفين 2025/26' : 'Jordan Pro League Standings 2025/26'}
          </p>
          
        </div>

        {/* Legend */}
        <div className="mb-6 flex justify-center">
          <div className="flex gap-6 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
              <span>{isRTL ? 'مراكز متقدمة' : 'Top positions'}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded mr-2"></div>
              <span>{isRTL ? 'مراكز آمنة' : 'Safe positions'}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
              <span>{isRTL ? 'مراكز الهبوط' : 'Relegation zone'}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border">
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-center font-bold">{isRTL ? 'المركز' : 'Pos'}</th>
                <th className={`px-6 py-3 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
                  {isRTL ? 'الفريق' : 'Team'}
                </th>
                <th className="px-3 py-3 text-center font-bold">{isRTL ? 'لعب' : 'P'}</th>
                <th className="px-3 py-3 text-center font-bold">{isRTL ? 'فوز' : 'W'}</th>
                <th className="px-3 py-3 text-center font-bold">{isRTL ? 'تعادل' : 'D'}</th>
                <th className="px-3 py-3 text-center font-bold">{isRTL ? 'خسارة' : 'L'}</th>
                <th className="px-3 py-3 text-center font-bold">{isRTL ? 'له' : 'GF'}</th>
                <th className="px-3 py-3 text-center font-bold">{isRTL ? 'عليه' : 'GA'}</th>
                <th className="px-3 py-3 text-center font-bold">{isRTL ? 'الفرق' : 'GD'}</th>
                <th className="px-3 py-3 text-center font-bold">{isRTL ? 'النقاط' : 'Pts'}</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => (
                <tr
                  key={club.id}
                  className={`${getPositionColor(club.position)} hover:bg-opacity-80 transition-colors border-b border-gray-200`}
                >
                  <td className="px-4 py-4 text-center font-bold text-lg text-gray-900">
                    {club.position}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                      <span className={`font-semibold text-gray-900 text-base ${isRTL ? 'text-right' : 'text-left'}`}>
                        {getClubName(club)}
                      </span>
                      <img
                        src={getClubLogo(club)}
                        alt={getClubName(club)}
                        className="w-12 h-12 rounded-full object-contain bg-white p-1 border border-gray-200 shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiM2MzY2RjEiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDE4QzE1LjMxMzcgMTggMTggMTUuMzEzNyAxOCAxMkMxOCA4LjY4NjI5IDE1LjMxMzcgNiAxMiA2QzguNjg2MjkgNiA2IDguNjg2MjkgNiAxMkM2IDE1LjMxMzcgOC42ODYyOSAxOCAxMiAxOFoiIGZpbGw9IndoaXRlIi8+CjwvcGF0aD4KPC9zdmc+Cjwvc3ZnPgo='
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center text-gray-900 font-medium">{club.played}</td>
                  <td className="px-3 py-4 text-center text-green-600 font-bold">{club.wins}</td>
                  <td className="px-3 py-4 text-center text-yellow-600 font-bold">{club.draws}</td>
                  <td className="px-3 py-4 text-center text-red-600 font-bold">{club.losses}</td>
                  <td className="px-3 py-4 text-center text-gray-900 font-medium">{club.goals_for}</td>
                  <td className="px-3 py-4 text-center text-gray-900 font-medium">{club.goals_against}</td>
                  <td className="px-3 py-4 text-center text-gray-900 font-bold">
                    {club.goal_diff > 0 ? `+${club.goal_diff}` : club.goal_diff}
                  </td>
                  <td className="px-3 py-4 text-center font-bold text-gray-900 text-xl">
                    {club.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  )
}