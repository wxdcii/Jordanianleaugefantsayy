'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'ar'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isRTL: boolean
  isLoaded: boolean
}

const translations = {
  en: {
    // Header
    'header.table': 'Table',
    'header.statistics': 'Statistics',
    'header.fantasy': 'Fantasy',
    'header.news': 'News',
    'header.players': 'Players',
    'header.clubs': 'Clubs',
    'header.more': 'More',
    'header.jordan_fa': 'Jordan Football Association',
    'header.rules': 'Rules',

    // Hero Section
    'hero.title': 'Register to Play Fantasy Jordan Pro League',
    'hero.description': 'Join thousands of football fans in the ultimate fantasy football experience in Jordan.',
    'hero.free_text': "It's FREE to play and you can win amazing prizes!",
    'hero.login': 'Log in',
    'hero.register': 'Register now',
    'hero.fantasy': 'Fantasy',
    'hero.jordan_league': 'الدوري الأردني للمحترفين',

    // Navigation
    'nav.home': 'Home',
    'nav.prizes': 'Prizes',
    'nav.scout': 'Scout',
    'nav.podcast': 'Podcast',
    'nav.help': 'Help',
    'nav.statistics': 'Statistics',
    'nav.fantasy_challenge': 'Fantasy Challenge',

    // Feature Cards
    'features.pick_squad.title': 'Pick Your Squad',
    'features.pick_squad.description': 'Use your budget to pick a squad of 15 players from the 10 Jordanian Pro League clubs.',
    'features.leagues.title': 'Create and Join Leagues',
    'features.leagues.description': 'Compete against friends and family in private leagues or join public leagues with fellow Jordan football fans.',
    'features.performance.title': 'Track Real Performance',
    'features.performance.description': 'Follow the actual Jordanian Pro League matches and see how your fantasy players perform in real games.',
    'features.teams': 'Teams',
    'features.players': 'Players',
    'features.current_champions': 'Current Champions',

    // News Section
    'news.title': 'Latest from Jordan Pro League',
    'news.hussein_title': 'Al-Hussein SC Successfully Defends Jordan Pro League Title',
    'news.faisaly_title': 'Al-Faisaly SC: Record Champions Looking for 36th Title',
    'news.wehdat_title': 'Al-Wehdat Cup Winners Prepare for New Season',
    'news.fantasy_prices': 'Fantasy Jordan Pro League: Player Prices Revealed',
    'news.top_scorers': 'Top Scorers in Jordan Pro League 2025/26',
    'news.foreign_players': 'New Foreign Players Join Jordan Pro League',
    'news.captaincy': 'Fantasy Jordan Pro League: Best Captaincy Picks',

    // Categories
    'category.jordan_pro_league': 'JORDAN PRO LEAGUE',
    'category.fantasy': 'FANTASY',
    'category.statistics': 'STATISTICS',
    'category.transfers': 'TRANSFERS',

    // Footer
    'footer.jordan_pro_league': 'Jordan Pro League',
    'footer.more': 'More',
    'footer.clubs': 'Clubs',
    'footer.players': 'Players',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Use',
    'footer.contact': 'Contact Us',
    'footer.jordan_fa': 'Jordan Football Association',
    'footer.copyright': '© JORDAN PRO LEAGUE 2025 | الدوري الأردني للمحترفين',

    // Partners
    'partners.football_association': 'Official Football Association',
    'partners.telecom': 'Official Telecom Partner',
    'partners.banking': 'Official Banking Partner',
    'partners.energy': 'Official Energy Partner',
    'partners.tourism': 'Official Tourism Partner',
    'partners.airline': 'Official Airline Partner',
    'partners.healthcare': 'Official Healthcare Partner',
    'partners.engineering': 'Official Engineering Partner',

    // Team Comparison
    'comparison.title': 'Team Comparison Tool',
    'comparison.select_teams': 'Select Teams to Compare',
    'comparison.team_1': 'Team 1',
    'comparison.team_2': 'Team 2',
    'comparison.compare': 'Compare Teams',
    'comparison.market_value': 'Market Value',
    'comparison.avg_age': 'Average Age',
    'comparison.foreign_players': 'Foreign Players',
    'comparison.squad_size': 'Squad Size',
    'comparison.titles': 'League Titles',
    'comparison.current_position': 'Current Position',

    // Cookie Consent
    'cookie.title': 'Jordan Pro League',
    'cookie.description': 'The Jordan Pro League website uses essential cookies to make our website work.',
    'cookie.accept': 'Accept All Cookies',
    'cookie.reject': 'Reject All',
    'cookie.manage': 'Manage Cookies',

    // Squad Selection
    'squad.selection': 'Squad Selection',
    'squad.select_your_team': 'Select your team of 15 players and enter them into upcoming Gameweeks',
    'squad.total_points': 'Total Points',
    'squad.team_value': 'Team Value',
    'squad.remaining': 'Remaining',
    'squad.transfers': 'Transfers',
    'squad.pitch_view': 'Pitch View',
    'squad.list_view': 'List View',
    'squad.captain': 'Captain',
    'squad.vice_captain': 'Vice Captain',
    'squad.goalkeeper': 'Goalkeeper',
    'squad.defender': 'Defender',
    'squad.midfielder': 'Midfielder',
    'squad.forward': 'Forward',
    'squad.bench': 'Bench',
    'squad.formation': 'Formation',
    'squad.select_player': 'Select Player',
    'squad.remove_player': 'Remove Player',
    'squad.make_captain': 'Make Captain',
    'squad.make_vice_captain': 'Make Vice Captain',
    'squad.player_stats': 'Player Stats',
    'squad.price': 'Price',
    'squad.points': 'Points',
    'squad.team': 'Team',
    'squad.position': 'Position',
    'squad.auto_pick': 'Auto Pick Team',
    'squad.save_team': 'Save Team',
    'squad.reset_team': 'Reset Team',

    // Currency and Budget
    'budget.remaining': 'Remaining Budget',
    'budget.total': 'Total Budget',
    'budget.spent': 'Budget Spent',
    'currency.jod': 'JOD',
    'currency.symbol': 'JOD',
    'price.format': '{price} JOD'
  },
  ar: {
    // Header
    'header.table': 'الجدول',
    'header.statistics': 'الإحصائيات',
    'header.fantasy': 'الفانتازي',
    'header.news': 'الأخبار',
    'header.players': 'اللاعبين',
    'header.clubs': 'الأندية',
    'header.more': 'المزيد',
    'header.jordan_fa': 'الاتحاد الأردني لكرة القدم',
    'header.rules': 'القوانين',

    // Hero Section
    'hero.title': 'سجل للعب فانتازي الدوري الأردني للمحترفين',
    'hero.description': 'انضم إلى آلاف مشجعي كرة القدم في تجربة الفانتازي المثلى في الأردن.',
    'hero.free_text': 'اللعبة مجانية ويمكنك الفوز بجوائز رائعة!',
    'hero.login': 'تسجيل الدخول',
    'hero.register': 'سجل الآن',
    'hero.fantasy': 'فانتازي',
    'hero.jordan_league': 'الدوري الأردني للمحترفين',

    // Navigation
    'nav.home': 'الرئيسية',
    'nav.prizes': 'الجوائز',
    'nav.scout': 'الكشافة',
    'nav.podcast': 'البودكاست',
    'nav.help': 'المساعدة',
    'nav.statistics': 'الإحصائيات',
    'nav.fantasy_challenge': 'تحدي الفانتازي',

    // Feature Cards
    'features.pick_squad.title': 'اختر فريقك',
    'features.pick_squad.description': 'استخدم ميزانيتك لاختيار فريق من 15 لاعب من أندية الدوري الأردني العشرة.',
    'features.leagues.title': 'أنشئ وانضم للدوريات',
    'features.leagues.description': 'تنافس مع الأصدقاء والعائلة في دوريات خاصة أو انضم لدوريات عامة مع مشجعي كرة القدم الأردنية.',
    'features.performance.title': 'تتبع الأداء الحقيقي',
    'features.performance.description': 'تابع مباريات الدوري الأردني الفعلي وشاهد كيف يؤدي لاعبو الفانتازي في المباريات الحقيقية.',
    'features.teams': 'فرق',
    'features.players': 'لاعب',
    'features.current_champions': 'الأبطال الحاليون',

    // News Section
    'news.title': 'آخر أخبار الدوري الأردني للمحترفين',
    'news.hussein_title': 'الحسين إربد يدافع بنجاح عن لقب الدوري الأردني',
    'news.faisaly_title': 'الفيصلي: الأبطال القياسيون يسعون للقب الـ36',
    'news.wehdat_title': 'الوحدات أبطال الكأس يستعدون للموسم الجديد',
    'news.fantasy_prices': 'فانتازي الدوري الأردني: الكشف عن أسعار اللاعبين',
    'news.top_scorers': 'أفضل الهدافين في الدوري الأردني 2025/26',
    'news.foreign_players': 'لاعبون أجانب جدد ينضمون للدوري الأردني',
    'news.captaincy': 'فانتازي الدوري الأردني: أفضل خيارات القيادة',

    // Categories
    'category.jordan_pro_league': 'الدوري الأردني للمحترفين',
    'category.fantasy': 'فانتازي',
    'category.statistics': 'إحصائيات',
    'category.transfers': 'انتقالات',

    // Footer
    'footer.jordan_pro_league': 'الدوري الأردني للمحترفين',
    'footer.more': 'المزيد',
    'footer.clubs': 'الأندية',
    'footer.players': 'اللاعبين',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.terms': 'شروط الاستخدام',
    'footer.contact': 'اتصل بنا',
    'footer.jordan_fa': 'الاتحاد الأردني لكرة القدم',
    'footer.copyright': '© الدوري الأردني للمحترفين 2025',

    // Partners
    'partners.football_association': 'الاتحاد الرسمي لكرة القدم',
    'partners.telecom': 'الشريك الرسمي للاتصالات',
    'partners.banking': 'الشريك المصرفي الرسمي',
    'partners.energy': 'شريك الطاقة الرسمي',
    'partners.tourism': 'الشريك السياحي الرسمي',
    'partners.airline': 'شريك الطيران الرسمي',
    'partners.healthcare': 'الشريك الصحي الرسمي',
    'partners.engineering': 'شريك الهندسة الرسمي',

    // Team Comparison
    'comparison.title': 'أداة مقارنة الفرق',
    'comparison.select_teams': 'اختر الفرق للمقارنة',
    'comparison.team_1': 'الفريق الأول',
    'comparison.team_2': 'الفريق الثاني',
    'comparison.compare': 'قارن الفرق',
    'comparison.market_value': 'القيمة السوقية',
    'comparison.avg_age': 'متوسط العمر',
    'comparison.foreign_players': 'اللاعبون الأجانب',
    'comparison.squad_size': 'حجم القائمة',
    'comparison.titles': 'الألقاب',
    'comparison.current_position': 'المركز الحالي',

    // Cookie Consent
    'cookie.title': 'الدوري الأردني للمحترفين',
    'cookie.description': 'يستخدم موقع الدوري الأردني ملفات تعريف الارتباط الأساسية لعمل موقعنا.',
    'cookie.accept': 'قبول جميع ملفات تعريف الارتباط',
    'cookie.reject': 'رفض الكل',
    'cookie.manage': 'إدارة ملفات تعريف الارتباط',

    // Squad Selection
    'squad.selection': 'اختيار التشكيلة',
    'squad.select_your_team': 'اختر فريقك المكون من 15 لاعباً وادخلهم في الجولات القادمة',
    'squad.total_points': 'النقاط الإجمالية',
    'squad.team_value': 'قيمة الفريق',
    'squad.remaining': 'المتبقي',
    'squad.transfers': 'الانتقالات',
    'squad.pitch_view': 'عرض الملعب',
    'squad.list_view': 'عرض القائمة',
    'squad.captain': 'القائد',
    'squad.vice_captain': 'نائب القائد',
    'squad.goalkeeper': 'حارس مرمى',
    'squad.defender': 'مدافع',
    'squad.midfielder': 'لاعب وسط',
    'squad.forward': 'مهاجم',
    'squad.bench': 'البدلاء',
    'squad.formation': 'التشكيلة',
    'squad.select_player': 'اختيار اللاعب',
    'squad.remove_player': 'إزالة اللاعب',
    'squad.make_captain': 'تعيين كقائد',
    'squad.make_vice_captain': 'تعيين كنائب قائد',
    'squad.player_stats': 'إحصائيات اللاعب',
    'squad.price': 'السعر',
    'squad.points': 'النقاط',
    'squad.team': 'الفريق',
    'squad.position': 'المركز',
    'squad.auto_pick': 'اختيار تلقائي للفريق',
    'squad.save_team': 'حفظ الفريق',
    'squad.reset_team': 'إعادة تعيين الفريق',

    // Currency and Budget
    'budget.remaining': 'الميزانية المتبقية',
    'budget.total': 'إجمالي الميزانية',
    'budget.spent': 'الميزانية المستخدمة',
    'currency.jod': 'د.أ',
    'currency.symbol': 'د.أ',
    'price.format': '{price} د.أ'
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ar')
  const [isLoaded, setIsLoaded] = useState(false)

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key
  }

  const isRTL = language === 'ar'

  useEffect(() => {
    // Initialize after hydration to avoid mismatch
    setIsLoaded(true)

    // Load saved language preference
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      setLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    document.documentElement.lang = language
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'

    // Save language preference
    localStorage.setItem('language', language)
  }, [language, isRTL, isLoaded])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
  }

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage: handleLanguageChange,
      t,
      isRTL,
      isLoaded
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}





