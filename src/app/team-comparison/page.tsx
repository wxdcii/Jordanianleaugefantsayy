'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useLanguage } from '@/contexts/LanguageContext'

interface Team {
  id: string
  name: string
  nameAr: string
  logo: string
  marketValue: string
  avgAge: number
  foreignPlayers: number
  squadSize: number
  leagueTitles: number
  currentPosition: number
  founded: number
  stadium: string
  topScorer: string
  stats: {
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
  }
}

const teams: Team[] = [
  {
    id: 'al-hussein',
    name: 'Al-Hussein SC (Irbid)',
    nameAr: 'الحسين إربد',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/15795.png?lm=1750956848',
    marketValue: '6.03m',
    avgAge: 26.3,
    foreignPlayers: 5,
    squadSize: 32,
    leagueTitles: 2,
    currentPosition: 1,
    founded: 1964,
    stadium: 'Prince Hassan Stadium',
    topScorer: 'Ahmad Samir',
    stats: { wins: 15, draws: 8, losses: 4, goalsFor: 42, goalsAgainst: 23 }
  },
  {
    id: 'al-faisaly',
    name: 'Al-Faisaly SC',
    nameAr: 'الفيصلي',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/13592.png?lm=1684147693',
    marketValue: '5.73m',
    avgAge: 26.2,
    foreignPlayers: 4,
    squadSize: 36,
    leagueTitles: 35,
    currentPosition: 2,
    founded: 1932,
    stadium: 'Amman International Stadium',
    topScorer: 'Mohammad Al-Dmeiri',
    stats: { wins: 14, draws: 7, losses: 6, goalsFor: 38, goalsAgainst: 25 }
  },
  {
    id: 'al-wehdat',
    name: 'Al-Wehdat SC',
    nameAr: 'الوحدات',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/15796.png?lm=1740340001',
    marketValue: '4.10m',
    avgAge: 25.5,
    foreignPlayers: 3,
    squadSize: 27,
    leagueTitles: 8,
    currentPosition: 3,
    founded: 1956,
    stadium: 'Al-Wehdat Stadium',
    topScorer: 'Hamza Al-Dardour',
    stats: { wins: 12, draws: 9, losses: 6, goalsFor: 35, goalsAgainst: 28 }
  },
  {
    id: 'al-ramtha',
    name: 'Al-Ramtha SC',
    nameAr: 'الرمثا',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/31180.png?lm=1416237505',
    marketValue: '2.78m',
    avgAge: 24.9,
    foreignPlayers: 2,
    squadSize: 31,
    leagueTitles: 1,
    currentPosition: 4,
    founded: 1966,
    stadium: 'Al-Ramtha Stadium',
    topScorer: 'Yazan Al-Arab',
    stats: { wins: 10, draws: 8, losses: 9, goalsFor: 32, goalsAgainst: 30 }
  },
  {
    id: 'al-ahli',
    name: 'Al-Ahli (Amman)',
    nameAr: 'الأهلي عمان',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/22722.png?lm=1680282945',
    marketValue: '2.68m',
    avgAge: 25.1,
    foreignPlayers: 2,
    squadSize: 33,
    leagueTitles: 0,
    currentPosition: 5,
    founded: 1944,
    stadium: 'King Abdullah II Stadium',
    topScorer: 'Omar Haddad',
    stats: { wins: 9, draws: 10, losses: 8, goalsFor: 29, goalsAgainst: 28 }
  }
]

export default function TeamComparison() {
  const { t, isRTL, language } = useLanguage()
  const [selectedTeam1, setSelectedTeam1] = useState<Team | null>(null)
  const [selectedTeam2, setSelectedTeam2] = useState<Team | null>(null)

  const getTeamName = (team: Team) => {
    return language === 'ar' ? team.nameAr : team.name
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className={`text-center mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('comparison.title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('comparison.select_teams')}
          </p>
        </div>

        {/* Team Selection */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Team 1 Selection */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              {t('comparison.team_1')}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam1(team)}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    selectedTeam1?.id === team.id
                      ? 'bg-red-600 text-white'
                      : 'bg-white hover:bg-gray-100'
                  } ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={40}
                    height={40}
                    className="rounded-full bg-white p-1"
                  />
                  <span className="font-medium">{getTeamName(team)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Team 2 Selection */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              {t('comparison.team_2')}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam2(team)}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    selectedTeam2?.id === team.id
                      ? 'bg-green-600 text-white'
                      : 'bg-white hover:bg-gray-100'
                  } ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={40}
                    height={40}
                    className="rounded-full bg-white p-1"
                  />
                  <span className="font-medium">{getTeamName(team)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison Results */}
        {selectedTeam1 && selectedTeam2 && (
          <div className="bg-white border rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-900 text-white p-6">
              <div className={`grid grid-cols-3 gap-4 items-center ${isRTL ? 'text-right' : ''}`}>
                <div className="text-center">
                  <Image
                    src={selectedTeam1.logo}
                    alt={selectedTeam1.name}
                    width={80}
                    height={80}
                    className="mx-auto mb-2 bg-white rounded-full p-2"
                  />
                  <h3 className="font-bold">{getTeamName(selectedTeam1)}</h3>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold">VS</h2>
                </div>
                <div className="text-center">
                  <Image
                    src={selectedTeam2.logo}
                    alt={selectedTeam2.name}
                    width={80}
                    height={80}
                    className="mx-auto mb-2 bg-white rounded-full p-2"
                  />
                  <h3 className="font-bold">{getTeamName(selectedTeam2)}</h3>
                </div>
              </div>
            </div>

            {/* Comparison Stats */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Market Value */}
                <div className={`grid grid-cols-3 gap-4 items-center ${isRTL ? 'text-right' : ''}`}>
                  <div className="font-semibold text-red-600">{selectedTeam1.marketValue}</div>
                  <div className="text-center font-medium text-gray-600">{t('comparison.market_value')}</div>
                  <div className="font-semibold text-green-600">{selectedTeam2.marketValue}</div>
                </div>

                {/* Average Age */}
                <div className={`grid grid-cols-3 gap-4 items-center ${isRTL ? 'text-right' : ''}`}>
                  <div className="font-semibold text-red-600">{selectedTeam1.avgAge} years</div>
                  <div className="text-center font-medium text-gray-600">{t('comparison.avg_age')}</div>
                  <div className="font-semibold text-green-600">{selectedTeam2.avgAge} years</div>
                </div>

                {/* Foreign Players */}
                <div className={`grid grid-cols-3 gap-4 items-center ${isRTL ? 'text-right' : ''}`}>
                  <div className="font-semibold text-red-600">{selectedTeam1.foreignPlayers}</div>
                  <div className="text-center font-medium text-gray-600">{t('comparison.foreign_players')}</div>
                  <div className="font-semibold text-green-600">{selectedTeam2.foreignPlayers}</div>
                </div>

                {/* Squad Size */}
                <div className={`grid grid-cols-3 gap-4 items-center ${isRTL ? 'text-right' : ''}`}>
                  <div className="font-semibold text-red-600">{selectedTeam1.squadSize}</div>
                  <div className="text-center font-medium text-gray-600">{t('comparison.squad_size')}</div>
                  <div className="font-semibold text-green-600">{selectedTeam2.squadSize}</div>
                </div>

                {/* League Titles */}
                <div className={`grid grid-cols-3 gap-4 items-center ${isRTL ? 'text-right' : ''}`}>
                  <div className="font-semibold text-red-600">{selectedTeam1.leagueTitles}</div>
                  <div className="text-center font-medium text-gray-600">{t('comparison.titles')}</div>
                  <div className="font-semibold text-green-600">{selectedTeam2.leagueTitles}</div>
                </div>


          
          </div>
        </div>
      </div>
    )}

        {(!selectedTeam1 || !selectedTeam2) && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Select two teams to see detailed comparison
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
