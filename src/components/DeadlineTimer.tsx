'use client'

import { useGameweek } from '@/contexts/GameweekContext'
import { useLanguage } from '@/contexts/LanguageContext'

export default function DeadlineTimer() {
  const { currentGameweek, timeUntilDeadline, isDeadlinePassed, loading } = useGameweek()
  const { language } = useLanguage()

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent animate-spin rounded-full mr-2"></div>
          <span className="text-blue-700">
            {language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}
          </span>
        </div>
      </div>
    )
  }

  if (!currentGameweek) {
    return null
  }

  const deadlineDate = new Date(currentGameweek.deadline)
  const formattedDeadline = deadlineDate.toLocaleDateString(language === 'ar' ? 'ar-JO' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return (
    <div className={`rounded-lg p-4 border ${
      isDeadlinePassed 
        ? 'bg-red-50 border-red-200' 
        : timeUntilDeadline.includes('h') && !timeUntilDeadline.includes('d')
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-semibold ${
            isDeadlinePassed ? 'text-red-800' : 'text-gray-800'
          }`}>
            {currentGameweek.name}
          </h3>

        </div>
        
        <div className="text-right">
          {isDeadlinePassed ? (
            <div className="text-red-600 font-bold">
              <div className="text-lg">⏰</div>
              <div className="text-sm">
                {language === 'ar' ? 'انتهى الوقت' : 'Deadline Passed'}
              </div>
            </div>
          ) : (
            <div className={`font-bold ${
              timeUntilDeadline.includes('h') && !timeUntilDeadline.includes('d')
                ? 'text-yellow-600'
                : 'text-green-600'
            }`}>
              <div className="text-lg">⏱️</div>
              <div className="text-sm">
                {timeUntilDeadline}
              </div>
              <div className="text-xs opacity-75">
                {language === 'ar' ? 'متبقي' : 'remaining'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning for last few hours */}
      {!isDeadlinePassed && timeUntilDeadline.includes('h') && !timeUntilDeadline.includes('d') && (
        <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>
              {language === 'ar' 
                ? 'تحذير: الموعد النهائي قريب! تأكد من حفظ تشكيلتك.'
                : 'Warning: Deadline approaching! Make sure to save your team.'
              }
            </span>
          </div>
        </div>
      )}

      {/* Deadline passed message */}
      {isDeadlinePassed && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
          <div className="flex items-center gap-2">
            <span>🚫</span>
            <span>
              {language === 'ar'
                ? 'لا يمكن إجراء تغييرات بعد انتهاء الوقت.'
                : 'No changes can be made after the time has passed.'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
