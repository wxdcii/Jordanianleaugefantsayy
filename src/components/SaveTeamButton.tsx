'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { GameweekDeadlineService } from '@/lib/gameweekDeadlineService'

interface SaveTeamButtonProps {
  onSave: () => Promise<void>
  disabled?: boolean
  isValid?: boolean
  validationErrors?: string[]
  playerCount?: number
  hasCaptain?: boolean
  totalValue?: number
  budget?: number
}

export default function SaveTeamButton({
  onSave,
  disabled = false,
  isValid = true,
  validationErrors = [],
  playerCount = 0,
  hasCaptain = false,
  totalValue = 0,
  budget = 100,
}: SaveTeamButtonProps) {
  const { language } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState('')

  // Fetch the open gameweek deadline from the database
  useEffect(() => {
    const checkDeadline = async () => {
      try {
        // Get the open gameweek info (where isOpen === true)
        const openGameweek = await GameweekDeadlineService.getCurrentGameweek()
        if (openGameweek && openGameweek.deadline) {
          const deadlineDate = new Date(openGameweek.deadline)
          setIsDeadlinePassed(Date.now() > deadlineDate.getTime())
          if (Date.now() > deadlineDate.getTime()) {
            setTimeRemaining(language === 'ar' ? 'انتهى الوقت' : 'Deadline Passed')
          } else {
            const diffMs = deadlineDate.getTime() - Date.now()
            const diffMin = Math.floor(diffMs / 60000)
            const diffHr = Math.floor(diffMin / 60)
            const min = diffMin % 60
            setTimeRemaining(
              diffHr > 0
                ? `${diffHr}h ${min}m`
                : `${min}m`
            )
          }
        } else {
          setIsDeadlinePassed(true)
          setTimeRemaining(language === 'ar' ? 'غير معروف' : 'Unknown')
        }
      } catch (error) {
        console.error('Error checking deadline:', error)
        setIsDeadlinePassed(true)
        setTimeRemaining(language === 'ar' ? 'غير معروف' : 'Unknown')
      }
    }

    checkDeadline()
    const interval = setInterval(checkDeadline, 60000)
    return () => clearInterval(interval)
  }, [language])

  const handleSave = async () => {
    if (disabled || saving || isDeadlinePassed) return

    try {
      setSaving(true)
      await onSave()
      setLastSaved(new Date())
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const getButtonText = () => {
    if (saving) {
      return language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'
    }
    if (isDeadlinePassed) {
      return language === 'ar' ? 'انتهى الوقت' : 'Deadline Passed'
    }
    return language === 'ar' ? 'حفظ الفريق' : 'Save Team'
  }

  const getButtonVariant = () => {
    if (isDeadlinePassed) return 'secondary'
    if (!isValid || validationErrors.length > 0) return 'destructive'
    return 'default'
  }

  const canSave = isValid &&
    playerCount === 15 &&
    hasCaptain &&
    totalValue <= budget &&
    !isDeadlinePassed &&
    !saving

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3 text-gray-800">
          {language === 'ar' ? 'حالة التشكيلة' : 'Team Status'}
        </h3>

        <div className="space-y-2">
          {/* Player Count */}
          <div className={`flex items-center justify-between p-2 rounded ${
            playerCount === 15 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <span className="text-sm">
              {language === 'ar' ? 'عدد اللاعبين' : 'Players'}
            </span>
            <span className="font-medium">
              {playerCount}/15 {playerCount === 15 ? '✓' : '✗'}
            </span>
          </div>

          {/* Captain */}
          <div className={`flex items-center justify-between p-2 rounded ${
            hasCaptain ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <span className="text-sm">
              {language === 'ar' ? 'القائد' : 'Captain'}
            </span>
            <span className="font-medium">
              {hasCaptain ? (language === 'ar' ? 'محدد ✓' : 'Selected ✓') : (language === 'ar' ? 'غير محدد ✗' : 'Not Selected ✗')}
            </span>
          </div>

          {/* Budget */}
          <div className={`flex items-center justify-between p-2 rounded ${
            totalValue <= budget ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <span className="text-sm">
              {language === 'ar' ? 'الميزانية' : 'Budget'}
            </span>
            <span className="font-medium">
              {totalValue.toFixed(1)}/{budget.toFixed(1)}M {totalValue <= budget ? '✓' : '✗'}
            </span>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              {language === 'ar' ? 'أخطاء التحقق:' : 'Validation Errors:'}
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span>•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Deadline Info */}
      <div className="text-center text-sm text-gray-600">
        {language === 'ar' ? 'الوقت المتبقي حتى الموعد النهائي:' : 'Time remaining until deadline:'} {timeRemaining}
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={!canSave}
        variant={getButtonVariant()}
        size="lg"
        className="w-full"
      >
        {saving && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2"></div>
        )}
        {getButtonText()}
      </Button>

      {/* Last Saved */}
      {lastSaved && (
        <div className="text-center text-sm text-gray-500">
          {language === 'ar' ? 'آخر حفظ:' : 'Last saved:'} {' '}
          {lastSaved.toLocaleTimeString(language === 'ar' ? 'ar-JO' : 'en-US')}
        </div>
      )}

      {/* Save Tips */}
      {!isDeadlinePassed && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            {language === 'ar' ? 'نصائح الحفظ:' : 'Save Tips:'}
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>
                {language === 'ar'
                  ? 'احفظ فريقك قبل الموعد النهائي'
                  : 'Save your team before the deadline'
                }
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>
                {language === 'ar'
                  ? 'يمكنك تعديل فريقك عدة مرات قبل الموعد النهائي'
                  : 'You can modify your team multiple times before the deadline'
                }
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>
                {language === 'ar'
                  ? 'تأكد من اختيار قائد وتشكيلة صحيحة'
                  : 'Make sure to select a captain and valid formation'
                }
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}