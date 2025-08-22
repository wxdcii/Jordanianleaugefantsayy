'use client'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useLanguage } from '@/contexts/LanguageContext'

export default function PrizesPage() {
  const { language, isRTL } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className={`text-center mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-4xl font-bold text-yellow-700 mb-4">
            {isRTL ? 'الجوائز' : 'Prizes'}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {isRTL
              ? 'تعرف على الجوائز المقدمة لأفضل اللاعبين في دوري الفانتازي الأردني!'
              : 'Discover the prizes for the top players in the Jordanian Fantasy League!'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <span className="text-4xl mb-2">🏆</span>
            <h2 className="text-xl font-bold text-yellow-700 mb-2">
              {isRTL ? 'المرحلة الأولى (الذهاب)' : 'First Stage (First Half)'}
            </h2>
            <p className="text-gray-700 text-center">
              {isRTL
                ? 'المركز الأول: 100 دينار'
                : '1st Place: 100 JOD'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <span className="text-4xl mb-2">🏆</span>
            <h2 className="text-xl font-bold text-yellow-700 mb-2">
              {isRTL ? 'المرحلة الثانية (الإياب)' : 'Second Stage (Second Half)'}
            </h2>
            <p className="text-gray-700 text-center">
              {isRTL
                ? 'المركز الأول: 100 دينار'
                : '1st Place: 100 JOD'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <span className="text-5xl mb-4">🥇</span>
            <h2 className="text-2xl font-bold text-yellow-700 mb-2">
              {isRTL ? 'المركز الأول (الدوري كامل)' : '1st Place (Full League)'}
            </h2>
            <p className="text-gray-700 text-center">
              {isRTL
                ? '250 دينار'
                : '250 JOD'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <span className="text-5xl mb-4">🥈</span>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              {isRTL ? 'المركز الثاني (الدوري كامل)' : '2nd Place (Full League)'}
            </h2>
            <p className="text-gray-700 text-center">
              {isRTL
                ? '100 دينار'
                : '100 JOD'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <span className="text-5xl mb-4">🥉</span>
            <h2 className="text-2xl font-bold text-orange-700 mb-2">
              {isRTL ? 'المركز الثالث (الدوري كامل)' : '3rd Place (Full League)'}
            </h2>
            <p className="text-gray-700 text-center">
              {isRTL
                ? '50 دينار'
                : '50 JOD'}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-bold text-yellow-700 mb-2">
            {isRTL ? 'جوائز إضافية' : 'Additional Prizes'}
          </h3>
          <p className="text-gray-700">
            {isRTL
              ? 'قد يتم الإعلان عن جوائز شهرية أو جوائز خاصة للمشاركين النشطين حسب التحديثات.'
              : 'Monthly or special prizes for active participants may be announced according to updates.'}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}