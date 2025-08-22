'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

export function Footer() {
  const { isRTL } = useLanguage()

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Logo & Copyright */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
             <Image
                           src="/images/logo.png"
                           alt="Jordan Fantasy Logo"
                           width={150}
                           height={150}
                           className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                         />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              © 2025 Jordanian Fantasy
            </p>
            <p className="text-sm text-gray-400">
              All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">
              {isRTL ? 'روابط سريعة' : 'Quick Links'}
            </h3>
            <div className="space-y-2">
              <Link href="/clubs" className="block text-gray-400 hover:text-white transition-colors">
                {isRTL ? 'الأندية' : 'Clubs'}
              </Link>
              <Link href="/players" className="block text-gray-400 hover:text-white transition-colors">
                {isRTL ? 'اللاعبين' : 'Players'}
              </Link>
              <Link href="/fantasy" className="block text-gray-400 hover:text-white transition-colors">
                {isRTL ? 'الفانتازي' : 'Fantasy'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}




