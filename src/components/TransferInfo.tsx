'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useGameweek } from '@/contexts/GameweekContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserTransferState, calculateTransferCost } from '@/lib/fantasyLogic'

interface TransferInfoProps {
  transferState: UserTransferState
  gameweekId: number
  chipsUsed?: any // Add chips info to check wildcard status for this specific gameweek
}

export default function TransferInfo({ transferState, gameweekId, chipsUsed }: TransferInfoProps) {
  const { language, isRTL } = useLanguage()
  const { currentGameweek } = useGameweek()

  // Check if wildcard is active specifically for this gameweek
  const isWildcardActiveForThisGW = chipsUsed && (
    (chipsUsed.wildcard1?.isActive && chipsUsed.wildcard1?.gameweek === gameweekId) ||
    (chipsUsed.wildcard2?.isActive && chipsUsed.wildcard2?.gameweek === gameweekId)
  );

  // Use either chip-specific wildcard status or transfer state wildcard status
  const isWildcardActive = isWildcardActiveForThisGW || transferState.wildcardActive;

  console.log('🔍 TransferInfo wildcard check:', {
    gameweekId,
    isWildcardActiveForThisGW,
    transferStateWildcardActive: transferState.wildcardActive,
    finalIsWildcardActive: isWildcardActive,
    chipsUsed: chipsUsed ? {
      wildcard1: chipsUsed.wildcard1,
      wildcard2: chipsUsed.wildcard2
    } : 'not provided'
  });

  // Calculate current transfer cost for next transfer using the correct wildcard status
  const nextTransferSummary = calculateTransferCost(
    transferState.transfersMadeThisWeek + 1,
    transferState.savedFreeTransfers,
    gameweekId,
    isWildcardActive, // Use the computed wildcard status
    false // freeHit removed
  )

  const getTransferStatusText = () => {
    if (gameweekId === 1) {
      return {
        ar: 'الجولة الأولى - تبديلات مجانية غير محدودة',
        en: 'Gameweek 1 - Unlimited Free Transfers'
      }
    }

    if (isWildcardActive) {
      return {
        ar: `الورقة البرية نشطة للجولة ${gameweekId} - 9999 تبديل مجاني`,
        en: `Wildcard Active for GW${gameweekId} - 9999 Free Transfers`
      }
    }

    if (transferState.freeHitActive) {
      return {
        ar: 'الضربة المجانية نشطة - تبديلات مجانية غير محدودة',
        en: 'Free Hit Active - Unlimited Free Transfers'
      }
    }

    const freeTransfers = transferState.savedFreeTransfers
    const transfersMade = transferState.transfersMadeThisWeek

    return {
      ar: `التبديلات المجانية: ${freeTransfers} | التبديلات المستخدمة: ${transfersMade}`,
      en: `Free Transfers: ${freeTransfers} | Transfers Made: ${transfersMade}`
    }
  }

  const getNextTransferCostText = () => {
    if (gameweekId === 1 || isWildcardActive || transferState.freeHitActive) {
      return {
        ar: isWildcardActive ? `التبديل التالي: مجاني (الورقة البرية للجولة ${gameweekId})` : 'التبديل التالي: مجاني',
        en: isWildcardActive ? `Next Transfer: Free (Wildcard active for GW${gameweekId})` : 'Next Transfer: Free'
      }
    }

    if (nextTransferSummary.paidTransfers > 0) {
      return {
        ar: `التبديل التالي: -${nextTransferSummary.pointsDeducted} نقاط`,
        en: `Next Transfer: -${nextTransferSummary.pointsDeducted} points`
      }
    }

    return {
      ar: 'التبديل التالي: مجاني',
      en: 'Next Transfer: Free'
    }
  }

  const getPointsDeductedText = () => {
    // Don't show point deductions if wildcard or free hit is active, or if we're in GW1
    if (gameweekId === 1 || isWildcardActive || transferState.freeHitActive) {
      return null;
    }
    
    if (transferState.pointsDeductedThisWeek > 0) {
      return {
        ar: `النقاط المخصومة هذا الأسبوع: -${transferState.pointsDeductedThisWeek}`,
        en: `Points Deducted This Week: -${transferState.pointsDeductedThisWeek}`
      }
    }
    return null
  }

  const statusText = getTransferStatusText()
  const nextCostText = getNextTransferCostText()
  const pointsDeductedText = getPointsDeductedText()

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className={`text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
          {language === 'ar' ? 'معلومات التبديلات' : 'Transfer Information'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Status */}
        <div className={`p-3 bg-blue-50 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
          <p className="text-sm font-medium text-blue-800">
            {statusText[language]}
          </p>
        </div>

        {/* Next Transfer Cost */}
        <div className={`p-3 rounded-lg ${isRTL ? 'text-right' : 'text-left'} ${
          nextTransferSummary.paidTransfers > 0 ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <p className={`text-sm font-medium ${
            nextTransferSummary.paidTransfers > 0 ? 'text-red-800' : 'text-green-800'
          }`}>
            {nextCostText[language]}
          </p>
        </div>

        {/* Points Deducted This Week */}
        {pointsDeductedText && (
          <div className={`p-3 bg-red-50 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="text-sm font-medium text-red-800">
              {pointsDeductedText[language]}
            </p>
          </div>
        )}

        {/* Transfer Rules */}
        <div className={`p-3 bg-gray-50 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
          <p className="text-xs text-gray-600">
            {language === 'ar' ? (
              <>
                • الجولة الأولى: تبديلات مجانية غير محدودة<br/>
                • الجولة الثانية فما فوق: تبديل مجاني واحد لكل جولة<br/>
                • التبديلات غير المستخدمة تتراكم (حد أقصى 5)<br/>
                • كل تبديل إضافي = -4 نقاط<br/>
                <span className="font-medium text-blue-600">• الورقة البرية: 9999 تبديل مجاني للجولة المحددة فقط</span>
              </>
            ) : (
              <>
                • GW1: Unlimited free transfers<br/>
                • GW2+: 1 free transfer per gameweek<br/>
                • Unused transfers roll over (max 5)<br/>
                • Each extra transfer = -4 points<br/>
                <span className="font-medium text-blue-600">• Wildcard: 9999 free transfers for the specific gameweek only</span>
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
