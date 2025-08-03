'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'

export function HeroSection() {
  const { t, isRTL } = useLanguage()
  const { user } = useAuth()

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black overflow-hidden">
      {/* Stadium Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60 z-10"></div>
        <Image
          src="https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=2070"
          alt="Football Stadium"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Stadium Lights */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        <div className="absolute top-20 left-20 w-4 h-4 bg-yellow-300 rounded-full blur-sm animate-pulse"></div>
        <div className="absolute top-32 right-32 w-3 h-3 bg-yellow-300 rounded-full blur-sm animate-pulse delay-200"></div>
        <div className="absolute top-40 left-1/3 w-2 h-2 bg-yellow-300 rounded-full blur-sm animate-pulse delay-400"></div>
        <div className="absolute top-28 right-1/4 w-3 h-3 bg-yellow-300 rounded-full blur-sm animate-pulse delay-600"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-40 container mx-auto px-4 py-20 min-h-screen flex items-center">
        <div className="max-w-2xl">
          {/* Main Heading */}
          <h1 className="text-6xl lg:text-7xl font-black text-white leading-tight mb-8">
            {isRTL ? (
              <>
                <span className="block">ارتقِ بفريق</span>
                
                <span className="block text-orange-400">الفانتازي</span>
              </>
            ) : (
              <>
                <span className="block">Elevate Your</span>
                <span className="block text-orange-400">Fantasy</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            {isRTL 
              ? 'هيمن على الدوري بتكتيكات واختيارات و استراتيجية مدروسة'
              : 'Dominate Your League with Insider Tactics and Strategic Player Selections'
            }
          </p>

          {/* CTA Buttons */}
          {!user && (
            <div className="flex flex-col sm:flex-row gap-6">
              <Link 
                href="/register" 
                className="group px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                <span className="flex items-center justify-center gap-3">
                  {isRTL ? 'إنشاء حساب' : 'Sign Up'}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
              
              <Link 
                href="/login" 
                className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-bold text-lg rounded-lg hover:bg-white/10 transition-all duration-300"
              >
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}





