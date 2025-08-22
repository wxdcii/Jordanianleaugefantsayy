'use client'
import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useLanguage } from '@/contexts/LanguageContext'
import { fetchAllPlayers } from '@/lib/firebasePlayersService'
import Image from 'next/image'

interface Player {
  id: string
  name: string
  nameAr?: string
  position: string
  club: string
  price: number
  points?: { [key: string]: number }
  totalPoints: number
}

const getClubLogo = (clubName: string) => {
  const clubLogos: { [key: string]: string } = {
    'Al-Ramtha': 'https://tmssl.akamaized.net//images/wappen/head/31180.png?lm=1416237505',
    'Al-Faisaly': 'https://tmssl.akamaized.net//images/wappen/head/13592.png?lm=1684147693',
    'Al-Wehdat': 'https://tmssl.akamaized.net//images/wappen/head/15796.png?lm=1740340001',
    'Al-Hussein Irbid': 'https://tmssl.akamaized.net//images/wappen/head/15795.png?lm=1750956848',
    'Al-Jazeera': 'https://tmssl.akamaized.net//images/wappen/head/22721.png?lm=1666352020',
    'Al-Salt': 'https://tmssl.akamaized.net//images/wappen/head/69471.png?lm=1701013200',
    "Al-Baqa'a": 'https://tmssl.akamaized.net//images/wappen/head/22797.png?lm=1666352020',
    'Shabab Al-Ordon': 'https://tmssl.akamaized.net//images/wappen/head/15832.png?lm=1416235940',
    'Sama Al-Sarhan': 'https://tmssl.akamaized.net//images/wappen/head/93417.png?lm=1637243754',
    'Al-Ahly': 'https://tmssl.akamaized.net//images/wappen/head/22722.png?lm=1680282945'
  }

  return (
    clubLogos[clubName] ||
    `https://via.placeholder.com/64x64/f3f4f6/6b7280?text=${encodeURIComponent(
      clubName.charAt(0)
    )}`
  )
}

export default function Players() {
  const { isRTL, language } = useLanguage()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClub, setSelectedClub] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'points'>('points')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true)
        setError(null)
        const firebasePlayers = await fetchAllPlayers()
        if (!firebasePlayers) {
          setPlayers([])
          return
        }
        setPlayers(firebasePlayers)
      } catch (e: unknown) {
        const err = e as Error
        setError(err.message || 'Failed to load players')
        setPlayers([])
      } finally {
        setLoading(false)
      }
    }
    loadPlayers()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center py-16">
            <p className="text-xl text-red-600">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Retry
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const getPlayerName = (player: Player) => {
    if (!player) return 'Unknown Player'
    if (!player.name) return 'Unknown Player'
    return language === 'ar' && player.nameAr ? player.nameAr : player.name
  }

  const getPositionColor = (position: string) => {
    switch (position.toUpperCase()) {
      case 'GKP':
      case 'GOALKEEPER':
        return 'bg-yellow-500'
      case 'DEF':
      case 'DEFENDER':
        return 'bg-blue-500'
      case 'MID':
      case 'MIDFIELDER':
        return 'bg-green-500'
      case 'FWD':
      case 'FORWARD':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPositionText = (position: string) => {
    const pos = position.toUpperCase()
    switch (pos) {
      case 'GKP':
      case 'GOALKEEPER':
        return isRTL ? 'حارس مرمى' : 'Goalkeeper'
      case 'DEF':
      case 'DEFENDER':
        return isRTL ? 'مدافع' : 'Defender'
      case 'MID':
      case 'MIDFIELDER':
        return isRTL ? 'لاعب وسط' : 'Midfielder'
      case 'FWD':
      case 'FORWARD':
        return isRTL ? 'مهاجم' : 'Forward'
      default:
        return position
    }
  }

  const uniqueClubs = [...new Set(players.map((player) => player.club))].sort()

  const filteredPlayers = players
    .filter((player) => {
      if (!player) return false
      if (!player.position) return false

      const pos = player.position.toLowerCase()
      const selectedPos = selectedPosition.toLowerCase()

      const matchesPosition =
        selectedPosition === 'all' ||
        pos.includes(selectedPos) ||
        (selectedPosition === 'gkp' && pos.includes('goalkeeper')) ||
        (selectedPosition === 'def' && pos.includes('defender')) ||
        (selectedPosition === 'mid' && pos.includes('midfielder')) ||
        (selectedPosition === 'fwd' && pos.includes('forward'))

      const matchesClub = selectedClub === 'all' || player.club === selectedClub

      const playerName = getPlayerName(player)
      const clubName = player.club || ''

      const matchesSearch =
        playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clubName.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesPosition && matchesClub && matchesSearch
    })
    .sort((a, b) => {
      let compareValue = 0

      switch (sortBy) {
        case 'name':
          compareValue = getPlayerName(a).localeCompare(getPlayerName(b))
          break
        case 'price':
          compareValue = a.price - b.price
          break
        case 'points':
          compareValue = a.totalPoints - b.totalPoints
          break
      }

      return sortOrder === 'desc' ? -compareValue : compareValue
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">
              {isRTL ? 'جارٍ تحميل اللاعبين...' : 'Loading players...'}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className={`text-center mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{isRTL ? 'اللاعبون' : 'Players'}</h1>
          <p className="text-xl text-gray-600">{isRTL ? 'لاعبو الدوري الأردني للمحترفين' : 'Jordan Pro League Players'}</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <input
            type="text"
            placeholder={isRTL ? 'البحث عن لاعب أو نادي...' : 'Search player or club...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{isRTL ? 'جميع المراكز' : 'All Positions'}</option>
            <option value="gkp">{isRTL ? 'حراس المرمى' : 'Goalkeepers'}</option>
            <option value="def">{isRTL ? 'المدافعون' : 'Defenders'}</option>
            <option value="mid">{isRTL ? 'لاعبو الوسط' : 'Midfielders'}</option>
            <option value="fwd">{isRTL ? 'المهاجمون' : 'Forwards'}</option>
          </select>

          <select
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{isRTL ? 'جميع الأندية' : 'All Clubs'}</option>
            {uniqueClubs.map((club) => (
              <option key={club} value={club}>
                {club}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'points')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="points">{isRTL ? 'النقاط' : 'Points'}</option>
            <option value="price">{isRTL ? 'السعر' : 'Price'}</option>
            <option value="name">{isRTL ? 'الاسم' : 'Name'}</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="desc">{isRTL ? 'تنازلي' : 'Descending'}</option>
            <option value="asc">{isRTL ? 'تصاعدي' : 'Ascending'}</option>
          </select>
        </div>

        {/* Players Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="text-center">
                {/* Club Logo */}
                <div className="mb-4">
                  <Image
                    src={getClubLogo(player.club)}
                    alt={player.club}
                    width={64}
                    height={64}
                    className="mx-auto rounded-full object-contain bg-white p-1 border border-gray-200 shadow-sm"
                  />
                </div>

                {/* Player Info */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{getPlayerName(player)}</h3>

                <div className="mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getPositionColor(
                      player.position
                    )}`}
                  >
                    {getPositionText(player.position)}
                  </span>
                </div>

                <p className="text-gray-600 mb-4">{player.club}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">{isRTL ? 'النقاط:' : 'Points:'}</div>
                    <div className="font-bold text-blue-600">{player.totalPoints}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{isRTL ? 'السعر:' : 'Price:'}</div>
                    <div className="font-bold text-green-600">{player.price}M</div>
                  </div>
                </div>

                {/* Gameweek Points */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {isRTL ? 'نقاط الجولات:' : 'Gameweek Points:'}
                  </h4>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {Array.from({ length: 27 }, (_, i) => {
                      const gwKey = `gw${i + 1}`
                      const points = player.points?.[gwKey] ?? 0
                      return (
                        <div key={gwKey} className="text-center">
                          <span className="text-gray-500">{gwKey}:</span>
                          <span className="ml-1 font-medium">{points}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No results */}
        {filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚽</div>
            <p className="text-gray-500">{isRTL ? 'لم يتم العثور على لاعبين' : 'No players found'}</p>
          </div>
        )}

        {/* Statistics Summary */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h3 className={`text-2xl font-bold text-gray-900 mb-6 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
            {isRTL ? 'إحصائيات اللاعبين' : 'Player Statistics'}
          </h3>

          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{players.length}</div>
              <div className="text-gray-600">{isRTL ? 'إجمالي اللاعبين' : 'Total Players'}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {players.reduce((sum, p) => sum + p.totalPoints, 0)}
              </div>
              <div className="text-gray-600">{isRTL ? 'إجمالي النقاط' : 'Total Points'}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {players.reduce((sum, p) => sum + p.price, 0).toFixed(1)}M
              </div>
              <div className="text-gray-600">{isRTL ? 'إجمالي القيم' : 'Total Value'}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {players.length > 0 ? (players.reduce((sum, p) => sum + p.totalPoints, 0) / players.length).toFixed(1) : 0}
              </div>
              <div className="text-gray-600">{isRTL ? 'متوسط النقاط' : 'Avg Points'}</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
