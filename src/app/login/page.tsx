'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login, loginWithGoogle } = useAuth()
  const { t, language, isRTL } = useLanguage()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields')
      return
    }

    try {
      setError('')
      setLoading(true)
      await login(email, password)
      router.push('/squad-selection')
    } catch (error) {
      console.error('Login error:', error)
      setError(
        language === 'ar'
          ? 'فشل في تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور'
          : 'Failed to log in. Please check your email and password.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setError('')
      setLoading(true)
      await loginWithGoogle()
      router.push('/squad-selection')
    } catch (error) {
      console.error('Google login error:', error)
      setError(
        language === 'ar'
          ? 'فشل في تسجيل الدخول باستخدام Google'
          : 'Failed to log in with Google'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen relative overflow-hidden flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Fantasy Football Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-emerald-800 to-green-700">
        {/* Football Field Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-64 border-2 border-white rounded-lg"></div>
          <div className="absolute top-1/3 left-1/3 w-32 h-32 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-48 border-2 border-white rounded-lg"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-full border-l-2 border-white"></div>
        </div>

        {/* Floating Football Icons */}
        <div className="absolute top-20 left-20 text-white/20 text-4xl animate-bounce">⚽</div>
        <div className="absolute top-40 right-32 text-white/20 text-3xl animate-pulse">🏆</div>
        <div className="absolute bottom-32 left-40 text-white/20 text-2xl animate-bounce" style={{animationDelay: '1s'}}>⚽</div>
        <div className="absolute bottom-20 right-20 text-white/20 text-3xl animate-pulse" style={{animationDelay: '2s'}}>🥅</div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mb-6">
              {/* Website Logo */}
              <div className="flex justify-center mx-auto mb-4">
                <Image
                  src="/images/logo.png"
                  alt="Jordan Fantasy Football Logo"
                  width={160}
                  height={160}
                  className="object-contain shadow-lg"
                />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-2">
              {language === 'ar' ? 'تسجيل الدخول' : 'Welcome Back'}
            </CardTitle>
            <p className="text-green-100 text-lg">
              {language === 'ar'
                ? 'ادخل إلى حساب الفانتازي الخاص بك'
                : 'Sign in to your Fantasy account'
              }
            </p>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-8">
            {error && (
              <div className="bg-red-500/30 border border-red-400/50 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-red-100 text-sm text-center font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 border border-white/40 rounded-xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                  disabled={loading}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 border border-white/40 rounded-xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                  disabled={loading}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-green-900 hover:from-yellow-300 hover:to-orange-400 font-bold py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 text-lg"
                disabled={loading}
              >
                {loading
                  ? (language === 'ar' ? 'جارٍ تسجيل الدخول...' : 'Signing In...')
                  : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')
                }
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/40" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gradient-to-r from-green-800 to-emerald-800 px-4 py-1 rounded-full text-white/90 font-medium">
                  {language === 'ar' ? 'أو' : 'OR'}
                </span>
              </div>
            </div>

            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full border-white/40 bg-white/10 text-white hover:bg-white/20 py-4 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm"
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {language === 'ar' ? 'تسجيل الدخول باستخدام Google' : 'Continue with Google'}
            </Button>

            <div className="text-center pt-4">
              <p className="text-white/90 text-sm">
                {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
                <Link
                  href="/register"
                  className="text-yellow-400 hover:text-yellow-300 font-bold underline transition-colors duration-300"
                >
                  {language === 'ar' ? 'سجل الآن' : 'Sign up'}
                </Link>
              </p>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/"
                className="text-white/70 hover:text-white/90 text-sm transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <span>{language === 'ar' ? '← العودة للرئيسية' : '← Back to Home'}</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
