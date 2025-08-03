'use client'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

export function DevelopmentTeam() {
  const { isRTL } = useLanguage()

  return (
    <section className="py-20 bg-gradient-to-br from-slate-100 to-gray-200 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-orange-500 rounded-full"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-blue-500 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-orange-400 rounded-full"></div>
        <div className="absolute bottom-40 right-1/3 w-14 h-14 bg-blue-400 rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          
          {/* Left Side - Content */}
          <div className="space-y-6">
            
            
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
              {isRTL ? (
                <>
                  تعرف على
                  <br />
                  <span className="text-orange-500">فريق التطوير </span>
                </>
              ) : (
                <>
                  Immerse
                  <br />
                  Yourself in the
                  <br />
                  <span className="text-orange-500">Development</span>
                </>
              )}
            </h2>

            

            {/* Main Developer */}
            <div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-md">
             <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {isRTL ? 'المهندس عمار مخلد المشاقبه' : 'Engineer Ammar Mukhallad Al-Mashaqbeh'}
                </h3>
                <h4 className="font-bold text-slate-900 mb-2 text-sm">
                  {isRTL ? 'مهندس برمجيات' : 'Software engineer'}
                </h4>
                <p className="text-orange-500 font-semibold text-lg mb-3">
                  {isRTL ? 'بكل فخر، هذا المشروع من تأسيسي وبرمجتي الكاملة، صُمم ليقدّم تجربة فانتازي فريدة تعبّر عن شغفنا الأصيل بكرة القدم الأردنية.' : 'Lead Developer & Project Creator'}
                </p>
               
              </div>
            </div>

            <div className="flex justify-center gap-6 mt-4">
              <a 
                href="mailto:ammarralhawamdeh@gmail.com" 
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title={isRTL ? 'راسلني عبر البريد الإلكتروني' : 'Email me'}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                <span className="text-sm font-medium">
                  {isRTL ? 'راسلني' : 'Email'}
                </span>
              </a>
              
              <a 
                href="https://www.linkedin.com/in/ammaralhawamdeh" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-3 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
                title={isRTL ? 'تواصل معي عبر لينكد إن' : 'Connect on LinkedIn'}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium">
                  {isRTL ? 'لينكد إن' : 'LinkedIn'}
                </span>
              </a>
            </div>
          </div>

          {/* Right Side - Developer Image */}
          <div className="relative">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl">
              <div className="relative">
                <Image
                  src="https://ammaralhawamdeh.vercel.app/profile.jpg"
                  alt="Ammar Al-Mashaqbeh"
                  width={500}
                  height={500}
                  className="w-full h-full object-cover"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Special Thanks Section - Separate */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <Image
                  src="data:image/jpeg;base64,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"
                  alt="ٍshams sport"
                  width={500}
                  height={500}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 text-lg">
                  {isRTL ? 'شكر خاص لـ شمس سبورت' : 'Special Thanks to Ahmad'}
                </h4>
                <p className="text-blue-600 text-sm">
                  {isRTL ? 'مورد معلومات ' : 'data provider '}
                </p>
              </div>
            </div>
            <p className="text-blue-700">
{isRTL 
  ? 'شكر لشمس سبورت على توفير بيانات دقيقة دعمت تطوير المشروع'
  : 'Thanks to Shams Sport for providing reliable data that supported the project'
}

            </p>
          </div>
        </div>
      </div>
    </section>
  )
}






