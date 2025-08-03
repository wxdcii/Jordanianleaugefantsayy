'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    teamName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signup, loginWithGoogle } = useAuth()
  const { t, language, isRTL } = useLanguage()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.displayName) {
      return language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields'
    }

    if (formData.password.length < 6) {
      return language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      return language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setError('')
      setLoading(true)
      await signup(formData.email, formData.password, formData.displayName)
      router.push('/squad-selection')
    } catch (error) {
      console.error('Registration error:', error)
      let errorMessage = language === 'ar'
        ? 'فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى'
        : 'Failed to create account. Please try again.'

      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string }
        if (firebaseError.code === 'auth/email-already-in-use') {
          errorMessage = language === 'ar'
            ? 'البريد الإلكتروني مستخدم بالفعل'
            : 'Email address is already in use'
        } else if (firebaseError.code === 'auth/weak-password') {
          errorMessage = language === 'ar'
            ? 'كلمة المرور ضعيفة جداً'
            : 'Password is too weak'
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = language === 'ar'
            ? 'البريد الإلكتروني غير صالح'
            : 'Invalid email address'
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setError('')
      setLoading(true)
      await loginWithGoogle()
      router.push('/squad-selection')
    } catch (error) {
      console.error('Google signup error:', error)
      setError(
        language === 'ar'
          ? 'فشل في التسجيل باستخدام Google'
          : 'Failed to sign up with Google'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen relative overflow-hidden flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Fantasy Football Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-700">
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
        <div className="absolute top-1/2 left-10 text-white/20 text-2xl animate-pulse" style={{animationDelay: '1.5s'}}>🎯</div>

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
              {language === 'ar' ? 'إنشاء حساب جديد' : 'Join Fantasy League'}
            </CardTitle>
            <p className="text-blue-100 text-lg">
              {language === 'ar'
                ? 'أنشئ حسابك وابدأ في بناء فريق أحلامك'
                : 'Create your account and start building your dream team'
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
                  {language === 'ar' ? 'الاسم الكامل' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-white/40 rounded-xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  disabled={loading}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-white/40 rounded-xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                  disabled={loading}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  {language === 'ar' ? 'اسم الفريق' : 'Team Name'}
                  <span className="text-white/70 text-xs ml-1">
                    ({language === 'ar' ? 'اختياري' : 'Optional'})
                  </span>
                </label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-white/40 rounded-xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder={language === 'ar' ? 'اختر اسماً لفريقك' : 'Choose a name for your team'}
                  disabled={loading}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'} *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-white/40 rounded-xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور (6 أحرف على الأقل)' : 'Enter password (min 6 characters)'}
                  disabled={loading}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-white/40 rounded-xl bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter your password'}
                  disabled={loading}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-400 to-blue-500 text-white hover:from-purple-300 hover:to-blue-400 font-bold py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 text-lg"
                disabled={loading}
              >
                {loading
                  ? (language === 'ar' ? 'جارٍ إنشاء الحساب...' : 'Creating Account...')
                  : (language === 'ar' ? 'إنشاء حساب' : 'Create Account')
                }
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/40" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gradient-to-r from-blue-800 to-purple-800 px-4 py-1 rounded-full text-white/90 font-medium">
                  {language === 'ar' ? 'أو' : 'OR'}
                </span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignup}
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
              {language === 'ar' ? 'التسجيل باستخدام Google' : 'Sign up with Google'}
            </Button>

            <div className="text-center pt-4">
              <p className="text-white/90 text-sm">
                {language === 'ar' ? 'لديك حساب بالفعل؟' : "Already have an account?"}{' '}
                <Link
                  href="/login"
                  className="text-purple-400 hover:text-purple-300 font-bold underline transition-colors duration-300"
                >
                  {language === 'ar' ? 'سجل دخولك' : 'Sign in'}
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
