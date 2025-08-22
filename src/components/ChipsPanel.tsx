'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useGameweek } from '@/contexts/GameweekContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChipsUsed, UserTransferState, canUseChipWithTransfers } from '@/lib/fantasyLogic'
import { useAuth } from '@/contexts/AuthContext'
import { GameweekDeadlineService } from '@/lib/gameweekDeadlineService'

interface ChipsPanelProps {
  chipsUsed: ChipsUsed
  transferState: UserTransferState
  onChipActivate: (newChipsUsed: ChipsUsed) => void
  disabled?: boolean
}

export default function ChipsPanel({ chipsUsed, transferState, onChipActivate, disabled = false }: ChipsPanelProps) {
  const { language, isRTL } = useLanguage()
  const { currentGameweek, isDeadlinePassed, isGameweekOpen, deactivateChipsForGameweek } = useGameweek()
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null)
  const [wildcard1Available, setWildcard1Available] = useState(false)
  const [wildcard2Available, setWildcard2Available] = useState(false)
  const previousGameweekRef = useRef<number | null>(null)

  // Check wildcard availability based on database
  useEffect(() => {
    const checkWildcardAvailability = async () => {
      try {
        // Check if any gameweek in GW2-13 is open for Wildcard 1
        const wildcard1Open = await GameweekDeadlineService.isAnyGameweekOpenInRange(2, 13)
        setWildcard1Available(wildcard1Open)

        // Check if any gameweek in GW14-27 is open for Wildcard 2
        const wildcard2Open = await GameweekDeadlineService.isAnyGameweekOpenInRange(14, 27)
        setWildcard2Available(wildcard2Open)

        console.log('🎯 Wildcard availability check:', {
          wildcard1Available: wildcard1Open,
          wildcard2Available: wildcard2Open,
          currentGameweek: currentGameweek?.id || 1,
          isGameweekOpen
        })
      } catch (error) {
        console.error('❌ Error checking wildcard availability:', error)
      }
    }

    checkWildcardAvailability()
  }, [currentGameweek, isGameweekOpen])

  // Handle gameweek changes and deactivate chips
  useEffect(() => {
    const currentGameweekId = currentGameweek?.id

    if (currentGameweekId && previousGameweekRef.current &&
        previousGameweekRef.current !== currentGameweekId && user) {

      console.log(`🔄 Gameweek changed from ${previousGameweekRef.current} to ${currentGameweekId}`)

      // Deactivate chips from previous gameweek
      deactivateChipsForGameweek(user.uid, previousGameweekRef.current)
        .then((updatedChips) => {
          if (updatedChips) {
            console.log('✅ Chips deactivated after gameweek change:', updatedChips)
            onChipActivate(updatedChips)
          }
        })
        .catch((error) => {
          console.error('❌ Failed to deactivate chips:', error)
        })
    }

    // Update the previous gameweek reference
    if (currentGameweekId) {
      previousGameweekRef.current = currentGameweekId
    }
  }, [currentGameweek?.id, user, deactivateChipsForGameweek, onChipActivate])

  const handleChipActivation = async (chipType: keyof ChipsUsed) => {
    if (loading || disabled || !user) return

    // Check if chip is already active
    if (chipsUsed[chipType].isActive) {
      alert('Chip is already active and cannot be deactivated!')
      return
    }

    // Check if gameweek is open
    if (!isGameweekOpen) {
      alert('You cannot activate chips in a closed gameweek!')
      return
    }

    // Show confirmation modal
    setShowConfirmModal(chipType)
  }

  const confirmChipActivation = async (chipType: keyof ChipsUsed) => {
    if (!user) return

    try {
      setLoading(chipType)
      setShowConfirmModal(null)

      console.log('Activating chip:', chipType, 'Current state:', chipsUsed[chipType])
      console.log('Current gameweek:', currentGameweek?.id)
      console.log('Transfer state:', transferState)

      const gameweekId = currentGameweek?.id || 1
      console.log('🎯 Gameweek ID being passed to validation:', gameweekId)

      // Validate chip usage
      const validation = canUseChipWithTransfers(chipType, chipsUsed, gameweekId, transferState, isDeadlinePassed)
      if (!validation.canUse) {
        alert(validation.reason || 'Cannot use this chip')
        return
      }

      // Use the API to activate chip (no deactivation allowed)
      const response = await fetch('/api/chips', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          chipType,
          currentGameweek: currentGameweek?.id || 1,
          activate: true,
          transferState
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update chip')
      }

      const data = await response.json()
      // Cast the response to the proper ChipsUsed type
      onChipActivate(data.chipsUsed as ChipsUsed)
      alert(data.message)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update chip'
      alert(errorMessage)
    } finally {
      setLoading(null)
    }
  }

  const currentGameweekId = currentGameweek?.id || 1

  // Helper function to check if a chip is active in the current gameweek
  const isChipActiveInCurrentGW = (chip: ChipsUsed[keyof ChipsUsed]) => {
    const result = chip.isActive && chip.gameweek === currentGameweekId;
    console.log(`🔍 isChipActiveInCurrentGW:`, {
      chip,
      isActive: chip.isActive,
      chipGameweek: chip.gameweek,
      currentGameweekId,
      result
    });
    return result;
  };

  // Check if any chip is currently active in this gameweek
  const hasActiveChipInCurrentGW = Object.values(chipsUsed).some(
    (chip) => isChipActiveInCurrentGW(chip as ChipsUsed[keyof ChipsUsed])
  );

  // Helper function to check if a chip can be used
  const canUseChip = (chipType: keyof ChipsUsed) => {
    const chip = chipsUsed[chipType];

    console.log(`🔍 Checking if ${chipType} can be used:`, {
      chipType,
      chip,
      isUsed: chip.used,
      isDeadlinePassed,
      currentGameweekId,
      isChipActiveInCurrentGW: isChipActiveInCurrentGW(chip),
      hasActiveChipInCurrentGW
    });

    // If chip is already used, can't use again
    if (chip.used) {
      console.log(`❌ ${chipType} already used in GW${chip.gameweek}`);
      return false;
    }

    // If deadline passed, can't use
    if (isDeadlinePassed) {
      console.log(`❌ ${chipType} blocked - deadline passed`);
      return false;
    }

    // Check if another chip is active in the CURRENT gameweek only
    const otherActiveChips = Object.entries(chipsUsed)
      .filter(([key]) => key !== chipType)
      .filter(([_, otherChip]) => otherChip.isActive && otherChip.gameweek === currentGameweekId);

    if (otherActiveChips.length > 0) {
      console.log(`❌ ${chipType} blocked - other chip active in current GW${currentGameweekId}:`, otherActiveChips);
      console.log('🔍 Active chip details:', otherActiveChips.map(([key, chip]) => ({
        chipType: key,
        isActive: chip.isActive,
        gameweek: chip.gameweek,
        used: chip.used
      })));
      return false;
    }

    // Log chips active in other gameweeks (for debugging, but don't block)
    const chipsActiveInOtherGWs = Object.entries(chipsUsed)
      .filter(([key]) => key !== chipType)
      .filter(([_, otherChip]) => otherChip.isActive && otherChip.gameweek !== currentGameweekId);

    if (chipsActiveInOtherGWs.length > 0) {
      console.log(`ℹ️ Chips active in other gameweeks (not blocking):`, chipsActiveInOtherGWs.map(([key, chip]) => ({
        chipType: key,
        gameweek: chip.gameweek,
        currentGW: currentGameweekId
      })));
    }

    console.log(`✅ ${chipType} can be used`);
    return true;
  };

  // Debug logging
  console.log('🎮 ChipsPanel Debug:', {
    currentGameweekId,
    currentGameweekObject: currentGameweek,
    chipsUsed,
    hasActiveChipInCurrentGW,
    isDeadlinePassed,
    isGameweekOpen,
    chipsActiveInCurrentGW: Object.entries(chipsUsed).filter(([_, chip]) => isChipActiveInCurrentGW(chip)),
    allActiveChips: Object.entries(chipsUsed).filter(([_, chip]) => chip.isActive)
  });

  const chipInfo = [
    {
      key: 'wildcard1' as keyof ChipsUsed,
      nameEn: 'Wildcard 1',
      nameAr: 'الوايلد كارد الأول',
      descriptionEn: 'Unlimited transfers (available when GW2-13 are open)',
      descriptionAr: 'انتقالات غير محدودة (متاح عند فتح الجولات 2-13)',
      icon: '🃏',
      isUsed: chipsUsed.wildcard1.used,
      isActive: isChipActiveInCurrentGW(chipsUsed.wildcard1),
      gameweekUsed: chipsUsed.wildcard1.gameweek,
      canUse: canUseChip('wildcard1') && wildcard1Available,
      canUseInGW1: false
    },
    {
      key: 'wildcard2' as keyof ChipsUsed,
      nameEn: 'Wildcard 2',
      nameAr: 'الوايلد كارد الثاني',
      descriptionEn: 'Unlimited transfers (available when GW14-27 are open)',
      descriptionAr: 'انتقالات غير محدودة (متاح عند فتح الجولات 14-27)',
      icon: '�',
      isUsed: chipsUsed.wildcard2.used,
      isActive: isChipActiveInCurrentGW(chipsUsed.wildcard2),
      gameweekUsed: chipsUsed.wildcard2.gameweek,
      canUse: canUseChip('wildcard2') && wildcard2Available,
      canUseInGW1: false
    },
    {
      key: 'benchBoost' as keyof ChipsUsed,
      nameEn: 'Bench Boost',
      nameAr: 'تعزيز البدلاء',
      descriptionEn: 'All 15 players earn points',
      descriptionAr: 'جميع اللاعبين الـ15 يحصلون على نقاط',
      icon: '🚀',
      isUsed: chipsUsed.benchBoost.used,
      isActive: isChipActiveInCurrentGW(chipsUsed.benchBoost),
      gameweekUsed: chipsUsed.benchBoost.gameweek,
      canUse: canUseChip('benchBoost'),
      canUseInGW1: true
    },
    {
      key: 'tripleCaptain' as keyof ChipsUsed,
      nameEn: 'Triple Captain',
      nameAr: 'القائد النشمي',
      descriptionEn: 'Captain scores 3x points',
      descriptionAr: 'القائد يحصل على 3 أضعاف النقاط',
      icon: '⭐',
      isUsed: chipsUsed.tripleCaptain.used,
      isActive: isChipActiveInCurrentGW(chipsUsed.tripleCaptain),
      gameweekUsed: chipsUsed.tripleCaptain.gameweek,
      canUse: canUseChip('tripleCaptain'),
      canUseInGW1: true
    }
  ]

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-900 flex items-center gap-2 text-lg">
          <span className="text-xl">🎯</span>
          {language === 'ar' ? 'أوامر المدرب ' : 'Power Chips'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Active Chip Warning */}
        {hasActiveChipInCurrentGW && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">⚠️</span>
              <p className="text-sm text-yellow-800">
                {language === 'ar'
                  ? `شريحة نشطة في الجولة ${currentGameweekId} - لا يمكن تفعيل شرائح أخرى`
                  : `A chip is active in GW${currentGameweekId} - other chips are disabled`
                }
              </p>
            </div>
          </div>
        )}

        {chipInfo.map((chip) => (
          <div
            key={chip.key}
            className={`p-3 rounded-lg border transition-all ${
              chip.isActive
                ? 'border-green-500 bg-green-50'
                : chip.canUse
                ? 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                : 'border-gray-300 bg-gray-100'
            }`}
          >
            <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-lg">{chip.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {language === 'ar' ? chip.nameAr : chip.nameEn}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    chip.isActive
                      ? 'bg-green-100 text-green-700'
                      : chip.isUsed
                      ? 'bg-red-100 text-red-700'
                      : chip.canUse
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {chip.isActive
                      ? (language === 'ar' ? 'نشط' : 'Active')
                      : chip.isUsed
                      ? (language === 'ar' ? `مستخدم في الجولة ${chip.gameweekUsed}` : `Used GW${chip.gameweekUsed}`)
                      : chip.canUse
                      ? (language === 'ar' ? 'متاح' : 'Available')
                      : hasActiveChipInCurrentGW && !isChipActiveInCurrentGW(chipsUsed[chip.key])
                      ? (language === 'ar' ? 'محظور - شريحة أخرى نشطة' : 'Blocked - Another chip active')
                      : (language === 'ar' ? 'غير متاح' : 'Unavailable')
                    }
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-xs mb-3">
              {language === 'ar' ? chip.descriptionAr : chip.descriptionEn}
            </p>

            <Button
              size="sm"
              variant={chip.isActive ? 'destructive' : chip.canUse ? 'default' : 'secondary'}
              className="w-full"
              disabled={
                (!chip.canUse && !chip.isActive) ||
                chip.isActive ||
                loading === chip.key ||
                disabled ||
                isDeadlinePassed ||
                !isGameweekOpen
              }
              onClick={() => handleChipActivation(chip.key)}
            >
              {loading === chip.key ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                  {language === 'ar' ? 'جارٍ التحديث...' : 'Updating...'}
                </div>
              ) : chip.isActive ? (
                language === 'ar' ? 'مُفعّل' : 'Active'
              ) : chip.canUse ? (
                language === 'ar' ? 'تفعيل' : 'Activate'
              ) : (
                language === 'ar' ? 'مستخدم' : 'Used'
              )}
            </Button>
          </div>
        ))}
      </CardContent>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'ar' ? 'تأكيد تفعيل الرقاقة' : 'Confirm Chip Activation'}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === 'ar'
                ? `هل أنت متأكد من تفعيل ${chipInfo.find(c => c.key === showConfirmModal)?.nameAr}؟`
                : `Are you sure you want to activate ${chipInfo.find(c => c.key === showConfirmModal)?.nameEn}?`
              }
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(null)}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={() => confirmChipActivation(showConfirmModal as keyof ChipsUsed)}
              >
                {language === 'ar' ? 'تأكيد' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
