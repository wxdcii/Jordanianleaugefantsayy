'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { Header } from '@/components/Header'

interface Club {
  id: string
  name: string
  nameAr: string
  logo: string
  founded: number
  city: string
  cityAr: string
  stadium: string
  stadiumAr: string
  capacity: number
  colors: {
    primary: string
    secondary: string
  }
  titles: number
  marketValue: number
  currentPosition: number
  description: string
  descriptionAr: string
  website?: string
  socialMedia?: {
    facebook?: string
    twitter?: string
    instagram?: string
  }
}

const clubs: Club[] = [
  {
    id: 'al-hussein',
    name: 'Al-Hussein SC',
    nameAr: 'الحسين إربد',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/15795.png?lm=1750956848',
    founded: 1964,
    city: 'Irbid',
    cityAr: 'إربد',
    stadium: 'Al-Hassan Stadium',
    stadiumAr: 'ستاد الحسن',
    capacity: 12000,
    colors: { primary: '#FF0000', secondary: '#FFFFFF' },
    titles: 2,
    currentPosition: 1,
    marketValue: 6030000,
    description: 'One of Jordan\'s most successful football clubs, based in the northern city of Irbid.',
    descriptionAr: 'واحد من أنجح الأندية الكروية في الأردن، يقع في مدينة إربد الشمالية.',
    website: 'https://www.transfermarkt.com/al-hussein-sc-irbid-/startseite/verein/15795/saison_id/2025'
  },
  {
    id: 'al-faisaly',
    name: 'Al-Faisaly SC',
    nameAr: 'الفيصلي',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/13592.png?lm=1684147693',
    founded: 1932,
    city: 'Amman',
    cityAr: 'عمان',
    stadium: 'Amman International Stadium',
    stadiumAr: 'ملعب عمان الدولي',
    capacity: 17619,
    colors: { primary: '#0033A0', secondary: '#FFFFFF' },
    titles: 34,
    currentPosition: 2,
    marketValue: 5480000,
    description: 'The most successful club in Jordan with 34 league titles and a rich history.',
    descriptionAr: 'النادي الأكثر نجاحًا في الأردن بـ 34 لقب دوري وتاريخ عريق.',
    website: 'https://www.transfermarkt.com/al-faisaly-amman/startseite/verein/13592/saison_id/2025'
  },
  {
    id: 'al-wehdat',
    name: 'Al-Wehdat SC',
    nameAr: 'الوحدات',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/15796.png?lm=1740340001',
    founded: 1956,
    city: 'Amman',
    cityAr: 'عمان',
    stadium: 'King Abdullah II Stadium',
    stadiumAr: 'ملعب الملك عبدالله الثاني',
    capacity: 13265,
    colors: { primary: '#008000', secondary: '#FF0000' },
    titles: 17,
    currentPosition: 3,
    marketValue: 4100000,
    description: 'A prominent club representing the Palestinian community in Jordan.',
    descriptionAr: 'نادي بارز يمثل الجالية الفلسطينية في الأردن.',
    website: 'https://www.transfermarkt.com/al-wehdat/startseite/verein/15796/saison_id/2025'
  },
  {
    id: 'al-ramtha',
    name: 'Al-Ramtha SC',
    nameAr: 'الرمثا',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/31180.png?lm=1416237505',
    founded: 1966,
    city: 'Ramtha',
    cityAr: 'الرمثا',
    stadium: 'Prince Hashim Stadium',
    stadiumAr: 'ملعب الأمير هاشم',
    capacity: 5000,
    colors: { primary: '#0066CC', secondary: '#FFFFFF' },
    titles: 3,
    currentPosition: 4,
    marketValue: 2630000,
    description: 'A northern Jordan club with passionate local support.',
    descriptionAr: 'نادي من شمال الأردن بجماهير محلية متحمسة.',
    website: 'https://www.transfermarkt.com/al-ramtha-sc/startseite/verein/31180'
  },
  {
    id: 'shabab-al-ordon',
    name: 'Shabab Al-Ordon',
    nameAr: 'شباب الأردن',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/15832.png?lm=1416235940',
    founded: 2002,
    city: 'Amman',
    cityAr: 'عمان',
    stadium: 'King Abdullah II Stadium',
    stadiumAr: 'ملعب الملك عبدالله الثاني',
    capacity: 13265,
    colors: { primary: '#FF0000', secondary: '#FFFFFF' },
    titles: 2,
    currentPosition: 5,
    marketValue: 2530000,
    description: 'Youth-focused club with emphasis on developing local talent.',
    descriptionAr: 'نادي يركز على الشباب مع التأكيد على تطوير المواهب المحلية.',
    website: 'https://www.transfermarkt.com/shabab-al-ordon-club/startseite/verein/15832'
  },
  {
    id: 'al-ahli',
    name: 'Al-Ahli (Amman)',
    nameAr: 'الأهلي عمان',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/22722.png?lm=1680282945',
    founded: 1944,
    city: 'Amman',
    cityAr: 'عمان',
    stadium: 'Amman International Stadium',
    stadiumAr: 'ملعب عمان الدولي',
    capacity: 17619,
    colors: { primary: '#FFFFFF', secondary: '#000000' },
    titles: 8,
    currentPosition: 6,
    marketValue: 2600000,
    description: 'Historic club from Amman with a strong youth development program.',
    descriptionAr: 'نادي تاريخي من عمان ببرنامج قوي لتطوير الشباب.',
    website: 'https://www.transfermarkt.com/al-ahli-amman/startseite/verein/22722'
  },
  {
    id: 'al-salt',
    name: 'Al-Salt SC',
    nameAr: 'السلط',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/69471.png?lm=1701013200',
    founded: 1965,
    city: 'Salt',
    cityAr: 'السلط',
    stadium: 'Prince Hussein Bin Abdullah II Complex',
    stadiumAr: 'مجمع الأمير حسين بن عبدالله الثاني',
    capacity: 7500,
    colors: { primary: '#800080', secondary: '#FFFFFF' },
    titles: 0,
    currentPosition: 7,
    marketValue: 1980000,
    description: 'Club from the historic city of Salt with growing ambitions.',
    descriptionAr: 'نادي من مدينة السلط التاريخية بطموحات متنامية.',
    website: 'https://www.transfermarkt.com/al-salt-sc/startseite/verein/69471'
  },
  {
    id: 'al-jazeera',
    name: 'Al-Jazeera Club',
    nameAr: 'الجزيرة',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/34471.png?lm=1740339716',
    founded: 1947,
    city: 'Amman',
    cityAr: 'عمان',
    stadium: 'Amman International Stadium',
    stadiumAr: 'ملعب عمان الدولي',
    capacity: 17619,
    colors: { primary: '#FF0000', secondary: '#000000' },
    titles: 3,
    currentPosition: 9,
    marketValue: 1950000,
    description: 'Amman-based club with a focus on community engagement.',
    descriptionAr: 'نادي مقره عمان يركز على المشاركة المجتمعية.',
    website: 'https://www.transfermarkt.com/al-jazeera-club-amman/startseite/verein/34471'
  },
   {
    id: 'al-baqqaa',
    name: 'al-baqqaa Club',
    nameAr: 'البقعه',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/22797.png?lm=1666352020',
    founded: 1968,
    city: 'Amman',
    cityAr: 'عمان',
    stadium: 'Amman International Stadium',
    stadiumAr: 'ملعب عمان الدولي',
    capacity: 17619,
    colors: { primary: '#FF0000', secondary: '#000000' },
    titles: 3,
    currentPosition: 9,
    marketValue: 1800000,
    description: 'Amman-based club with a focus on community engagement.',
    descriptionAr: 'نادي مقره عمان يركز على المشاركة المجتمعية.',
    website: 'https://www.transfermarkt.com/al-baqaa/startseite/verein/22797/saison_id/2025'
  },
  {
    id: 'moghayer-al-sarhan',
    name: 'Moghayer Al-Sarhan',
    nameAr: 'سما السرحان',
    logo: 'https://tmssl.akamaized.net//images/wappen/head/93417.png?lm=1637243754',
    founded: 1993,
    city: 'Mafraq',
    cityAr: 'المفرق',
    stadium: 'Prince Mohammed Stadium',
    stadiumAr: 'ملعب الأمير محمد',
    capacity: 15000,
    colors: { primary: '#FF6347', secondary: '#FFFFFF' },
    titles: 0,
    currentPosition: 10,
    marketValue: 750000,
    description: 'A competitive club from the Mafraq Governorate.',
    descriptionAr: 'نادٍ تنافسي من محافظة المفرق.',
    website: 'https://www.transfermarkt.com/moghayer-al-sarhan/startseite/verein/93417'
  }
]

export default function ClubsPage() {
  const { language, isRTL } = useLanguage()
  const router = useRouter()

  const getClubName = (club: Club) => {
    return language === 'ar' ? club.nameAr : club.name
  }

  const getClubCity = (club: Club) => {
    return language === 'ar' ? club.cityAr : club.city
  }

  const formatMarketValue = (value: number, lang: 'en' | 'ar'): string => {
    if (lang === 'ar') {
      if (value >= 1000000) {
        return `€${(value / 1000000).toFixed(2)} مليون`;
      }
      return `€${(value / 1000).toFixed(0)} ألف`;
    }
  
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(2)}m`;
    }
    return `€${(value / 1000).toFixed(0)}k`;
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Header />
      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero Header with Dark Mode Support */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-8 sm:mb-12 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent"></div>
          <div className="relative p-8 sm:p-12 lg:p-16">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-accent leading-none mb-2">
                  {isRTL ? 'الأندية' : 'CLUBS'}
                </h1>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white/90 mb-4">
                  {isRTL ? 'دوري المحترفين الأردني' : 'JORDAN PRO LEAGUE'}
                </h2>
                <p className="text-white/70 text-sm sm:text-base max-w-md">
                  {isRTL ? 'اكتشف جميع الأندية في الدوري الأردني للمحترفين' : 'Discover all clubs competing in Jordan\'s premier football league'}
                </p>
              </div>
              <div className="hidden sm:block">
                <div className="bg-accent text-accent-foreground px-4 py-2 rounded-lg font-bold text-sm">
                  2025/26
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters with Dark Mode */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-8 border border-border/50">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <select className="w-full sm:w-auto px-4 py-3 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary text-sm sm:text-base">
              <option>2025/26 Season</option>
            </select>
            <button className="w-full sm:w-auto px-4 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors text-sm sm:text-base">
              {isRTL ? 'إعادة تعيين' : 'Reset Filters'}
            </button>
          </div>
        </div>

        {/* Clubs Grid with Dark Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {clubs.map((club, index) => (
            <Card 
              key={club.id} 
              className="bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-card/80 hover:border-slate-600/50 transition-all group shadow-xl hover:shadow-slate-800/20"
            >
              <CardContent className="p-4 sm:p-6">
                {/* Club Header */}
                <div className="flex items-center gap-3 sm:gap-4 mb-4">
                  <div 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ring-2 ring-accent/60 flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: club.colors.primary }}
                  >
                    <Image
                      src={club.logo}
                      alt={getClubName(club)}
                      width={32}
                      height={32}
                      className="sm:w-9 sm:h-9 rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-foreground font-bold text-base sm:text-lg group-hover:text-slate-300 transition-colors truncate">
                      {getClubName(club)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-muted-foreground text-xs truncate">
                        {getClubCity(club)}
                      </span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-slate-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Club Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="text-slate-400 text-xs font-semibold">Founded</div>
                    <div className="text-foreground text-sm">{club.founded}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="text-slate-400 text-xs font-semibold">Titles</div>
                    <div className="text-foreground text-sm">{club.titles}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="text-slate-400 text-xs font-semibold">Market Value</div>
                    <div className="text-foreground text-sm font-semibold">{formatMarketValue(club.marketValue, language)}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    size="sm" 
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold flex items-center justify-center gap-1 text-xs sm:text-sm py-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (club.website) {
                        window.open(club.website, '_blank');
                      }
                    }}
                  >
                    <span className="truncate">{isRTL ? 'عرض التفاصيل' : 'View Details'}</span>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
