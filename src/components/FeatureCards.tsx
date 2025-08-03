'use client'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export function FeatureCards() {
  const { isRTL } = useLanguage()

  const features = [
    {
      icon: '🧠',
      title: isRTL ? 'ذكاء تكتيكي' : 'Tactical Intelligence',
      description: isRTL 
        ? 'اختر تشكيلتك بحرية وعدّل فريقك كل جولة!'
        : 'Choose your formation freely and modify your team every round!',
      href: '/squad-selection'
    },
    {
      icon: '👟',
      title: isRTL ? 'نجوم الدوري' : 'League Stars',
      description: isRTL 
        ? 'راقب أداء اللاعبين، اختر الأفضل منهم لفريقك، ونافس على القمة!'
        : 'Monitor player performance, choose the best for your team, and compete for the top!',
      href: '/players'
    },
    {
      icon: '🏆',
      title: isRTL ? 'أندية الدوري الأردني' : 'Jordan League Clubs',
      description: isRTL 
        ? 'تابع فرقك المفضلة بتصميم فريد لكل نادٍ — الشعار، الألوان، والملعب.'
        : 'Follow your favorite teams with unique design for each club — logo, colors, and stadium.',
      href: '/clubs'
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link key={index} href={feature.href}>
              <div className="bg-gray-70 rounded-xl p-8 md:p-16 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer min-h-[300px] md:min-h-[400px]">
                <div className="text-5xl md:text-6xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  {feature.title}
                </h3>
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}



