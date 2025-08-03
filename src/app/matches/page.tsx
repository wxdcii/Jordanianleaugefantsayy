'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useLanguage } from '@/contexts/LanguageContext'
import Image from 'next/image'

import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase' // adjust path if needed

interface Match {
  id: string
  homeTeam: {
    name: string
    nameAr: string
    logo: string
  }
  awayTeam: {
    name: string
    nameAr: string
    logo: string
  }
  date: string
  time: string
  stadium: string
  homeScore?: number | null
  awayScore?: number | null
  status: 'scheduled' | 'live' | 'finished' | 'upcoming'
  matchday: number
}

// Map team names to logo URLs here
const teamLogos: Record<string, string> = {
  'Al-Faisaly': 'https://tmssl.akamaized.net//images/wappen/head/13592.png?lm=1684147693',
  'Al-Hussein Irbid': 'https://tmssl.akamaized.net//images/wappen/head/15795.png?lm=1750956848',
  'Al-Wehdat': 'https://tmssl.akamaized.net//images/wappen/head/15796.png?lm=1740340001',
  'Al-Ramtha': 'https://tmssl.akamaized.net//images/wappen/head/31180.png?lm=1416237505',
  'Al-Ahly': 'https://tmssl.akamaized.net//images/wappen/head/22722.png?lm=1680282945',
  'Shabab Al-Ordon': 'https://tmssl.akamaized.net//images/wappen/head/15832.png?lm=1416235940',
  'Al-Salt': 'https://tmssl.akamaized.net//images/wappen/head/69471.png?lm=1701013200',
  'Al-Jazeera': 'https://tmssl.akamaized.net//images/wappen/head/34471.png?lm=1740339716',
  'Al-Baqaa': 'https://tmssl.akamaized.net//images/wappen/head/22797.png?lm=1666352020',
  'Sama Al-Sarhan': 'https://tmssl.akamaized.net//images/wappen/head/93417.png?lm=1637243754',
  // Add more as needed
}

function getTeamLogo(teamName: string): string {
  return teamLogos[teamName] || '' // return empty string if not found
}

export default function Matches() {
  const { t, isRTL, language } = useLanguage()
  const [matchesByGameweek, setMatchesByGameweek] = useState<Record<number, Match[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMatches() {
      try {
        const q = query(collection(db, 'gameweeks'), orderBy('number'))
        const snapshot = await getDocs(q)
        const groupedMatches: Record<number, Match[]> = {}

        snapshot.docs.forEach(doc => {
          const data = doc.data()
          const matchdayNumber = data.number
          const fixtures = Array.isArray(data.fixtures) ? (data.fixtures as any[]) : []

          const matches: Match[] = fixtures.map((fixture, idx) => {
            // Types for team objects
            interface FixtureTeamObject {
              name?: string
              nameAr?: string
            }

            let homeTeamName = ''
            let homeTeamAr = ''
            let awayTeamName = ''
            let awayTeamAr = ''

            // homeTeam parsing
            if (typeof fixture.homeTeam === 'string') {
              homeTeamName = fixture.homeTeam
              homeTeamAr = (typeof fixture.homeTeam_ar === 'string') ? fixture.homeTeam_ar : fixture.homeTeam
            } else if (fixture.homeTeam && typeof fixture.homeTeam === 'object') {
              const ht = fixture.homeTeam as FixtureTeamObject
              homeTeamName = ht.name ?? ''
              homeTeamAr = ht.nameAr ?? homeTeamName
            }

            // awayTeam parsing
            if (typeof fixture.awayTeam === 'string') {
              awayTeamName = fixture.awayTeam
              awayTeamAr = (typeof fixture.awayTeam_ar === 'string') ? fixture.awayTeam_ar : fixture.awayTeam
            } else if (fixture.awayTeam && typeof fixture.awayTeam === 'object') {
              const at = fixture.awayTeam as FixtureTeamObject
              awayTeamName = at.name ?? ''
              awayTeamAr = at.nameAr ?? awayTeamName
            }

            return {
              id: `${data.name}-${idx}`,
              homeTeam: {
                name: homeTeamName,
                nameAr: homeTeamAr,
                logo: getTeamLogo(homeTeamName),
              },
              awayTeam: {
                name: awayTeamName,
                nameAr: awayTeamAr,
                logo: getTeamLogo(awayTeamName),
              },
              date: fixture.date ?? '',
              time: fixture.time ?? '',
              stadium: fixture.stadium ?? '',
              homeScore: fixture.homeScore ?? null,
              awayScore: fixture.awayScore ?? null,
              status: fixture.status === 'scheduled' ? 'upcoming' : (fixture.status as Match['status'] ?? 'upcoming'),
              matchday: matchdayNumber,
            }
          })

          groupedMatches[matchdayNumber] = matches
        })

        setMatchesByGameweek(groupedMatches)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching matches:', err)
        setError('Failed to load matches.')
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  // Helpers for language and status
  const getTeamName = (team: { name: string; nameAr: string }) => {
    return language === 'ar' ? team.nameAr : team.name
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-600 text-white'
      case 'finished': return 'bg-gray-600 text-white'
      case 'upcoming': return 'bg-blue-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return isRTL ? 'مباشر' : 'LIVE'
      case 'finished': return isRTL ? 'انتهت' : 'FT'
      case 'upcoming': return isRTL ? 'قادمة' : 'Upcoming'
      default: return status
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{isRTL ? 'جارٍ تحميل المباريات...' : 'Loading matches...'}</div>
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded">
          {isRTL ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className={`text-center mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{isRTL ? 'المباريات' : 'Matches'}</h1>
          <p className="text-xl text-gray-600">{isRTL ? 'جدول مباريات الدوري الأردني للمحترفين' : 'Jordan Pro League Fixtures & Results'}</p>
        </div>

        {/* Render matches grouped by gameweek */}
        {Object.entries(matchesByGameweek).map(([gwNumber, matches]) => (
          <section key={gwNumber} className="mb-12">
            <div className="bg-slate-900 text-white p-4 rounded-t-lg mb-4">
              <h2 className="text-xl font-bold">{isRTL ? `الجولة ${gwNumber}` : `Matchday ${gwNumber}`}</h2>
            </div>
            <div className="bg-white border border-slate-600 rounded-b-lg overflow-hidden">
              {matches.map(match => (
                <div key={match.id} className="p-6 border-b border-gray-200 last:border-b-0 flex items-center justify-between">
                  {/* Home Team */}
                  <div className={`flex items-center space-x-4 flex-1 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {match.homeTeam.logo && (
                      <Image src={match.homeTeam.logo} alt={match.homeTeam.name} width={50} height={50} className="rounded-full bg-gray-100 p-1" />
                    )}
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <h3 className="font-semibold text-gray-900">{getTeamName(match.homeTeam)}</h3>
                    </div>
                  </div>

                  {/* Score/Time and Status */}
                  <div className="flex flex-col items-center mx-8">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(match.status)} mb-2`}>
                      {getStatusText(match.status)}
                    </div>
                    {match.homeScore != null && match.awayScore != null ? (
                      <div className="text-2xl font-bold text-gray-900">{match.homeScore} - {match.awayScore}</div>
                    ) : (
                      <div className="text-lg font-semibold text-gray-600">{match.time}</div>
                    )}
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(match.date).toLocaleDateString(isRTL ? 'ar-JO' : 'en-US')}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{match.stadium}</div>
                  </div>

                  {/* Away Team */}
                  <div className={`flex items-center space-x-4 flex-1 justify-end ${isRTL ? 'flex-row-reverse space-x-reverse justify-start' : ''}`}>
                    <div className={isRTL ? 'text-left' : 'text-right'}>
                      <h3 className="font-semibold text-gray-900">{getTeamName(match.awayTeam)}</h3>
                    </div>
                    {match.awayTeam.logo && (
                      <Image src={match.awayTeam.logo} alt={match.awayTeam.name} width={50} height={50} className="rounded-full bg-gray-100 p-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

      </main>
      <Footer />
    </div>
  )
}
