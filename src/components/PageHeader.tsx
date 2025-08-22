'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export function PageHeader() {
  const { language, setLanguage, isRTL } = useLanguage()
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {/* Spacer for fixed header */}
      <div className="h-24"></div>
      
      <header className="bg-slate-900 text-white">
        <nav className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Jordan Fantasy Logo"
                width={100}
                height={100}
                className="object-contain"
              />
              <span className="text-2xl font-black">
                {isRTL ? 'فانتازي الأردن' : 'Jordan Fantasy'}
              </span>
            </Link>

            {/* Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/table" className="hover:text-orange-400 transition-colors">
                {isRTL ? 'الجدول' : 'Table'}
              </Link>
              <Link href="/clubs" className="hover:text-orange-400 transition-colors">
                {isRTL ? 'الأندية' : 'Clubs'}
              </Link>
              <Link href="/team-comparison" className="hover:text-orange-400 transition-colors">
                {isRTL ? 'مقارنة الفرق' : 'Compare Teams'}
              </Link>
              <Link href="/rules" className="hover:text-orange-400 transition-colors">
                {isRTL ? 'القوانين' : 'Rules'}
              </Link>
              <Link href="/squad-selection" className="hover:text-orange-400 transition-colors">
                {isRTL ? 'الفانتازي' : 'Fantasy'}
              </Link>
              <Link href="/players" className="hover:text-orange-400 transition-colors">
                {isRTL ? 'اللاعبين' : 'Players'}
              </Link>
              {user && (
                <Link href="/my-points" className="hover:text-orange-400 transition-colors">
                  {isRTL ? 'نقاطي' : 'My Points'}
                </Link>
              )}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="hover:text-orange-400 transition-colors font-bold"
              >
                {language === 'en' ? 'العربية' : 'English'}
              </button>

              {user ? (
                <button
                  onClick={handleLogout}
                  className="hover:text-orange-400 transition-colors font-bold"
                >
                  {isRTL ? 'خروج' : 'Logout'}
                </button>
              ) : (
                <Link 
                  href="/register" 
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-all"
                >
                  {isRTL ? 'اشترك' : 'Sign Up'}
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>
    </>
  )
}

