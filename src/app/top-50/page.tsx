'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useLanguage } from '@/contexts/LanguageContext'
import Top50Leaderboard from '@/components/Top50Leaderboard'
import { Trophy, Users, Target } from 'lucide-react'

export default function Top50LeaderboardPage() {
  const { language, isRTL } = useLanguage()

  const translations = {
    en: {
      title: 'Top 50 Fantasy Players',
      subtitle: 'Discover the best performing fantasy managers in the league',
      description: 'Click on any player to view their squad formation and player selections.',
      features: {
        clickable: 'Interactive Player Cards',
        clickableDesc: 'Click on any player to view their complete squad',
        formations: 'Squad Formations',
        formationsDesc: 'See how top managers structure their teams',
        strategies: 'Winning Strategies',
        strategiesDesc: 'Learn from the best performing lineups'
      }
    },
    ar: {
      title: 'أفضل 50 لاعب فانتازي',
      subtitle: 'اكتشف أفضل مدراء الفانتازي في الدوري',
      description: 'انقر على أي لاعب لعرض تشكيلة فريقه واختياراته للاعبين.',
      features: {
        clickable: 'بطاقات لاعبين تفاعلية',
        clickableDesc: 'انقر على أي لاعب لعرض تشكيلته الكاملة',
        formations: 'تشكيلات الفرق',
        formationsDesc: 'شاهد كيف ينظم أفضل المدراء فرقهم',
        strategies: 'استراتيجيات الفوز',
        strategiesDesc: 'تعلم من أفضل التشكيلات أداءً'
      }
    }
  }

  const t = translations[language as keyof typeof translations]

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              {t.title}
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-4 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-800 text-sm">
              💡 {t.description}
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center mb-3">
              <Users className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">{t.features.clickable}</h3>
            </div>
            <p className="text-gray-600 text-sm">{t.features.clickableDesc}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center mb-3">
              <Target className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-900">{t.features.formations}</h3>
            </div>
            <p className="text-gray-600 text-sm">{t.features.formationsDesc}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center mb-3">
              <Trophy className="w-6 h-6 text-yellow-600 mr-2" />
              <h3 className="font-semibold text-gray-900">{t.features.strategies}</h3>
            </div>
            <p className="text-gray-600 text-sm">{t.features.strategiesDesc}</p>
          </div>
        </div>

        {/* Leaderboard */}
        <Top50Leaderboard className="max-w-4xl mx-auto" />
      </main>

      <Footer />
    </div>
  )
}
