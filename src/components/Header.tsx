'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

export function Header() {
  const { language, setLanguage, t, isRTL } = useLanguage()
  const { user, userProfile, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isHomePage = pathname === '/'

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className={isHomePage ? "absolute top-0 left-0 right-0 z-50 backdrop-blur-sm" : "sticky top-0 left-0 right-0 z-50 bg-slate-900"}>
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <Image
              src="/images/logo.png"
              alt="Jordan Fantasy Logo"
              width={120}
              height={120}
              className="md:w-[150px] md:h-[150px] object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            />
            <span className="text-xl md:text-2xl font-black text-white">
              {isRTL ? ' فانتازي الدوري الأردني' : 'Jordan Fantasy'}
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

             {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-white hover:text-orange-400 transition-colors text-lg font-bold">
              {isRTL ? 'الرئيسية' : 'Home'}
            </Link>
            <Link href="/clubs" className="text-white hover:text-orange-400 transition-colors text-lg font-bold">
              {isRTL ? 'الأندية' : 'Clubs'}
            </Link>
            <Link href="/rules" className="text-white hover:text-orange-400 transition-colors text-lg font-bold">
              {isRTL ? 'القوانين' : 'Rules'}
            </Link>
            <Link href="/prizes" className="text-white hover:text-orange-400 transition-colors text-lg font-bold">
              {isRTL ? 'الجوائز' : 'Prizes'}
            </Link>
            <Link href="/squad-selection" className="text-white hover:text-orange-400 transition-colors text-lg font-bold">
              {isRTL ? 'الفانتازي' : 'Fantasy'}
            </Link>
            <Link href="/players" className="text-white hover:text-orange-400 transition-colors text-lg font-bold">
              {isRTL ? 'اللاعبين' : 'Players'}
            </Link>
            {user && (
              <>
                <Link href="/my-points" className="text-white hover:text-orange-400 transition-colors text-lg font-bold">
                  {isRTL ? 'نقاطي' : 'My Points'}
                </Link>
                <Link href="/leagues" className="text-white hover:text-orange-400 transition-colors text-lg font-bold">
                  {isRTL ? 'الدوريات' : 'Leagues'}
                </Link>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Social Media Links */}
            <a href="https://www.instagram.com/jordanianfantasy?igsh=MWt6aGdpOGxueXpmYg==" className="text-white hover:text-orange-400 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/share/18x5UGYZCD/?mibextid=wwXIfr" className="text-white hover:text-orange-400 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="text-white hover:text-orange-400 transition-colors font-bold"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>

            {/* Auth Buttons */}
            {user ? (
              <button
                onClick={handleLogout}
                className="text-white hover:text-orange-400 transition-colors font-bold"
              >
                {isRTL ? 'خروج' : 'Logout'}
              </button>
            ) : (
              <Link 
                href="/register" 
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all duration-300"
              >
                {isRTL ? 'اشترك' : 'Sign Up'}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

            {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-600 bg-slate-900 rounded-lg shadow-lg">
            <div className="flex flex-col space-y-5 pt-4 px-4">
              <Link href="/" className="text-white hover:text-orange-400 transition-colors text-lg font-bold py-2 rounded">
                {isRTL ? 'الرئيسية' : 'Home'}
              </Link>
              <Link href="/clubs" className="text-white hover:text-orange-400 transition-colors text-lg font-bold py-2 rounded">
                {isRTL ? 'الأندية' : 'Clubs'}
              </Link>
              <Link href="/rules" className="text-white hover:text-orange-400 transition-colors text-lg font-bold py-2 rounded">
                {isRTL ? 'القوانين' : 'Rules'}
              </Link>
              <Link href="/prizes" className="text-white hover:text-orange-400 transition-colors text-lg font-bold py-2 rounded">
                {isRTL ? 'الجوائز' : 'Prizes'}
              </Link>
              <Link href="/squad-selection" className="text-white hover:text-orange-400 transition-colors text-lg font-bold py-2 rounded">
                {isRTL ? 'الفانتازي' : 'Fantasy'}
              </Link>
              <Link href="/players" className="text-white hover:text-orange-400 transition-colors text-lg font-bold py-2 rounded">
                {isRTL ? 'اللاعبين' : 'Players'}
              </Link>
              {user && (
                <>
                  <Link href="/my-points" className="text-white hover:text-orange-400 transition-colors text-lg font-bold py-2 rounded">
                    {isRTL ? 'نقاطي' : 'My Points'}
                  </Link>
                  <Link href="/leagues" className="text-white hover:text-orange-400 transition-colors text-lg font-bold py-2 rounded">
                    {isRTL ? 'الدوريات' : 'Leagues'}
                  </Link>
                </>
              )}

              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="text-left text-white hover:text-orange-400 transition-colors font-bold"
              >
                {language === 'en' ? 'العربية' : 'English'}
              </button>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-left text-white hover:text-orange-400 transition-colors font-bold"
                >
                  {isRTL ? 'خروج' : 'Logout'}
                </button>
              ) : (
                <Link 
                  href="/register" 
                  className="inline-block px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-all text-center"
                >
                  {isRTL ? 'اشترك' : 'Sign Up'}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}



















