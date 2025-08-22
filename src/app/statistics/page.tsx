'use client'
import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useLanguage } from '@/contexts/LanguageContext'
import Image from 'next/image'

interface PlayerStat {
  id: string
  name: string
  nameAr: string
  team: {
    name: string
    nameAr: string
    logo: string
  }
  goals?: number
  assists?: number
  cleanSheets?: number
  saves?: number
  appearances: number
  position: string
}

const topScorers: PlayerStat[] = [
  {
    id: '1',
    name: 'Ahmad Samir',
    nameAr: 'أحمد سمير',
    team: {
      name: 'Al-Hussein SC',
      nameAr: 'الحسين إربد',
      logo: 'https://ext.same-assets.com/2375016756/4092132994.png'
    },
    goals: 12,
    appearances: 15,
    position: 'FWD'
  },

  {
    id: '3',
    name: 'Mohammad Al-Dmeiri',
    nameAr: 'محمد الدميري',
    team: {
      name: 'Al-Faisaly SC',
      nameAr: 'الفيصلي',
      logo: 'https://ext.same-assets.com/2375016756/3567261618.png'
    },
    goals: 9,
    appearances: 15,
    position: 'MID'
  },
  {
    id: '4',
    name: 'Yazan Al-Arab',
    nameAr: 'يزن العرب',
    team: {
      name: 'Al-Ramtha SC',
      nameAr: 'الرمثا',
      logo: 'https://ext.same-assets.com/2375016756/673257338.png'
    },
    goals: 7,
    appearances: 13,
    position: 'MID'
  },
  {
    id: '5',
    name: 'Omar Khalil',
    nameAr: 'عمر خليل',
    team: {
      name: 'Al-Ahli (Amman)',
      nameAr: 'الأهلي عمان',
      logo: 'https://ext.same-assets.com/2375016756/1646190009.png'
    },
    goals: 6,
    appearances: 14,
    position: 'FWD'
  }
]

const topAssists: PlayerStat[] = [
  {
    id: '1',
    name: 'Mohammad Al-Dmeiri',
    nameAr: 'محمد الدميري',
    team: {
      name: 'Al-Faisaly SC',
      nameAr: 'الفيصلي',
      logo: 'https://ext.same-assets.com/2375016756/3567261618.png'
    },
    assists: 8,
    appearances: 15,
    position: 'MID'
  },
  {
    id: '2',
    name: 'Khalil Mansour',
    nameAr: 'خليل منصور',
    team: {
      name: 'Al-Hussein SC',
      nameAr: 'الحسين إربد',
      logo: 'https://ext.same-assets.com/2375016756/4092132994.png'
    },
    assists: 7,
    appearances: 14,
    position: 'MID'
  },
  {
    id: '3',
    name: 'Yazan Al-Arab',
    nameAr: 'يزن العرب',
    team: {
      name: 'Al-Ramtha SC',
      nameAr: 'الرمثا',
      logo: 'https://ext.same-assets.com/2375016756/673257338.png'
    },
    assists: 6,
    appearances: 13,
    position: 'MID'
  }
]

const topKeepers: PlayerStat[] = [
  {
    id: '1',
    name: 'Ahmad Al-Shenawy',
    nameAr: 'أحمد الشناوي',
    team: {
      name: 'Al-Hussein SC',
      nameAr: 'الحسين إربد',
      logo: 'https://ext.same-assets.com/2375016756/4092132994.png'
    },
    cleanSheets: 9,
    saves: 45,
    appearances: 15,
    position: 'GK'
  },
  {
    id: '2',
    name: 'Omar Rabie',
    nameAr: 'عمر ربيع',
    team: {
      name: 'Al-Faisaly SC',
      nameAr: 'الفيصلي',
      logo: 'https://ext.same-assets.com/2375016756/3567261618.png'
    },
    cleanSheets: 7,
    saves: 38,
    appearances: 15,
    position: 'GK'
  }
]

export default function Statistics() {
  const { t, isRTL, language } = useLanguage()
  const [activeTab, setActiveTab] = useState<'scorers' | 'assists' | 'keepers'>('scorers')

  const getPlayerName = (player: PlayerStat) => {
    return language === 'ar' ? player.nameAr : player.name
  }

  const getTeamName = (team: { name: string; nameAr: string }) => {
    return language === 'ar' ? team.nameAr : team.name
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className={`text-center mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isRTL ? 'الإحصائيات' : 'Statistics'}
          </h1>
          <p className="text-xl text-gray-600">
            {isRTL ? 'إحصائيات الدوري الأردني للمحترفين 2025/26' : 'Jordan Pro League Statistics 2025/26'}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold mb-2">150</div>
            <div className="text-red-100">
              {isRTL ? 'إجمالي الأهداف' : 'Total Goals'}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold mb-2">88</div>
            <div className="text-blue-100">
              {isRTL ? 'إجمالي التمريرات الحاسمة' : 'Total Assists'}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold mb-2">45</div>
            <div className="text-green-100">
              {isRTL ? 'الشباك النظيفة' : 'Clean Sheets'}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold mb-2">340</div>
            <div className="text-purple-100">
              {isRTL ? 'إجمالي التصديات' : 'Total Saves'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
            {([
              { key: 'scorers', label: isRTL ? 'الهدافين' : 'Top Scorers' },
              { key: 'assists', label: isRTL ? 'صناع الألعاب' : 'Top Assists' },
              { key: 'keepers', label: isRTL ? 'الحراس' : 'Goalkeepers' }
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top Scorers */}
        {activeTab === 'scorers' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-red-600 text-white p-4">
              <h3 className="text-xl font-bold">
                {isRTL ? 'أفضل الهدافين' : 'Top Scorers'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'المركز' : 'Rank'}
                    </th>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'اللاعب' : 'Player'}
                    </th>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center`}>
                      {isRTL ? 'الأهداف' : 'Goals'}
                    </th>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center`}>
                      {isRTL ? 'المباريات' : 'Apps'}
                    </th>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center`}>
                      {isRTL ? 'المعدل' : 'Ratio'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topScorers.map((player, index) => (
                    <tr key={player.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index === 0 && <div className="text-2xl mr-2">🥇</div>}
                          {index === 1 && <div className="text-2xl mr-2">🥈</div>}
                          {index === 2 && <div className="text-2xl mr-2">🥉</div>}
                          <span className="text-lg font-bold text-gray-900">{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center space-x-3 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <Image
                            src={player.team.logo}
                            alt={player.team.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                          <div className={isRTL ? 'text-right' : 'text-left'}>
                            <div className="text-sm font-medium text-gray-900">
                              {getPlayerName(player)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getTeamName(player.team)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-red-600">{player.goals}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">
                        {player.appearances}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">
                        {((player.goals || 0) / player.appearances).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Assists */}
        {activeTab === 'assists' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <h3 className="text-xl font-bold">
                {isRTL ? 'أفضل صناع الألعاب' : 'Top Assists'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'المركز' : 'Rank'}
                    </th>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'اللاعب' : 'Player'}
                    </th>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center`}>
                      {isRTL ? 'التمريرات الحاسمة' : 'Assists'}
                    </th>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center`}>
                      {isRTL ? 'المباريات' : 'Apps'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topAssists.map((player, index) => (
                    <tr key={player.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index === 0 && <div className="text-2xl mr-2">🥇</div>}
                          {index === 1 && <div className="text-2xl mr-2">🥈</div>}
                          {index === 2 && <div className="text-2xl mr-2">🥉</div>}
                          <span className="text-lg font-bold text-gray-900">{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center space-x-3 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <Image
                            src={player.team.logo}
                            alt={player.team.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                          <div className={isRTL ? 'text-right' : 'text-left'}>
                            <div className="text-sm font-medium text-gray-900">
                              {getPlayerName(player)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getTeamName(player.team)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-blue-600">{player.assists}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">
                        {player.appearances}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Keepers */}
        {activeTab === 'keepers' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 text-white p-4">
              <h3 className="text-xl font-bold">
                {isRTL ? 'أفضل الحراس' : 'Top Goalkeepers'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'المركز' : 'Rank'}
                    </th>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'اللاعب' : 'Player'}
                    </th>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center`}>
                      {isRTL ? 'الشباك النظيفة' : 'Clean Sheets'}
                    </th>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center`}>
                      {isRTL ? 'التصديات' : 'Saves'}
                    </th>
                    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center`}>
                      {isRTL ? 'المباريات' : 'Apps'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topKeepers.map((player, index) => (
                    <tr key={player.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index === 0 && <div className="text-2xl mr-2">🥇</div>}
                          {index === 1 && <div className="text-2xl mr-2">🥈</div>}
                          <span className="text-lg font-bold text-gray-900">{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center space-x-3 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <Image
                            src={player.team.logo}
                            alt={player.team.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                          <div className={isRTL ? 'text-right' : 'text-left'}>
                            <div className="text-sm font-medium text-gray-900">
                              {getPlayerName(player)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getTeamName(player.team)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-green-600">{player.cleanSheets}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">
                        {player.saves}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">
                        {player.appearances}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
