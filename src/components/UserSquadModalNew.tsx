'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useGameweek } from '@/contexts/GameweekContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { User, Trophy, Users, Star } from 'lucide-react'
import { getUserSquadFromSubcollection, type SavedSquad, type SquadPlayer } from '@/lib/firebase/squadService'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface UserSquadModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  userRank: number
  totalPoints: number
}

function UserSquadModal({ isOpen, onClose, userId, userName, userRank, totalPoints }: UserSquadModalProps) {
  const { language } = useLanguage()
  const { currentGameweek, isDeadlinePassed } = useGameweek()
  const [squad, setSquad] = useState<SavedSquad | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGameweek, setSelectedGameweek] = useState(1)
  const [availableGameweeks, setAvailableGameweeks] = useState<number[]>([])

  // Set available gameweeks based on current gameweek and deadline status
  useEffect(() => {
    if (!currentGameweek) return

    const gameweekToShow = isDeadlinePassed ? currentGameweek.id : currentGameweek.id - 1
    
    console.log(`🎮 Gameweek Logic:`)
    console.log(`   Current Gameweek: ${currentGameweek.id}`)
    console.log(`   Deadline Passed: ${isDeadlinePassed}`)
    console.log(`   Gameweek to Show: ${gameweekToShow}`)
    
    // Only show the specific gameweek (no dropdown selection)
    if (gameweekToShow >= 1) {
      setAvailableGameweeks([gameweekToShow])
      setSelectedGameweek(gameweekToShow)
      console.log(`   Selected Gameweek set to: ${gameweekToShow}`)
    }
  }, [currentGameweek, isDeadlinePassed])

  const fetchUserSquad = useCallback(async () => {
    if (!userId) return

    // Calculate the correct gameweek directly here to avoid state issues
    if (!currentGameweek) return
    const correctGameweek = isDeadlinePassed ? currentGameweek.id : currentGameweek.id - 1
    
    if (correctGameweek < 1) return

    console.log(`🚀 Fetching squad for User: ${userId}, Gameweek: ${correctGameweek} (calculated directly)`)

    try {
      setLoading(true)
      setError(null)

      // Fetch squad data from Firebase
      const squadResult = await getUserSquadFromSubcollection(userId, correctGameweek)
      if (squadResult.success && squadResult.data) {
        // Now we need to fetch the gameweek-specific points for each player
        // We'll fetch from the players collection to get gameweek points
        const playersWithGameweekPoints = await Promise.all(
          squadResult.data.players.map(async (player) => {
            try {
              // Always fetch fresh gameweek-specific points - ignore any points in squad data
              let gameweekPoints = 0
              
              // First try API
              const playerDoc = await fetch(`/api/players/${player.playerId}/points?gameweek=${correctGameweek}`)
              if (playerDoc.ok) {
                const playerData = await playerDoc.json()
                gameweekPoints = playerData.points?.[`gw${correctGameweek}`] || 0
                console.log(`🔍 API: Player ${player.name} GW${correctGameweek} points:`, gameweekPoints)
              } else {
                console.log(`❌ API failed for ${player.name}, trying Firebase for GW${correctGameweek}`)
                // Fallback: use Firebase SDK
                try {
                  const playerDocRef = doc(db, 'players', player.playerId)
                  const playerSnapshot = await getDoc(playerDocRef)
                  if (playerSnapshot.exists()) {
                    const playerData = playerSnapshot.data()
                    const gameweekKey = `gw${correctGameweek}`
                    gameweekPoints = playerData.points?.[gameweekKey] || 0
                    console.log(`🔍 Firebase: Player ${player.name} GW${correctGameweek} points:`, gameweekPoints)
                    console.log(`🔍 Available gameweeks for ${player.name}:`, Object.keys(playerData.points || {}))
                    console.log(`🔍 Looking for gameweek key: ${gameweekKey}`)
                  }
                } catch (fbError) {
                  console.error(`Error fetching from Firebase for player ${player.playerId}:`, fbError)
                }
              }
              
              // Return player with fresh gameweek-specific points only
              return {
                ...player,
                points: gameweekPoints  // This completely replaces any old points
              }
            } catch (error) {
              console.error(`Error fetching points for player ${player.playerId}:`, error)
              return {
                ...player,
                points: 0  // Safe fallback
              }
            }
          })
        )

        const squadWithGameweekPoints = {
          ...squadResult.data,
          players: playersWithGameweekPoints
        }
        
        console.log(`🎯 Final squad for GW${correctGameweek}:`, squadWithGameweekPoints.players.map(p => ({
          name: p.name,
          points: p.points
        })))
        
        setSquad(squadWithGameweekPoints)
        // Update the selected gameweek state to match what we fetched
        setSelectedGameweek(correctGameweek)
      } else {
        setSquad(null)
        setError(`No squad found for gameweek ${correctGameweek}`)
      }
    } catch (error) {
      console.error('Error fetching user squad:', error)
      setError('Failed to load squad data')
      setSquad(null)
    } finally {
      setLoading(false)
    }
  }, [userId, currentGameweek, isDeadlinePassed])

  useEffect(() => {
    if (isOpen && userId && currentGameweek) {
      const correctGameweek = isDeadlinePassed ? currentGameweek.id : currentGameweek.id - 1
      console.log(`🔄 Modal opened - fetching squad for GW${correctGameweek}`)
      fetchUserSquad()
    }
  }, [isOpen, userId, currentGameweek, isDeadlinePassed, fetchUserSquad])

  const renderPlayer = (player: SquadPlayer, index: number) => {
    const basePoints = player.points || 0
    let displayPoints = basePoints
    let multiplier = 1
    
    // Apply captain multiplier if captain
    if (player.isCaptain) {
      const isTripleCaptain = squad?.chipsUsed?.tripleCaptain?.isActive && 
                             squad?.chipsUsed?.tripleCaptain?.gameweek === selectedGameweek
      multiplier = isTripleCaptain ? 3 : 2
      displayPoints = basePoints * multiplier
    }
    
    return (
      <div key={player.playerId} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold">
            {index + 1}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{player.name}</span>
              {player.isCaptain && (
                <span className="bg-yellow-400 text-white px-2 py-1 rounded-full text-xs font-bold">
                  {language === 'ar' ? 'ق' : 'C'}
                </span>
              )}
              {player.isCaptain && multiplier === 3 && (
                <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  3x
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {player.club} • {player.position}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-lg font-bold text-blue-600">
            {displayPoints} {language === 'ar' ? 'نقطة' : 'pts'}
            {multiplier > 1 && (
              <span className="text-xs text-gray-500 ml-1">
                ({basePoints} x {multiplier})
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {language === 'ar' ? `${selectedGameweek}` : `GW${selectedGameweek}`}
          </div>
          <div className="text-sm text-green-600">
            {player.price.toFixed(1)}M
          </div>
        </div>
      </div>
    )
  }

  const calculateTotalPoints = () => {
    if (!squad) return 0
    
    let totalPoints = 0
    const startingPlayers = squad.players.filter(p => p.isStarting)
    const benchPlayers = squad.players.filter(p => !p.isStarting)
    
    // Calculate starting XI points
    startingPlayers.forEach(player => {
      const basePoints = player.points || 0
      let finalPoints = basePoints
      
      // Apply captain multiplier
      if (player.isCaptain) {
        const isTripleCaptain = squad.chipsUsed?.tripleCaptain?.isActive && 
                              squad.chipsUsed?.tripleCaptain?.gameweek === selectedGameweek
        finalPoints = basePoints * (isTripleCaptain ? 3 : 2)
      }
      
      totalPoints += finalPoints
    })
    
    // Add bench points if Bench Boost is active
    const isBenchBoostActive = squad.chipsUsed?.benchBoost?.isActive && 
                               squad.chipsUsed?.benchBoost?.gameweek === selectedGameweek
    if (isBenchBoostActive) {
      benchPlayers.forEach(player => {
        totalPoints += (player.points || 0)
      })
    }
    
    return totalPoints
  }

  const getActiveChip = () => {
    if (!squad?.chipsUsed) return null
    
    const { chipsUsed } = squad
    if (chipsUsed.tripleCaptain?.isActive && chipsUsed.tripleCaptain?.gameweek === selectedGameweek) {
      return language === 'ar' ? 'القائد النشمي' : 'Triple Captain'
    }
    if (chipsUsed.benchBoost?.isActive && chipsUsed.benchBoost?.gameweek === selectedGameweek) {
      return language === 'ar' ? 'تعزيز البدلاء' : 'Bench Boost'
    }
    if (chipsUsed.wildcard1?.isActive && chipsUsed.wildcard1?.gameweek === selectedGameweek) {
      return language === 'ar' ? 'البطاقة البرية 1' : 'Wildcard 1'
    }
    if (chipsUsed.wildcard2?.isActive && chipsUsed.wildcard2?.gameweek === selectedGameweek) {
      return language === 'ar' ? 'البطاقة البرية 2' : 'Wildcard 2'
    }
    if (chipsUsed.freeHit?.isActive && chipsUsed.freeHit?.gameweek === selectedGameweek) {
      return language === 'ar' ? 'الضربة الحرة' : 'Free Hit'
    }
    
    return null
  }

  if (!squad && !loading && !error) {
    return null
  }

  const startingPlayers = squad?.players.filter((player: SquadPlayer) => player.isStarting) || []
  const benchPlayers = squad?.players.filter((player: SquadPlayer) => !player.isStarting) || []
  
  const goalkeepers = startingPlayers.filter((p: SquadPlayer) => p.position === 'GKP')
  const defenders = startingPlayers.filter((p: SquadPlayer) => p.position === 'DEF')
  const midfielders = startingPlayers.filter((p: SquadPlayer) => p.position === 'MID')
  const forwards = startingPlayers.filter((p: SquadPlayer) => p.position === 'FWD')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {userName}
            <span className="text-sm text-gray-500">
              #{userRank} | {totalPoints} {language === 'ar' ? 'نقطة' : 'pts'}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Gameweek Info */}
        <div className="mb-4">
          <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {language === 'ar' ? `الجولة ${selectedGameweek}` : `Gameweek ${selectedGameweek}`}
            </span>
            {currentGameweek && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isDeadlinePassed 
                  ? (language === 'ar' ? 'الجولة الحالية' : 'Current Gameweek')
                  : (language === 'ar' ? 'آخر جولة مكتملة' : 'Last Completed Gameweek')
                }
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-gray-600">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button 
                variant="outline" 
                onClick={fetchUserSquad}
                className="mt-2"
              >
                {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </Button>
            </div>
          </div>
        ) : squad ? (
          <div className="space-y-6">
            {/* Squad Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{calculateTotalPoints()}</div>
                  <div className="text-sm text-gray-600">{language === 'ar' ? 'نقاط الجولة' : 'GW Points'}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {defenders.length}-{midfielders.length}-{forwards.length}
                  </div>
                  <div className="text-sm text-gray-600">{language === 'ar' ? 'التشكيل الأساسي' : 'Formation'}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{language === 'ar' ? `${selectedGameweek}` : `GW${selectedGameweek}`}</div>
                  <div className="text-sm text-gray-600">{language === 'ar' ? 'الجولة' : 'Gameweek'}</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-orange-600">
                    {getActiveChip() ? (
                      <span className="text-sm">
                        {getActiveChip()}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        {language === 'ar' ? 'لا توجد بطاقة' : 'No Chip'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{language === 'ar' ? 'البطاقة المستخدمة' : 'Chip Used'}</div>
                </div>
              </div>
            </div>

            {/* Starting XI - Ordered by Position */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {language === 'ar' ? 'التشكيل الأساسي' : 'Starting XI'}
              </h3>
              
              <div className="space-y-4">
                {/* Goalkeepers */}
                {goalkeepers.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2 px-2">
                      {language === 'ar' ? 'حراس المرمى' : 'Goalkeepers'}
                    </div>
                    <div className="space-y-2">
                      {goalkeepers.map((player: SquadPlayer, index: number) => renderPlayer(player, index))}
                    </div>
                  </div>
                )}

                {/* Defenders */}
                {defenders.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2 px-2">
                      {language === 'ar' ? 'المدافعون' : 'Defenders'}
                    </div>
                    <div className="space-y-2">
                      {defenders.map((player: SquadPlayer, index: number) => renderPlayer(player, goalkeepers.length + index))}
                    </div>
                  </div>
                )}

                {/* Midfielders */}
                {midfielders.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2 px-2">
                      {language === 'ar' ? 'لاعبو الوسط' : 'Midfielders'}
                    </div>
                    <div className="space-y-2">
                      {midfielders.map((player: SquadPlayer, index: number) => renderPlayer(player, goalkeepers.length + defenders.length + index))}
                    </div>
                  </div>
                )}

                {/* Forwards */}
                {forwards.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2 px-2">
                      {language === 'ar' ? 'المهاجمون' : 'Forwards'}
                    </div>
                    <div className="space-y-2">
                      {forwards.map((player: SquadPlayer, index: number) => renderPlayer(player, goalkeepers.length + defenders.length + midfielders.length + index))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bench */}
            {benchPlayers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {language === 'ar' ? 'المقاعد البديلة' : 'Bench'}
                  {squad?.chipsUsed?.benchBoost?.isActive && squad?.chipsUsed?.benchBoost?.gameweek === selectedGameweek && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold ml-2">
                      {language === 'ar' ? 'نشط' : 'ACTIVE'}
                    </span>
                  )}
                </h3>
                
                {squad?.chipsUsed?.benchBoost?.isActive && squad?.chipsUsed?.benchBoost?.gameweek === selectedGameweek && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-green-800 text-sm">
                      {language === 'ar' 
                        ? '🚀 تعزيز البدلاء نشط - نقاط البدلاء محسوبة في المجموع!' 
                        : '🚀 Bench Boost active - bench points count towards total!'}
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {benchPlayers.map((player: SquadPlayer, index: number) => renderPlayer(player, startingPlayers.length + index))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default UserSquadModal
