'use client'

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useLanguage } from '@/contexts/LanguageContext'

export default function RulesPage() {
  const { language, isRTL } = useLanguage()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className={`text-center mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {language === 'ar' ? 'قوانين اللعبة' : 'Game Rules'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {language === 'ar' 
              ? 'تعرف على قوانين فانتازي الدوري الأردني للمحترفين' 
              : 'Learn the rules of Fantasy Jordan Pro League'
            }
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-3xl ml-3">👥</span>
              {language === 'ar' ? 'اختيار التشكيلة' : 'Squad Selection'}
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              {language === 'ar' ? (
                <div>
                  <p>• يجب اختيار 15 لاعباً من أندية الدوري الأردني للمحترفين</p>
                  <p>• الميزانية المتاحة: 100 مليون دينار أردني</p>
                  <p>• التشكيلة: 2 حراس مرمى، 5 مدافعين، 5 لاعبي وسط، 3 مهاجمين</p>
                  <p>• لا يمكن اختيار أكثر من 3 لاعبين من نفس النادي</p>
                  <p>•يجب اختيار قائد</p>
                </div>
              ) : (
                <div>
                  <p>• Select 15 players from Jordan Pro League clubs</p>
                  <p>• Budget available: 100 million Jordanian Dinars</p>
                  <p>• Formation: 2 Goalkeepers, 5 Defenders, 5 Midfielders, 3 Forwards</p>
                  <p>• Maximum 3 players from the same club</p>
                  <p>• Must select a captain and </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-3xl ml-3">⚽</span>
              {language === 'ar' ? 'نظام النقاط' : 'Scoring System'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-green-600 mb-3">
                  {language === 'ar' ? 'النقاط الإيجابية' : 'Positive Points'}
                </h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  {language === 'ar' ? (
                    <div>
                      <p>•   المشاركة في المباراة: +2 نقطة في حال لعب اللاعب ستين دقيقه فما فوق , و نقطه واحده في حال لعب اقل من ستين دقيقه</p>
                      <p>• الهدف (مهاجم): +4 نقاط</p>
                      <p>• الهدف (لاعب وسط): +5 نقاط</p>
                      <p>• الهدف (مدافع/حارس): +6 نقاط</p>
                      <p>• التمريرة الحاسمة: +3 نقاط</p>
                      <p>• الحفاظ على النظافة (مدافع/حارس): +4 نقاط</p>
                      <p>• إنقاذ الحارس: +1 نقطة</p>
                      <p>• نقاط القائد: مضاعفة × 2</p>
                      
                    </div>
                  ) : (
                    <div>
                      <p>• Playing in match: +2 points</p>
                      <p>• Goal (Forward): +4 points</p>
                      <p>• Goal (Midfielder): +5 points</p>
                      <p>• Goal (Defender/Goalkeeper): +6 points</p>
                      <p>• Assist: +3 points</p>
                      <p>• Clean sheet (Defender/Goalkeeper): +4 points</p>
                      <p>• Goalkeeper save: +1 point</p>
                      <p>• Captain points: doubled × 2</p>
            
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-3">
                  {language === 'ar' ? 'النقاط السلبية' : 'Negative Points'}
                </h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  {language === 'ar' ? (
                    <div>
                      <p>• البطاقة الصفراء: -1 نقطة</p>
                      <p>• البطاقة الحمراء: -3 نقاط</p>
                      <p>• استقبال هدفين  (حارس و الدفاع): -2 نقطة</p>
                      <p>• ركلة الجزاء المهدرة: -2 نقطة</p>
                      <p>• الهدف الذاتي: -2 نقطة</p>
                    </div>
                  ) : (
                    <div>
                      <p>• Yellow card: -1 point</p>
                      <p>• Red card: -3 points</p>
                      <p>• 2 Goal conceded (Goalkeeper): -2 points</p>
                      <p>• Penalty missed: -2 points</p>
                      <p>• Own goal: -2 points</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-3xl ml-3">⚠️</span>
              {language === 'ar' ? 'ملاحظات مهمة' : 'Important Notes'}
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              {language === 'ar' ? (
                <div>
                  <p>• اللعبة مجانية تماما</p>
                  <p>• يجب تأكيد التشكيلة قبل موعد الإغلاق</p>
                  <p>• اللاعبون المصابون أو المعلقون لا يحصلون على نقاط</p>
                  <p>• تحديث النقاط يتم خلال ساعة الى ساعتين من انتهاء المباراة</p>
                  <p>• القرارات النهائية للنقاط تعود للجمهور , بحيث انه سيكون هنالك تصويت على صفحات اللعبه الرسميه </p>
                </div>
              ) : (
                <div>
                  <p>• The game is completely free to play</p>
                  <p>• Must confirm lineup before deadline</p>
                  <p>• Injured or suspended players get no points</p>
                  <p>• Points updated within 24 hours of match end</p>
                  <p>• If player doesn't play, bench player auto-substitutes</p>
                  <p>• Final point decisions rest with game management</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}

